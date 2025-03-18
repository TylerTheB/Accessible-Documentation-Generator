/**
 * Default template for accessible documentation
 */

/**
 * Apply template to HTML content
 * @param {string} content - HTML content
 * @param {Object} frontmatter - Document frontmatter
 * @param {Object} config - Configuration options
 * @returns {string} Complete HTML document
 */
function applyTemplate(content, frontmatter, config) {
  const title = frontmatter.title || 'Documentation';
  const description = frontmatter.description || '';
  const language = frontmatter.language || 'en';
  const theme = frontmatter.theme || config.theme || 'light';
  
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <title>${title}</title>
    
    <!-- Preload fonts -->
    <link rel="preload" href="/assets/fonts/roboto-v30-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/assets/fonts/roboto-v30-latin-700.woff2" as="font" type="font/woff2" crossorigin>
    
    <!-- Base styles -->
    <link rel="stylesheet" href="/assets/css/normalize.css">
    <link rel="stylesheet" href="/assets/css/base.css">
    
    <!-- Theme styles -->
    <link rel="stylesheet" href="/assets/css/themes/${theme}.css">
    
    <!-- High contrast theme (optional) -->
    <link rel="stylesheet" href="/assets/css/themes/high-contrast.css" disabled id="high-contrast-stylesheet">
    
    <!-- Code highlighting -->
    <link rel="stylesheet" href="/assets/css/highlight.css">
    
    <!-- Accessibility enhancements -->
    <script>
      // Check for saved user preferences
      document.addEventListener('DOMContentLoaded', function() {
        // Apply user's preferred theme if set
        const userTheme = localStorage.getItem('preferredTheme');
        if (userTheme) {
          document.documentElement.setAttribute('data-theme', userTheme);
        }
        
        // Apply user's preferred font size if set
        const userFontSize = localStorage.getItem('preferredFontSize');
        if (userFontSize) {
          document.documentElement.style.fontSize = userFontSize;
        }
        
        // Apply high contrast if user prefers it
        const highContrast = localStorage.getItem('highContrast') === 'true';
        if (highContrast) {
          document.getElementById('high-contrast-stylesheet').disabled = false;
        }
        
        // Apply reduced motion if user prefers it
        const reducedMotion = localStorage.getItem('reducedMotion') === 'true' || 
                             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
          document.documentElement.classList.add('reduced-motion');
        }
      });
    </script>
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <header role="banner">
        <div class="container">
            <nav aria-label="Main Navigation">
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/docs/">Documentation</a></li>
                    ${config.navLinks ? config.navLinks.map(link => 
                      `<li><a href="${link.url}">${link.title}</a></li>`
                    ).join('\n                    ') : ''}
                </ul>
            </nav>
            
            <div class="a11y-controls">
                <button id="toggle-high-contrast" aria-pressed="false">
                    High Contrast
                </button>
                <div class="font-size-controls">
                    <button id="decrease-font" aria-label="Decrease font size">A-</button>
                    <button id="reset-font" aria-label="Reset font size">A</button>
                    <button id="increase-font" aria-label="Increase font size">A+</button>
                </div>
                <select id="theme-selector" aria-label="Select theme">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="sepia">Sepia</option>
                </select>
            </div>
        </div>
    </header>
    
    <div class="container">
        <aside class="sidebar" role="complementary" aria-label="Table of Contents">
            <nav aria-label="Table of Contents">
                <div id="toc">
                    <!-- Table of contents will be generated here by JavaScript -->
                </div>
            </nav>
        </aside>
        
        <main id="main-content" tabindex="-1">
            <article>
                <h1>${title}</h1>
                ${content}
            </article>
        </main>
    </div>
    
    <footer role="contentinfo">
        <div class="container">
            <p>Created with AccessDocs - Accessible Documentation Generator</p>
            ${config.footerText ? `<p>${config.footerText}</p>` : ''}
        </div>
    </footer>
    
    <!-- Accessibility enhancement scripts -->
    <script src="/assets/js/accessibility.js"></script>
    
    <!-- Table of contents generator -->
    <script src="/assets/js/toc.js"></script>
    
    <!-- Code highlighting -->
    <script src="/assets/js/highlight.js"></script>
    
    <script>
        // Initialize accessibility features
        document.addEventListener('DOMContentLoaded', function() {
            // Generate table of contents
            generateTableOfContents('main h2, main h3, main h4', '#toc');
            
            // Initialize high contrast toggle
            initHighContrastToggle('toggle-high-contrast', 'high-contrast-stylesheet');
            
            // Initialize font size controls
            initFontSizeControls('decrease-font', 'reset-font', 'increase-font');
            
            // Initialize theme selector
            initThemeSelector('theme-selector');
            
            // Highlight code blocks
            highlightCodeBlocks();
        });
    </script>
</body>
</html>`;
}

module.exports = {
  applyTemplate
};
