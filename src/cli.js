#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const AccessibleDocGenerator = require('./generator');
const { createDefaultConfig, getConfig } = require('./config');
const server = require('./server');
const packageJson = require('../package.json');

// Configure CLI
program
  .name('accessdocs')
  .description('Generate accessible documentation')
  .version(packageJson.version);

/**
 * Initialize a new documentation project
 */
program
  .command('init')
  .description('Initialize a new documentation project')
  .argument('[directory]', 'Project directory', '.')
  .option('-y, --yes', 'Skip prompts and use defaults', false)
  .action(async (directory, options) => {
    const spinner = ora('Initializing new project').start();
    
    try {
      // Create project directory
      const projectPath = path.resolve(directory);
      await fs.mkdir(projectPath, { recursive: true });
      
      // If not using defaults, prompt for configuration
      let config = {};
      
      if (!options.yes) {
        spinner.stop();
        
        config = await inquirer.prompt([
          {
            type: 'input',
            name: 'inputDir',
            message: 'Documentation source directory:',
            default: 'docs'
          },
          {
            type: 'input',
            name: 'outputDir',
            message: 'Build output directory:',
            default: 'build'
          },
          {
            type: 'list',
            name: 'theme',
            message: 'Default theme:',
            choices: ['light', 'dark', 'sepia'],
            default: 'light'
          },
          {
            type: 'list',
            name: 'wcagLevel',
            message: 'WCAG compliance level:',
            choices: ['A', 'AA', 'AAA'],
            default: 'AA'
          },
          {
            type: 'confirm',
            name: 'generateSimplifiedView',
            message: 'Generate simplified view for cognitive accessibility?',
            default: true
          }
        ]);
        
        spinner.start('Creating project structure');
      }
      
      // Create directory structure
      const directories = [
        path.join(projectPath, config.inputDir || 'docs'),
        path.join(projectPath, 'assets', 'css'),
        path.join(projectPath, 'assets', 'js'),
        path.join(projectPath, 'assets', 'fonts'),
        path.join(projectPath, 'assets', 'images')
      ];
      
      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }
      
      // Create configuration file
      const configPath = path.join(projectPath, 'accessdocs.config.js');
      createDefaultConfig(configPath, 'js');
      
      // Create sample documentation file
      const sampleDocsPath = path.join(projectPath, config.inputDir || 'docs', 'getting-started.md');
      const sampleDocsContent = `---
title: Getting Started with AccessDocs
description: Learn how to create accessible documentation using AccessDocs
language: en
---

# Getting Started with AccessDocs

AccessDocs is a documentation generator focused on creating highly accessible documentation that works seamlessly with screen readers and other assistive technologies.

## Installation

You can install AccessDocs globally using npm:

\`\`\`bash
npm install -g accessdocs
\`\`\`

## Basic Usage

1. Initialize a new documentation project:

\`\`\`bash
accessdocs init my-project
\`\`\`

2. Add your markdown content to the \`docs\` directory.

3. Build your documentation:

\`\`\`bash
accessdocs build
\`\`\`

4. Preview your documentation:

\`\`\`bash
accessdocs serve
\`\`\`

## Accessibility Features

AccessDocs provides several features to ensure your documentation is accessible:

- **Screen Reader Optimization**: All content is structured for optimal screen reader navigation
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **High Contrast Mode**: Toggle between standard and high contrast views
- **Font Size Controls**: Easily adjust text size for readability
- **Simplified View**: Toggle a simplified view for users with cognitive disabilities
- **WCAG Compliance**: Automatic checks against WCAG guidelines
`;
      
      await fs.writeFile(sampleDocsPath, sampleDocsContent);
      
      spinner.succeed('Project initialized successfully');
      console.log(`
${chalk.green('✓')} Created project structure
${chalk.green('✓')} Created configuration file: ${chalk.cyan('accessdocs.config.js')}
${chalk.green('✓')} Created sample documentation: ${chalk.cyan(`${config.inputDir || 'docs'}/getting-started.md`)}

${chalk.bold('Next steps:')}
  1. Add your markdown files to the ${chalk.cyan(config.inputDir || 'docs')} directory
  2. Customize your configuration in ${chalk.cyan('accessdocs.config.js')}
  3. Build your documentation with ${chalk.cyan('accessdocs build')}
  4. Preview your documentation with ${chalk.cyan('accessdocs serve')}
`);
    } catch (error) {
      spinner.fail('Failed to initialize project');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Build documentation
 */
program
  .command('build')
  .description('Build documentation')
  .option('-c, --config <file>', 'Path to configuration file')
  .option('-i, --input <dir>', 'Input directory')
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --watch', 'Watch for changes and rebuild')
  .action(async (options) => {
    const spinner = ora('Building documentation').start();
    
    try {
      // If custom config file provided, set environment variable
      if (options.config) {
        process.env.ACCESSDOCS_CONFIG_PATH = options.config;
      }
      
      // Get configuration
      const config = getConfig();
      
      // Override with command line options
      if (options.input) config.inputDir = options.input;
      if (options.output) config.outputDir = options.output;
      if (options.watch) config.watch = true;
      
      // Initialize generator
      const generator = new AccessibleDocGenerator({
        inputDir: config.inputDir,
        outputDir: config.outputDir
      });
      
      // Build documentation
      const result = await generator.generateDocs();
      
      if (result.success) {
        spinner.succeed(`Documentation built successfully (${result.filesProcessed} files)`);
        
        // Start watcher if requested
        if (config.watch) {
          startWatcher(config, generator);
        }
      } else {
        spinner.fail('Failed to build documentation');
        console.error(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Failed to build documentation');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Serve documentation
 */
program
  .command('serve')
  .description('Serve documentation')
  .option('-c, --config <file>', 'Path to configuration file')
  .option('-p, --port <port>', 'Port to serve on', '3000')
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --watch', 'Watch for changes and rebuild')
  .action(async (options) => {
    try {
      // If custom config file provided, set environment variable
      if (options.config) {
        process.env.ACCESSDOCS_CONFIG_PATH = options.config;
      }
      
      // Get configuration
      const config = getConfig();
      
      // Override with command line options
      if (options.output) config.outputDir = options.output;
      if (options.watch) config.watch = true;
      
      // Initialize generator
      const generator = new AccessibleDocGenerator({
        inputDir: config.inputDir,
        outputDir: config.outputDir
      });
      
      // Build documentation if needed
      if (!fs.existsSync(config.outputDir)) {
        const spinner = ora('Building documentation').start();
        const result = await generator.generateDocs();
        
        if (result.success) {
          spinner.succeed(`Documentation built successfully (${result.filesProcessed} files)`);
        } else {
          spinner.fail('Failed to build documentation');
          console.error(chalk.red(`Error: ${result.error}`));
          process.exit(1);
        }
      }
      
      // Start server
      const port = parseInt(options.port);
      server.start(config.outputDir, port);
      
      console.log(`
${chalk.green('✓')} Documentation server running at ${chalk.cyan(`http://localhost:${port}`)}
${chalk.bold('Accessibility features:')}
  - Press ${chalk.cyan('F2')} to show keyboard shortcuts
  - Press ${chalk.cyan('Alt+S')} to toggle simplified view
  - Press ${chalk.cyan('Alt+C')} to toggle high contrast mode
  - Press ${chalk.cyan('Alt+A')} to run accessibility check
      `);
      
      // Start watcher if requested
      if (config.watch) {
        startWatcher(config, generator);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Test accessibility
 */
program
  .command('test')
  .description('Test documentation for accessibility issues')
  .option('-c, --config <file>', 'Path to configuration file')
  .option('-i, --input <dir>', 'Input directory')
  .option('-o, --output <dir>', 'Output directory')
  .option('-l, --level <level>', 'WCAG level (A, AA, AAA)', 'AA')
  .action(async (options) => {
    const spinner = ora('Testing documentation for accessibility issues').start();
    
    try {
      // If custom config file provided, set environment variable
      if (options.config) {
        process.env.ACCESSDOCS_CONFIG_PATH = options.config;
      }
      
      // Get configuration
      const config = getConfig();
      
      // Override with command line options
      if (options.input) config.inputDir = options.input;
      if (options.output) config.outputDir = options.output;
      if (options.level) config.wcagLevel = options.level;
      
      // Ensure accessibility checking is enabled
      config.checkAccessibility = true;
      config.checkWCAG = true;
      config.checkHeadingHierarchy = true;
      config.checkColorContrast = true;
      config.validateHTML = true;
      config.checkARIA = true;
      config.checkKeyboardAccessibility = true;
      config.checkScreenReaderAnnouncements = true;
      
      // Initialize generator with forced accessibility checking
      const generator = new AccessibleDocGenerator({
        inputDir: config.inputDir,
        outputDir: config.outputDir,
        config
      });
      
      // Build documentation with accessibility checks
      const result = await generator.generateDocs();
      
      if (result.success) {
        spinner.succeed('Accessibility testing completed');
      } else {
        spinner.fail('Failed to test documentation');
        console.error(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Failed to test documentation');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Start file watcher for auto-rebuilding
 * @param {Object} config - Configuration object
 * @param {AccessibleDocGenerator} generator - Documentation generator instance
 */
function startWatcher(config, generator) {
  const chokidar = require('chokidar');
  
  console.log(chalk.blue('Watching for changes...'));
  
  // Watch input directory for changes
  const watcher = chokidar.watch(config.inputDir, {
    ignored: /(^|[\/\\])\../, // Ignore dot files
    persistent: true
  });
  
  // Re-build on changes
  watcher.on('change', async (path) => {
    const spinner = ora(`File changed: ${path}`).start();
    
    try {
      const result = await generator.generateDocs();
      
      if (result.success) {
        spinner.succeed(`Rebuilt documentation (${result.filesProcessed} files)`);
        
        // Notify server of changes if running
        if (server.isRunning()) {
          server.notifyChanges();
        }
      } else {
        spinner.fail('Failed to rebuild documentation');
        console.error(chalk.red(`Error: ${result.error}`));
      }
    } catch (error) {
      spinner.fail('Failed to rebuild documentation');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });
}

// Parse command line arguments
program.parse();

// Show help if no command specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}