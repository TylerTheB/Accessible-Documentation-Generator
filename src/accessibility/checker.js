const axe = require('axe-core');
const { JSDOM } = require('jsdom');
const wcagContrast = require('wcag-contrast');
const htmlValidator = require('html-validator');
const { getConfig } = require('../config');

/**
 * Runs accessibility checks on HTML content
 * @param {string} html - HTML content to check
 * @returns {Array} Array of accessibility issues
 */
async function checkAccessibility(html) {
  const config = getConfig();
  const issues = [];
  
  try {
    // Create a virtual DOM to run checks
    const dom = new JSDOM(html);
    const { document } = dom.window;
    
    // 1. Run axe-core for WCAG compliance checks
    if (config.checkWCAG) {
      const axeIssues = await runAxeChecks(document);
      issues.push(...axeIssues);
    }
    
    // 2. Check heading hierarchy
    if (config.checkHeadingHierarchy) {
      const headingIssues = checkHeadingHierarchy(document);
      issues.push(...headingIssues);
    }
    
    // 3. Check color contrast
    if (config.checkColorContrast) {
      const contrastIssues = checkColorContrast(document);
      issues.push(...contrastIssues);
    }
    
    // 4. Check HTML validity
    if (config.validateHTML) {
      const validationIssues = await validateHTML(html);
      issues.push(...validationIssues);
    }
    
    // 5. Check for proper ARIA usage
    if (config.checkARIA) {
      const ariaIssues = checkARIAUsage(document);
      issues.push(...ariaIssues);
    }
    
    // 6. Check for keyboard accessibility
    if (config.checkKeyboardAccessibility) {
      const keyboardIssues = checkKeyboardAccessibility(document);
      issues.push(...keyboardIssues);
    }
    
    // 7. Check for screen reader announcement issues
    if (config.checkScreenReaderAnnouncements) {
      const srIssues = checkScreenReaderAnnouncements(document);
      issues.push(...srIssues);
    }
    
    return issues;
  } catch (error) {
    console.error('Error during accessibility check:', error);
    return [{ 
      type: 'error', 
      message: `Accessibility check failed: ${error.message}` 
    }];
  }
}

/**
 * Run axe-core WCAG compliance checks
 * @param {Document} document - DOM document
 * @returns {Array} Array of accessibility issues
 */
async function runAxeChecks(document) {
  try {
    // Run axe with configured rules
    const results = await axe.run(document, {
      rules: {
        'color-contrast': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true },
        'document-title': { enabled: true },
        'html-has-lang': { enabled: true },
        'image-alt': { enabled: true },
        'input-button-name': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'meta-viewport': { enabled: true }
      }
    });
    
    // Convert axe results to standard format
    return results.violations.map(violation => ({
      type: 'wcag',
      rule: violation.id,
      impact: violation.impact,
      message: violation.help,
      description: violation.description,
      helpUrl: violation.helpUrl,
      elements: violation.nodes.map(node => node.html)
    }));
  } catch (error) {
    console.error('Error running axe checks:', error);
    return [{ 
      type: 'wcag', 
      rule: 'axe-error', 
      message: `Error running axe checks: ${error.message}` 
    }];
  }
}

/**
 * Check heading hierarchy for proper structure
 * @param {Document} document - DOM document
 * @returns {Array} Array of heading issues
 */
function checkHeadingHierarchy(document) {
  const issues = [];
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  if (headings.length === 0) {
    issues.push({
      type: 'heading',
      message: 'Document has no headings, which may make navigation difficult for screen reader users'
    });
    return issues;
  }
  
  // Check if document has an h1
  const hasH1 = document.querySelector('h1');
  if (!hasH1) {
    issues.push({
      type: 'heading',
      message: 'Document lacks a main heading (h1), which is important for document structure'
    });
  }
  
  // Check for skipped heading levels
  let previousLevel = 0;
  
  for (const heading of headings) {
    const currentLevel = parseInt(heading.tagName.charAt(1));
    
    // First heading should be h1
    if (previousLevel === 0 && currentLevel !== 1) {
      issues.push({
        type: 'heading',
        message: `Document doesn't start with an h1. First heading is ${heading.tagName}`,
        element: heading.outerHTML
      });
    }
    
    // Check for skipped levels (e.g., h2 followed by h4)
    if (currentLevel > previousLevel + 1) {
      issues.push({
        type: 'heading',
        message: `Heading level skipped from h${previousLevel} to h${currentLevel}`,
        element: heading.outerHTML
      });
    }
    
    previousLevel = currentLevel;
  }
  
  return issues;
}

/**
 * Check color contrast for text elements
 * @param {Document} document - DOM document
 * @returns {Array} Array of contrast issues
 */
function checkColorContrast(document) {
  const issues = [];
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, label');
  
  for (const element of textElements) {
    const style = getComputedStyle(element);
    
    if (!style.color || !style.backgroundColor) {
      // Skip elements with undefined colors (will inherit)
      continue;
    }
    
    // Parse colors to rgb format
    const foreground = parseColor(style.color);
    const background = parseColor(style.backgroundColor);
    
    if (!foreground || !background) {
      continue;
    }
    
    // Calculate contrast ratio
    const ratio = wcagContrast.rgb(foreground, background);
    
    // Check against WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
    const fontSize = parseInt(style.fontSize);
    const isBold = parseInt(style.fontWeight) >= 700;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
    
    const minimumRatio = isLargeText ? 3 : 4.5;
    
    if (ratio < minimumRatio) {
      issues.push({
        type: 'contrast',
        message: `Insufficient color contrast ratio (${ratio.toFixed(2)}:1), should be at least ${minimumRatio}:1`,
        element: element.outerHTML,
        foreground: style.color,
        background: style.backgroundColor
      });
    }
  }
  
  return issues;
}

/**
 * Parse color string to RGB array
 * @param {string} color - CSS color string
 * @returns {Array|null} RGB array or null if parsing failed
 */
function parseColor(color) {
  if (!color) return null;
  
  // Handle different formats
  if (color.startsWith('rgb')) {
    // Extract numbers from rgb(r, g, b) or rgba(r, g, b, a)
    const matches = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (matches) {
      return [
        parseInt(matches[1]),
        parseInt(matches[2]),
        parseInt(matches[3])
      ];
    }
  } else if (color.startsWith('#')) {
    // Convert hex to rgb
    let hex = color.substring(1);
    
    // Handle shorthand hex (#rgb)
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    return [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16)
    ];
  }
  
  return null;
}

/**
 * Validate HTML for correctness
 * @param {string} html - HTML content to validate
 * @returns {Array} Array of validation issues
 */
async function validateHTML(html) {
  try {
    const result = await htmlValidator({
      data: html,
      format: 'json'
    });
    
    if (result.messages.length === 0) {
      return [];
    }
    
    // Filter to only errors and warnings
    return result.messages
      .filter(msg => ['error', 'warning'].includes(msg.type))
      .map(msg => ({
        type: 'html',
        subtype: msg.type,
        message: msg.message,
        line: msg.line,
        column: msg.column
      }));
  } catch (error) {
    console.warn('HTML validation failed:', error.message);
    return [{ 
      type: 'html', 
      message: `HTML validation failed: ${error.message}` 
    }];
  }
}

/**
 * Check for proper ARIA usage
 * @param {Document} document - DOM document
 * @returns {Array} Array of ARIA issues
 */
function checkARIAUsage(document) {
  const issues = [];
  
  // 1. Check for invalid ARIA roles
  const validRoles = [
    'alert', 'alertdialog', 'application', 'article', 'banner', 
    'button', 'cell', 'checkbox', 'columnheader', 'combobox', 
    'complementary', 'contentinfo', 'definition', 'dialog', 
    'directory', 'document', 'feed', 'figure', 'form', 'grid', 
    'gridcell', 'group', 'heading', 'img', 'link', 'list', 
    'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 
    'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 
    'menuitemradio', 'navigation', 'none', 'note', 'option', 
    'presentation', 'progressbar', 'radio', 'radiogroup', 
    'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 
    'search', 'searchbox', 'separator', 'slider', 'spinbutton', 
    'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 
    'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 
    'treegrid', 'treeitem'
  ];
  
  const elementsWithRole = document.querySelectorAll('[role]');
  for (const element of elementsWithRole) {
    const role = element.getAttribute('role');
    
    if (!validRoles.includes(role)) {
      issues.push({
        type: 'aria',
        message: `Invalid ARIA role: "${role}"`,
        element: element.outerHTML
      });
    }
  }
  
  // 2. Check for required ARIA attributes
  const rolesThatRequireAttributes = {
    'checkbox': ['aria-checked'],
    'combobox': ['aria-expanded'],
    'slider': ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    'progressbar': ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    'scrollbar': ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    'listbox': ['aria-multiselectable'],
    'radiogroup': ['aria-required']
  };
  
  for (const element of elementsWithRole) {
    const role = element.getAttribute('role');
    const requiredAttributes = rolesThatRequireAttributes[role];
    
    if (requiredAttributes) {
      for (const attr of requiredAttributes) {
        if (!element.hasAttribute(attr)) {
          issues.push({
            type: 'aria',
            message: `Element with role="${role}" is missing required attribute: ${attr}`,
            element: element.outerHTML
          });
        }
      }
    }
  }
  
  return issues;
}

/**
 * Check for keyboard accessibility issues
 * @param {Document} document - DOM document
 * @returns {Array} Array of keyboard accessibility issues
 */
function checkKeyboardAccessibility(document) {
  const issues = [];
  
  // 1. Check for missing tabindex
  const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]');
  
  for (const element of interactiveElements) {
    const tabindex = element.getAttribute('tabindex');
    
    // tabindex="-1" means the element is not in the tab order
    if (tabindex === '-1') {
      issues.push({
        type: 'keyboard',
        message: 'Interactive element is not keyboard accessible (tabindex="-1")',
        element: element.outerHTML
      });
    }
    
    // tabindex > 0 can cause tab order issues
    if (tabindex && parseInt(tabindex) > 0) {
      issues.push({
        type: 'keyboard',
        message: `Tabindex greater than 0 (${tabindex}) can cause navigation issues`,
        element: element.outerHTML
      });
    }
  }
  
  // 2. Check for click events without keyboard alternatives
  // This is a simplified version as we can't inspect event handlers in static HTML
  const divWithRoleButton = document.querySelectorAll('div[role="button"]');
  for (const div of divWithRoleButton) {
    if (!div.hasAttribute('tabindex')) {
      issues.push({
        type: 'keyboard',
        message: 'Element with role="button" needs tabindex attribute for keyboard access',
        element: div.outerHTML
      });
    }
  }
  
  return issues;
}

/**
 * Check for screen reader announcement issues
 * @param {Document} document - DOM document
 * @returns {Array} Array of screen reader issues
 */
function checkScreenReaderAnnouncements(document) {
  const issues = [];
  
  // 1. Check for proper alt text on images
  const images = document.querySelectorAll('img');
  for (const img of images) {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'screen-reader',
        message: 'Image missing alt attribute',
        element: img.outerHTML
      });
    } else if (img.getAttribute('alt').trim() === '') {
      // Empty alt is fine for decorative images, but warn for other cases
      if (!img.classList.contains('decorative') && 
          !img.closest('figure') && 
          !img.getAttribute('aria-hidden') === 'true') {
        issues.push({
          type: 'screen-reader',
          message: 'Non-decorative image has empty alt text',
          element: img.outerHTML
        });
      }
    } else if (img.getAttribute('alt').toLowerCase().includes('image of') || 
              img.getAttribute('alt').toLowerCase().includes('picture of')) {
      issues.push({
        type: 'screen-reader',
        message: 'Alt text should not include phrases like "image of" or "picture of"',
        element: img.outerHTML
      });
    }
  }
  
  // 2. Check for aria-hidden on elements that should be visible to screen readers
  const interactiveWithAriaHidden = document.querySelectorAll('a[aria-hidden="true"], button[aria-hidden="true"], input[aria-hidden="true"]');
  for (const element of interactiveWithAriaHidden) {
    issues.push({
      type: 'screen-reader',
      message: 'Interactive element is hidden from screen readers (aria-hidden="true")',
      element: element.outerHTML
    });
  }
  
  // 3. Check for duplicate IDs which can cause issues with aria-labelledby
  const allIds = {};
  const elementsWithId = document.querySelectorAll('[id]');
  
  for (const element of elementsWithId) {
    const id = element.getAttribute('id');
    
    if (allIds[id]) {
      issues.push({
        type: 'screen-reader',
        message: `Duplicate ID: "${id}" - can cause issues with aria references`,
        element: element.outerHTML
      });
    } else {
      allIds[id] = true;
    }
  }
  
  // 4. Check aria-labelledby references exist
  const elementsWithLabelledby = document.querySelectorAll('[aria-labelledby]');
  
  for (const element of elementsWithLabelledby) {
    const labelIds = element.getAttribute('aria-labelledby').split(' ');
    
    for (const id of labelIds) {
      if (!document.getElementById(id)) {
        issues.push({
          type: 'screen-reader',
          message: `aria-labelledby references non-existent ID: "${id}"`,
          element: element.outerHTML
        });
      }
    }
  }
  
  return issues;
}

module.exports = {
  checkAccessibility
};
