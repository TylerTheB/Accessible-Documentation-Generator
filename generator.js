const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const HTMLParser = require('node-html-parser');
const { checkAccessibility } = require('./accessibility/checker');
const { enhanceWithAria } = require('./accessibility/aria');
const { applyTemplate } = require('./templates/default');
const { getConfig } = require('./config');

/**
 * Documentation Generator class specifically focused on accessibility
 */
class AccessibleDocGenerator {
  constructor(options = {}) {
    this.options = {
      inputDir: 'docs',
      outputDir: 'build',
      ...options
    };
    
    this.config = getConfig();
    
    // Initialize markdown parser with accessibility-focused configuration
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
    
    // Add anchor links with proper aria attributes
    this.md.use(markdownItAnchor, {
      permalink: true,
      permalinkClass: 'header-anchor',
      permalinkSymbol: '#',
      permalinkAttrs: (slug) => ({
        'aria-label': `Permalink to "${slug}"`,
        'title': `Permalink to "${slug}"`,
        'tabindex': '0'
      })
    });
    
    // Custom rules for accessibility
    this.setupAccessibilityRules();
  }
  
  /**
   * Configure markdown parser with accessibility-focused rules
   */
  setupAccessibilityRules() {
    // Enhance image rendering with proper alt text requirements
    const defaultImageRenderer = this.md.renderer.rules.image;
    this.md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const altAttr = token.attrIndex('alt');
      const srcAttr = token.attrIndex('src');
      
      // Ensure alt attribute exists
      if (altAttr < 0) {
        token.attrPush(['alt', 'Image']);
        console.warn('Warning: Image missing alt text. Added placeholder.');
      } else if (token.attrs[altAttr][1] === '') {
        console.warn('Warning: Image has empty alt text.');
      }
      
      // Add additional accessibility attributes
      token.attrPush(['loading', 'lazy']);
      
      return defaultImageRenderer(tokens, idx, options, env, self);
    };
    
    // Enhance link rendering with proper attributes
    const defaultLinkRenderer = this.md.renderer.rules.link_open;
    this.md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      
      // External links should have proper attributes
      const href = token.attrGet('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        token.attrPush(['rel', 'noopener noreferrer']);
        
        // Add indication that it's an external link for screen readers
        if (this.config.indicateExternalLinks) {
          token.attrPush([
            'aria-label', 
            `External link: ${tokens[idx + 1].content}`
          ]);
        }
      }
      
      return defaultLinkRenderer 
        ? defaultLinkRenderer(tokens, idx, options, env, self) 
        : self.renderToken(tokens, idx, options);
    };
    
    // Enhance code blocks for screen readers
    const defaultCodeRenderer = this.md.renderer.rules.fence;
    this.md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const lang = token.info.trim();
      const langName = lang || 'text';
      
      // Create more accessible HTML for code blocks
      const code = defaultCodeRenderer(tokens, idx, options, env, self);
      const codeHtml = HTMLParser.parse(code);
      
      // Add accessibility enhancements
      if (codeHtml.querySelector('pre')) {
        codeHtml.querySelector('pre').setAttribute('tabindex', '0');
        codeHtml.querySelector('pre').setAttribute('role', 'region');
        codeHtml.querySelector('pre').setAttribute('aria-label', `Code example in ${langName}`);
      }
      
      return codeHtml.toString();
    };
  }
  
  /**
   * Generate documentation from source files
   */
  async generateDocs() {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputDir, { recursive: true });
      
      // Read all markdown files
      const files = await this.getMarkdownFiles();
      
      // Process each file
      for (const file of files) {
        await this.processFile(file);
      }
      
      // Generate index if needed
      if (this.config.generateIndex) {
        await this.generateIndex(files);
      }
      
      // Copy assets
      await this.copyAssets();
      
      return { success: true, filesProcessed: files.length };
    } catch (error) {
      console.error('Error generating documentation:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get all markdown files from input directory
   */
  async getMarkdownFiles() {
    const inputPath = path.resolve(this.options.inputDir);
    const allFiles = await this.getFilesRecursively(inputPath);
    return allFiles.filter(file => file.endsWith('.md'));
  }
  
  /**
   * Recursively get all files from a directory
   */
  async getFilesRecursively(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    const files = await Promise.all(
      entries.map(async entry => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() 
          ? this.getFilesRecursively(fullPath) 
          : fullPath;
      })
    );
    
    return files.flat();
  }
  
  /**
   * Process a single markdown file
   */
  async processFile(filePath) {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf8');
      
      // Parse frontmatter and markdown
      const { data: frontmatter, content: markdown } = matter(content);
      
      // Convert markdown to HTML
      let html = this.md.render(markdown);
      
      // Parse the HTML to make additional accessibility enhancements
      const parsedHtml = HTMLParser.parse(html);
      
      // Enhance with ARIA attributes
      enhanceWithAria(parsedHtml, frontmatter);
      
      // Run accessibility checks if enabled
      if (this.config.checkAccessibility) {
        const accessibilityIssues = await checkAccessibility(parsedHtml.toString());
        
        if (accessibilityIssues.length > 0) {
          console.warn(`Accessibility issues in ${filePath}:`, accessibilityIssues);
        }
      }
      
      // Apply template
      const finalHtml = applyTemplate(parsedHtml.toString(), frontmatter, this.config);
      
      // Determine output path
      const relativePath = path.relative(this.options.inputDir, filePath);
      const outputPath = path.join(
        this.options.outputDir, 
        relativePath.replace(/\.md$/, '.html')
      );
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Write file
      await fs.writeFile(outputPath, finalHtml);
      
      console.log(`Generated: ${outputPath}`);
      return { success: true, outputPath };
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Generate index page with accessible navigation
   */
  async generateIndex(files) {
    // Create accessible index content with proper landmark roles
    let indexContent = '# Documentation Index\n\n';
    indexContent += '<nav aria-label="Documentation pages">\n\n';
    
    // Group files by directory for better organization
    const filesByDirectory = {};
    
    for (const file of files) {
      const relativePath = path.relative(this.options.inputDir, file);
      const dirname = path.dirname(relativePath);
      
      if (!filesByDirectory[dirname]) {
        filesByDirectory[dirname] = [];
      }
      
      // Read file to get title from frontmatter
      const content = await fs.readFile(file, 'utf8');
      const { data: frontmatter } = matter(content);
      const title = frontmatter.title || path.basename(file, '.md');
      
      filesByDirectory[dirname].push({
        path: relativePath.replace(/\.md$/, '.html'),
        title
      });
    }
    
    // Generate structured navigation
    for (const [directory, dirFiles] of Object.entries(filesByDirectory)) {
      if (directory !== '.') {
        indexContent += `## ${directory}\n\n`;
      }
      
      indexContent += '<ul>\n';
      
      for (const file of dirFiles) {
        indexContent += `  <li><a href="${file.path}">${file.title}</a></li>\n`;
      }
      
      indexContent += '</ul>\n\n';
    }
    
    indexContent += '</nav>';
    
    // Write index file
    const outputPath = path.join(this.options.outputDir, 'index.html');
    const html = this.md.render(indexContent);
    const finalHtml = applyTemplate(html, { title: 'Documentation Index' }, this.config);
    
    await fs.writeFile(outputPath, finalHtml);
    console.log(`Generated index: ${outputPath}`);
  }
  
  /**
   * Copy assets (CSS, JS, images) to output directory
   */
  async copyAssets() {
    const assetsDir = path.join(__dirname, '../assets');
    const outputAssetsDir = path.join(this.options.outputDir, 'assets');
    
    try {
      await fs.mkdir(outputAssetsDir, { recursive: true });
      
      // Copy default assets
      const assets = await fs.readdir(assetsDir);
      
      for (const asset of assets) {
        const srcPath = path.join(assetsDir, asset);
        const destPath = path.join(outputAssetsDir, asset);
        
        const stat = await fs.stat(srcPath);
        
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath);
        } else if (stat.isDirectory()) {
          // Recursively copy directories
          await this.copyDirectory(srcPath, destPath);
        }
      }
      
      // Copy custom assets if specified
      if (this.config.customAssets) {
        const customAssetsDir = path.resolve(this.config.customAssets);
        await this.copyDirectory(customAssetsDir, outputAssetsDir);
      }
      
      console.log('Assets copied successfully');
    } catch (error) {
      console.error('Error copying assets:', error);
    }
  }
  
  /**
   * Recursively copy a directory
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

module.exports = AccessibleDocGenerator;