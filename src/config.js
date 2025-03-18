const fs = require('fs');
const path = require('path');

/**
 * Default configuration for AccessDocs
 */
const defaultConfig = {
  // General settings
  inputDir: 'docs',
  outputDir: 'build',
  assetsDir: 'assets',
  
  // Theme settings
  theme: 'light',
  customCss: null,
  
  // Navigation
  generateIndex: true,
  generateSitemap: true,
  navLinks: [],
  
  // Accessibility settings
  wcagLevel: 'AA',
  indicateExternalLinks: true,
  checkAccessibility: true,
  checkWCAG: true,
  checkHeadingHierarchy: true,
  checkColorContrast: true,
  validateHTML: true,
  checkARIA: true,
  checkKeyboardAccessibility: true,
  checkScreenReaderAnnouncements: true,
  
  // Cognitive accessibility settings
  generateSimplifiedView: true,
  readabilityTarget: 'grade8',
  
  // Advanced settings
  customTemplate: null,
  customAssets: null,
  footerText: '',
  
  // Build settings
  minify: false,
  watch: false,
  verbose: false
};

/**
 * Load configuration from accessdocs.config.js if it exists
 * @returns {Object} Configuration object
 */
function getConfig() {
  let userConfig = {};
  
  // Configuration file paths to check
  const configPaths = [
    'accessdocs.config.js',
    'accessdocs.config.json',
    '.accessdocsrc',
    '.accessdocsrc.js',
    '.accessdocsrc.json'
  ];
  
  // Find the first config file that exists
  for (const configPath of configPaths) {
    const fullPath = path.resolve(process.cwd(), configPath);
    
    if (fs.existsSync(fullPath)) {
      try {
        if (configPath.endsWith('.js')) {
          userConfig = require(fullPath);
        } else {
          userConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        }
        
        console.log(`Loaded configuration from ${configPath}`);
        break;
      } catch (error) {
        console.warn(`Error loading configuration from ${configPath}:`, error.message);
      }
    }
  }
  
  // Merge default and user configs
  return { ...defaultConfig, ...userConfig };
}

/**
 * Create a default configuration file
 * @param {string} outputPath - Path to create the configuration file
 * @param {string} format - File format (js or json)
 * @returns {boolean} Success status
 */
function createDefaultConfig(outputPath, format = 'js') {
  try {
    let configContent;
    
    if (format === 'js') {
      configContent = `/**
 * AccessDocs Configuration
 */
module.exports = ${JSON.stringify(defaultConfig, null, 2)};
`;
    } else {
      configContent = JSON.stringify(defaultConfig, null, 2);
    }
    
    fs.writeFileSync(outputPath, configContent);
    return true;
  } catch (error) {
    console.error('Error creating configuration file:', error);
    return false;
  }
}

module.exports = {
  getConfig,
  createDefaultConfig,
  defaultConfig
};