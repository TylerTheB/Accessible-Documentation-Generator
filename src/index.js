const AccessibleDocGenerator = require('./generator');
const { getConfig } = require('./config');
const chalk = require('chalk');

/**
 * Main entry point for AccessDocs
 * @param {Object} options - Configuration options
 * @returns {Promise} Result of the generation process
 */
async function generateDocs(options = {}) {
  try {
    // Get configuration
    const config = getConfig();
    
    // Override with provided options
    const finalConfig = { ...config, ...options };
    
    // Initialize generator
    const generator = new AccessibleDocGenerator({
      inputDir: finalConfig.inputDir,
      outputDir: finalConfig.outputDir,
      config: finalConfig
    });
    
    // Generate documentation
    console.log(chalk.blue('Generating accessible documentation...'));
    const result = await generator.generateDocs();
    
    if (result.success) {
      console.log(chalk.green(`✓ Documentation generated successfully (${result.filesProcessed} files)`));
      return { success: true, ...result };
    } else {
      console.error(chalk.red(`✗ Failed to generate documentation: ${result.error}`));
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(chalk.red(`✗ Error: ${error.message}`));
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateDocs,
  AccessibleDocGenerator
};