/**
 * Accessibility enhancement features for the documentation
 */

/**
 * Initialize high contrast toggle functionality
 * @param {string} buttonId - ID of the high contrast toggle button
 * @param {string} stylesheetId - ID of the high contrast stylesheet
 */
function initHighContrastToggle(buttonId, stylesheetId) {
  const button = document.getElementById(buttonId);
  const stylesheet = document.getElementById(stylesheetId);
  
  if (!button || !stylesheet) return;
  
  // Check saved preference
  const highContrast = localStorage.getItem('highContrast') === 'true';
  
  // Set initial state
  stylesheet.disabled = !highContrast;
  button.setAttribute('aria-pressed', highContrast.toString());
  
  if (highContrast) {
    document.documentElement.classList.add('high-contrast');
  }
  
  // Add event listener
  button.addEventListener('click', () => {
    const isEnabled = stylesheet.disabled === false;
    
    // Toggle stylesheet
    stylesheet.disabled = isEnabled;
    
    // Update button state
    button.setAttribute('aria-pressed', (!isEnabled).toString());
    
    // Save preference
    localStorage.setItem('highContrast', (!isEnabled).toString());
    
    // Update document class
    if (!isEnabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Announce change to screen readers
    announceToScreenReader(`High contrast mode ${!isEnabled ? 'enabled' : 'disabled'}`);
  });
  
  // Add keyboard shortcut (Alt+C)
  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.key.toLowerCase() === 'c') {
      button.click();
      event.preventDefault();
    }
  });
}

/**
 * Initialize font size control functionality
 * @param {string} decreaseButtonId - ID of the decrease font size button
 * @param {string} resetButtonId - ID of the reset font size button
 * @param {string} increaseButtonId - ID of the increase font size button
 */
function initFontSizeControls(decreaseButtonId, resetButtonId, increaseButtonId) {
  const decreaseButton = document.getElementById(decreaseButtonId);
  const resetButton = document.getElementById(resetButtonId);
  const increaseButton = document.getElementById(increaseButtonId);
  
  if (!decreaseButton || !resetButton || !increaseButton) return;
  
  // Default font size (100% = 16px typically)
  const defaultSize = 100;
  
  // Get saved font size or use default
  const savedSize = localStorage.getItem('preferredFontSize');
  let currentSize = savedSize ? parseInt(savedSize) : defaultSize;
  
  // Apply saved size on page load
  if (savedSize) {
    document.documentElement.style.fontSize = `${currentSize}%`;
  }
  
  // Decrease font size
  decreaseButton.addEventListener('click', () => {
    if (currentSize > 80) {
      currentSize -= 10;
      updateFontSize(currentSize);
    }
  });
  
  // Reset font size
  resetButton.addEventListener('click', () => {
    currentSize = defaultSize;
    updateFontSize(currentSize);
  });
  
  // Increase font size
  increaseButton.addEventListener('click', () => {
    if (currentSize < 200) {
      currentSize += 10;
      updateFontSize(currentSize);
    }
  });
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.key === '-') {
      decreaseButton.click();
      event.preventDefault();
    } else if (event.altKey && event.key === '0') {
      resetButton.click();
      event.preventDefault();
    } else if (event.altKey && event.key === '+' || event.altKey && event.key === '=') {
      increaseButton.click();
      event.preventDefault();
    }
  });
  
  /**
   * Update font size and save preference
   * @param {number} size - Font size percentage
   */
  function updateFontSize(size) {
    document.documentElement.style.fontSize = `${size}%`;
    localStorage.setItem('preferredFontSize', size.toString());
    
    // Announce change to screen readers
    announceToScreenReader(`Font size changed to ${size} percent`);
  }
}

/**
 * Initialize theme selector functionality
 * @param {string} selectorId - ID of the theme selector
 */
function initThemeSelector(selectorId) {
  const selector = document.getElementById(selectorId);
  
  if (!selector) return;
  
  // Get saved theme or use default
  const savedTheme = localStorage.getItem('preferredTheme');
  
  // Set initial value
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    selector.value = savedTheme;
  }
  
  // Add event listener
  selector.addEventListener('change', () => {
    const theme = selector.value;
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save preference
    localStorage.setItem('preferredTheme', theme);
    
    // Announce change to screen readers
    announceToScreenReader(`Theme changed to ${theme}`);
  });
}

/**
 * Generate table of contents from headings
 * @param {string} headingSelector - CSS selector for headings
 * @param {string} containerSelector - CSS selector for TOC container
 */
function generateTableOfContents(headingSelector, containerSelector) {
  const headings = document.querySelectorAll(headingSelector);
  const container = document.querySelector(containerSelector);
  
  if (!container || headings.length === 0) return;
  
  const toc = document.createElement('ul');
  toc.setAttribute('role', 'list');
  toc.setAttribute('aria-label', 'Table of contents');
  
  // Track heading levels and their lists
  const lists = {
    'main': toc
  };
  let lastLevel = 0;
  let currentList = toc;
  
  // Process each heading
  headings.forEach((heading) => {
    // Get heading level from tag name (h1 = 1, h2 = 2, etc.)
    let level = parseInt(heading.tagName.charAt(1));
    
    // Skip h1 if we're only capturing subheadings
    if (headingSelector.indexOf('h1') === -1 && level === 1) {
      return;
    }
    
    // Normalize levels (make first level in selector the top level)
    if (lastLevel === 0) {
      lastLevel = level;
      level = 2; // Start at level 2 for nested lists
    } else {
      level = level - lastLevel + 2;
    }
    
    // Ensure heading has ID for linking
    if (!heading.id) {
      const headingText = heading.textContent.trim();
      const id = headingText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      heading.id = id;
    }
    
    // Create list item with link
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    link.setAttribute('class', 'toc-link');
    link.setAttribute('data-level', level);
    
    // Create or get appropriate list for this level
    if (level > 2) {
      // We need a nested list
      if (!lists[level]) {
        // Create new nested list if it doesn't exist
        const newList = document.createElement('ul');
        newList.setAttribute('role', 'list');
        lists[level - 1].lastChild.appendChild(newList);
        lists[level] = newList;
      }
      
      lists[level].appendChild(listItem);
    } else {
      // Reset nested lists
      Object.keys(lists).forEach(key => {
        if (parseInt(key) > level) {
          delete lists[key];
        }
      });
      
      // Add to main list
      lists[2] = toc;
      lists[2].appendChild(listItem);
    }
    
    listItem.appendChild(link);
  });
  
  // Add to container
  container.appendChild(toc);
  
  // Make TOC focusable for keyboard users
  container.tabIndex = 0;
}

/**
 * Highlight code blocks
 */
function highlightCodeBlocks() {
  // Check if highlight.js is loaded
  if (typeof hljs !== 'undefined') {
    // Add copy button to all code blocks
    document.querySelectorAll('pre code').forEach((block) => {
      // Highlight code
      hljs.highlightElement(block);
      
      // Create copy button
      const button = document.createElement('button');
      button.className = 'copy-code-button';
      button.type = 'button';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      
      // Add button to pre element
      const pre = block.parentNode;
      pre.insertBefore(button, pre.firstChild);
      
      // Add click handler
      button.addEventListener('click', () => {
        // Copy code to clipboard
        const code = block.textContent;
        navigator.clipboard.writeText(code).then(() => {
          // Update button text temporarily
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 2000);
          
          // Announce to screen readers
          announceToScreenReader('Code copied to clipboard');
        }).catch((error) => {
          console.error('Error copying code:', error);
          button.textContent = 'Error';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 2000);
        });
      });
    });
  }
}

/**
 * Initialize simplified view toggle for cognitive accessibility
 */
function initSimplifiedView() {
  // Create toggle button
  const button = document.createElement('button');
  button.id = 'toggle-simplified-view';
  button.textContent = 'Simplified View';
  button.setAttribute('aria-pressed', 'false');
  
  // Add to accessibility controls
  const controlsContainer = document.querySelector('.a11y-controls');
  if (controlsContainer) {
    controlsContainer.appendChild(button);
  }
  
  // Check saved preference
  const simplified = localStorage.getItem('simplifiedView') === 'true';
  
  // Set initial state
  button.setAttribute('aria-pressed', simplified.toString());
  
  if (simplified) {
    document.documentElement.classList.add('simplified-view');
  }
  
  // Add event listener
  button.addEventListener('click', () => {
    const isEnabled = document.documentElement.classList.contains('simplified-view');
    
    // Toggle class
    if (isEnabled) {
      document.documentElement.classList.remove('simplified-view');
    } else {
      document.documentElement.classList.add('simplified-view');
    }
    
    // Update button state
    button.setAttribute('aria-pressed', (!isEnabled).toString());
    
    // Save preference
    localStorage.setItem('simplifiedView', (!isEnabled).toString());
    
    // Announce change to screen readers
    announceToScreenReader(`Simplified view ${!isEnabled ? 'enabled' : 'disabled'}`);
  });
  
  // Add keyboard shortcut (Alt+S)
  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.key.toLowerCase() === 's') {
      button.click();
      event.preventDefault();
    }
  });
}

/**
 * Initialize keyboard shortcuts help dialog
 */
function initKeyboardShortcutsHelp() {
  // Create dialog
  const dialog = document.createElement('dialog');
  dialog.id = 'keyboard-shortcuts-dialog';
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  
  dialog.innerHTML = `
    <div class="dialog-content">
      <h2 id="dialog-title">Keyboard Shortcuts</h2>
      <table>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>C</kbd></td>
            <td>Toggle high contrast mode</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>S</kbd></td>
            <td>Toggle simplified view</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>+</kbd></td>
            <td>Increase font size</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>-</kbd></td>
            <td>Decrease font size</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>0</kbd></td>
            <td>Reset font size</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>A</kbd></td>
            <td>Run accessibility check</td>
          </tr>
          <tr>
            <td><kbd>Alt</kbd> + <kbd>H</kbd></td>
            <td>Show/hide this help</td>
          </tr>
          <tr>
            <td><kbd>F2</kbd></td>
            <td>Show/hide this help</td>
          </tr>
          <tr>
            <td><kbd>Esc</kbd></td>
            <td>Close this dialog</td>
          </tr>
        </tbody>
      </table>
      <button id="close-dialog">Close</button>
    </div>
  `;
  
  // Add dialog to body
  document.body.appendChild(dialog);
  
  // Add close button event listener
  const closeButton = document.getElementById('close-dialog');
  closeButton.addEventListener('click', () => {
    dialog.close();
  });
  
  // Add keyboard shortcut (F2 or Alt+H)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F2' || (event.altKey && event.key.toLowerCase() === 'h')) {
      if (dialog.open) {
        dialog.close();
      } else {
        dialog.showModal();
      }
      event.preventDefault();
    } else if (event.key === 'Escape' && dialog.open) {
      dialog.close();
    }
  });
}

/**
 * Initialize live accessibility testing
 */
function initAccessibilityTesting() {
  // Only initialize if socket.io is available
  if (typeof io === 'undefined') return;
  
  // Create socket connection
  const socket = io();
  
  // Create accessibility test button
  const button = document.createElement('button');
  button.id = 'run-accessibility-test';
  button.textContent = 'Check Accessibility';
  button.setAttribute('aria-label', 'Run accessibility test on this page');
  
  // Add to accessibility controls
  const controlsContainer = document.querySelector('.a11y-controls');
  if (controlsContainer) {
    controlsContainer.appendChild(button);
  }
  
  // Add results container
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'accessibility-results';
  resultsContainer.setAttribute('aria-live', 'polite');
  resultsContainer.style.display = 'none';
  document.body.appendChild(resultsContainer);
  
  // Add event listener
  button.addEventListener('click', () => {
    // Show loading state
    button.disabled = true;
    button.textContent = 'Checking...';
    
    // Get current page HTML
    const html = document.documentElement.outerHTML;
    
    // Send to server for testing
    socket.emit('test-accessibility', { html });
  });
  
  // Listen for results
  socket.on('accessibility-results', (issues) => {
    // Reset button
    button.disabled = false;
    button.textContent = 'Check Accessibility';
    
    // Display results
    displayAccessibilityResults(issues);
  });
  
  // Add keyboard shortcut (Alt+A)
  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.key.toLowerCase() === 'a') {
      button.click();
      event.preventDefault();
    }
  });
  
  /**
   * Display accessibility test results
   * @param {Array} issues - Array of accessibility issues
   */
  function displayAccessibilityResults(issues) {
    // Show results container
    resultsContainer.style.display = 'block';
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = 'Accessibility Check Results';
    resultsContainer.appendChild(header);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'close-results';
    closeButton.addEventListener('click', () => {
      resultsContainer.style.display = 'none';
    });
    resultsContainer.appendChild(closeButton);
    
    // Check if there are issues
    if (issues.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No accessibility issues found!';
      message.className = 'success-message';
      resultsContainer.appendChild(message);
      return;
    }
    
    // Group issues by type
    const issuesByType = {};
    issues.forEach((issue) => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    // Create summary
    const summary = document.createElement('p');
    summary.textContent = `Found ${issues.length} accessibility ${issues.length === 1 ? 'issue' : 'issues'}:`;
    resultsContainer.appendChild(summary);
    
    // Create issues list
    Object.keys(issuesByType).forEach((type) => {
      const typeIssues = issuesByType[type];
      
      // Create section for this type
      const section = document.createElement('div');
      section.className = 'issue-section';
      
      // Create header
      const sectionHeader = document.createElement('h3');
      sectionHeader.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Issues (${typeIssues.length})`;
      section.appendChild(sectionHeader);
      
      // Create list
      const list = document.createElement('ul');
      typeIssues.forEach((issue) => {
        const item = document.createElement('li');
        item.className = 'issue-item';
        
        // Create issue description
        const description = document.createElement('p');
        description.textContent = issue.message;
        item.appendChild(description);
        
        // If element is available, show it
        if (issue.element) {
          const code = document.createElement('pre');
          code.className = 'issue-code';
          code.textContent = issue.element;
          item.appendChild(code);
        }
        
        list.appendChild(item);
      });
      
      section.appendChild(list);
      resultsContainer.appendChild(section);
    });
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Announce to screen readers
    announceToScreenReader(`Accessibility check complete. Found ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}.`);
  }
}

/**
 * Initialize document outline view for screen readers
 */
function initDocumentOutline() {
  // Create outline container
  const outlineContainer = document.createElement('div');
  outlineContainer.id = 'document-outline';
  outlineContainer.className = 'sr-only';
  outlineContainer.setAttribute('role', 'navigation');
  outlineContainer.setAttribute('aria-label', 'Document Outline');
  
  // Add to body
  document.body.appendChild(outlineContainer);
  
  // Create outline
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  if (headings.length > 0) {
    const list = document.createElement('ul');
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      const item = document.createElement('li');
      const link = document.createElement('a');
      
      // Ensure heading has ID
      if (!heading.id) {
        const headingText = heading.textContent.trim();
        const id = headingText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        
        heading.id = id;
      }
      
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      link.setAttribute('data-level', level);
      
      item.appendChild(link);
      list.appendChild(item);
    });
    
    outlineContainer.appendChild(list);
  }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  // Get or create aria-live region
  let announcer = document.getElementById('a11y-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }
  
  // Set message
  announcer.textContent = message;
  
  // Clear after a delay
  setTimeout(() => {
    announcer.textContent = '';
  }, 3000);
}

// Initialize all accessibility features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize standard features
  initHighContrastToggle('toggle-high-contrast', 'high-contrast-stylesheet');
  initFontSizeControls('decrease-font', 'reset-font', 'increase-font');
  initThemeSelector('theme-selector');
  initKeyboardShortcutsHelp();
  
  // Initialize advanced features
  initSimplifiedView();
  initAccessibilityTesting();
  initDocumentOutline();
  
  // Page-specific features
  const tocContainer = document.getElementById('toc');
  if (tocContainer) {
    generateTableOfContents('main h2, main h3, main h4', '#toc');
  }
});
