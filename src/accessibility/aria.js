/**
 * Enhances HTML with appropriate ARIA attributes
 * @param {HTMLElement} parsedHtml - Parsed HTML element
 * @param {Object} frontmatter - Document frontmatter data
 */
function enhanceWithAria(parsedHtml, frontmatter) {
  // Add appropriate language attribute if specified in frontmatter
  if (frontmatter.language) {
    ensureHtmlLangAttribute(parsedHtml, frontmatter.language);
  }

  // Add document title if not present
  ensureDocumentTitle(parsedHtml, frontmatter.title);

  // Add document landmarks
  addDocumentLandmarks(parsedHtml);
  
  // Enhance headings with ids if not present
  enhanceHeadings(parsedHtml);
  
  // Enhance links for better accessibility
  enhanceLinks(parsedHtml);
  
  // Enhance tables with appropriate aria attributes
  enhanceTables(parsedHtml);
  
  // Enhance form elements
  enhanceForms(parsedHtml);
  
  // Enhance code blocks
  enhanceCodeBlocks(parsedHtml);
  
  // Add skip navigation link if not present
  addSkipNavigation(parsedHtml);
  
  return parsedHtml;
}

/**
 * Ensures HTML element has proper lang attribute
 * @param {HTMLElement} parsedHtml - Parsed HTML
 * @param {string} language - Language code
 */
function ensureHtmlLangAttribute(parsedHtml, language) {
  const htmlElement = parsedHtml.querySelector('html');
  
  if (htmlElement) {
    htmlElement.setAttribute('lang', language);
  }
}

/**
 * Ensures document has a proper title
 * @param {HTMLElement} parsedHtml - Parsed HTML
 * @param {string} title - Document title
 */
function ensureDocumentTitle(parsedHtml, title) {
  if (!title) return;
  
  let headElement = parsedHtml.querySelector('head');
  
  // Create head element if it doesn't exist
  if (!headElement) {
    const htmlElement = parsedHtml.querySelector('html');
    
    if (htmlElement) {
      headElement = parsedHtml.createElement('head');
      htmlElement.insertBefore(headElement, htmlElement.firstChild);
    } else {
      // If no html element, we're probably just looking at a fragment
      return;
    }
  }
  
  // Check if title element exists
  let titleElement = headElement.querySelector('title');
  
  if (!titleElement) {
    titleElement = parsedHtml.createElement('title');
    titleElement.textContent = title;
    headElement.appendChild(titleElement);
  } else if (!titleElement.textContent.trim()) {
    titleElement.textContent = title;
  }
}

/**
 * Add document landmarks for screen reader navigation
 * @param {HTMLElement} parsedHtml - Parsed HTML
 */
function addDocumentLandmarks(parsedHtml) {
  // Find main content area
  let mainElement = parsedHtml.querySelector('main');
  
  if (!mainElement) {
    // Look for common content containers
    const possibleMainElements = parsedHtml.querySelectorAll('.content, #content, article, .main, #main');
    
    if (possibleMainElements.length > 0) {
      mainElement = possibleMainElements[0];
      mainElement.setAttribute('role', 'main');
    } else {
      // If no obvious main content, wrap the content in main
      const body = parsedHtml.querySelector('body');
      
      if (body) {
        // Don't wrap if we're just looking at a fragment
        const newMain = parsedHtml.createElement('main');
        
        // Move all body children to main
        while (body.firstChild) {
          newMain.appendChild(body.firstChild);
        }
        
        body.appendChild(newMain);
        mainElement = newMain;
      }
    }
  }
  
  // If we have a main element, ensure it has proper attributes
  if (mainElement) {
    mainElement.setAttribute('role', 'main');
    
    // Add id if not present for skip navigation
    if (!mainElement.id) {
      mainElement.id = 'main-content';
    }
  }
  
  // Add header landmark
  const headerElement = parsedHtml.querySelector('header');
  if (headerElement) {
    headerElement.setAttribute('role', 'banner');
  }
  
  // Add nav landmark
  const navElements = parsedHtml.querySelectorAll('nav');
  for (const nav of navElements) {
    if (!nav.hasAttribute('aria-label')) {
      nav.setAttribute('aria-label', 'Main Navigation');
    }
  }
  
  // Add footer landmark
  const footerElement = parsedHtml.querySelector('footer');
  if (footerElement) {
    footerElement.setAttribute('role', 'contentinfo');
  }
  
  // Add complementary landmarks for asides
  const asideElements = parsedHtml.querySelectorAll('aside');
  for (let i = 0; i < asideElements.length; i++) {
    const aside = asideElements[i];
    aside.setAttribute('role', 'complementary');
    
    if (!aside.hasAttribute('aria-label')) {
      aside.setAttribute('aria-label', `Complementary Content ${i + 1}`);
    }
  }
}

/**
 * Enhance headings with ids for navigation
 * @param {HTMLElement} parsedHtml - Parsed HTML
 */
function enhanceHeadings(parsedHtml) {
  const headings = parsedHtml.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  for (const heading of headings) {
    // Add id if not present
    if (!heading.id) {
      const headingText = heading.textContent.trim();
      const id = headingText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-');     // Replace multiple hyphens with single hyphen
      
      heading.id = id;
    }
    
    // Ensure headings are keyboard accessible for anchor links
    heading.setAttribute('tabindex', '-1');
    
    // Add aria-level if using a role="heading"
    if (heading.getAttribute('role') === 'heading' && !heading.hasAttribute('aria-level')) {
      const level = parseInt(heading.tagName.charAt(1));
      heading.setAttribute('aria-level', level.toString());
    }
  }
}

/**
 * Enhance links for better accessibility
 * @param {HTMLElement} parsedHtml - Parsed HTML
 */
function enhanceLinks(parsedHtml) {
  const links = parsedHtml.querySelectorAll('a');
  
  for (const link of links) {
    const href = link.getAttribute('href');
    
    if (!href) continue;
    
    // External links should have rel attributes and indication
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (!link.getAttribute('rel')) {
        link.setAttribute('rel', 'noopener noreferrer');
      }
      
      // Check if link already indicates it's external
      const linkText = link.textContent.toLowerCase();
      const hasExternalIndicator = 
        linkText.includes('external') || 
        link.querySelector('i.external, .fa-external-link, .icon-external');
      
      // Add screen reader indication for external link if not already present
      if (!hasExternalIndicator && !link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', `${link.textContent} (external link)`);
      }
    }
    
    // Handle anchor links to make them more accessible
    if (href.startsWith('#')) {
      const targetId = href.substring(1);
      const targetElement = parsedHtml.getElementById(targetId);
      
      if (targetElement) {
        // If target doesn't have a tabindex, add one to make it focusable
        if (!targetElement.hasAttribute('tabindex')) {
          targetElement.setAttribute('tabindex', '-1');
        }
        
        // If link doesn't have an aria-label, add one
        if (!link.getAttribute('aria-label')) {
          link.setAttribute('aria-label', `Jump to ${link.textContent}`);
        }
      }
    }
    
    // Ensure links have accessible text
    if (!link.textContent.trim() && !link.hasAttribute('aria-label')) {
      // Check for images with alt text
      const img = link.querySelector('img');
      if (img && img.getAttribute('alt')) {
        link.setAttribute('aria-label', img.getAttribute('alt'));
      } else {
        // Add warning class for empty links
        link.classList.add('a11y-warning');
        link.setAttribute('data-a11y-warning', 'Link has no accessible text');
      }
    }
  }
}

/**
 * Enhance tables with appropriate aria attributes
 * @param {HTMLElement} parsedHtml - Parsed HTML
 */
function enhanceTables(parsedHtml) {
  const tables = parsedHtml.querySelectorAll('table');
  
  for (const table of tables) {
    // Add role table for explicit semantics
    table.setAttribute('role', 'table');
    
    // Handle header cells
    const headerCells = table.querySelectorAll('th');
    for (const th of headerCells) {
      th.setAttribute('scope', th.getAttribute('scope') || 'col');
    }
    
    // Add caption if missing
    if (!table.querySelector('caption')) {
      const potentialCaption = table.previousElementSibling;
      
      // If previous element is a heading, use it as aria-labelledby
      if (potentialCaption && /^h[1-6]$/.test(potentialCaption.tagName.toLowerCase())) {
        if (!potentialCaption.id) {
          potentialCaption.id = `table-heading-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        table.setAttribute('aria-labelledby', potentialCaption.id);
      } else if (!table.hasAttribute('aria-label')) {
        // Add at least an aria-label if no caption available
        table.setAttribute('aria-label', 'Table');
      }
    }
    
    // Add row roles
    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      row.setAttribute('role', 'row');
    }
    
    // Add cell roles
    const cells = table.querySelectorAll('td');
    for (const cell of cells) {
      cell.setAttribute('role', 'cell');
    }
  }
}

/**
 * Enhance form elements for accessibility
 * @param {HTMLElement} parsedHtml - Parsed HTML
 */
function enhanceForms(parsedHtml) {
  // Ensure forms have accessible labels
  const forms = parsedHtml.querySelectorAll('form');
  for (const form of forms) {
    if (!form.hasAttribute('aria-label') && !form.hasAttribute('aria-labelledby')) {
      const formHeading = form.querySelector('h1, h2, h3, h4, h5, h6');
      
      if (formHeading) {
        if (!formHeading.id) {
          formHeading.id = `form-heading-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        form.setAttribute('aria-labelledby', formHeading.id);
      } else {
        form.setAttribute('aria-label', 'Form');
      }
    }
  }
  
  // Ensure all inputs have associated labels
  const inputs = parsedHtml.querySelectorAll('input, select, textarea');
  for (const input of inputs) {
    const inputId = input.id;
    
    // Skip hidden and submit inputs
    if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
      continue;
    }
    
    if (!inputId) {
      // Generate an ID if not present
      const newId = `input-${Math.random().toString(36).substr(2, 9)}`;
      input.id = newId;
    }
    
    // Check if input has a label
    let hasAssociatedLabel = false;
    
    // Check for label element
    if (inputId) {
      const label = parsedHtml.querySelector(`label[for="${inputId}"]`);
      hasAssociatedLabel = !!label;
    }
    
    // Check if input is inside a label
    if (!hasAssociatedLabel) {
      const parentLabel = input.closest('label');
      hasAssociatedLabel = !!parentLabel;
    }
    
    // Check for aria-label or aria-labelledby
    if (!hasAssociatedLabel) {
      hasAssociatedLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
    }
    
    // If no label found, add warning
    if (!hasAssociatedLabel) {
      input.classList.add('a11y-warning');
      input.setAttribute('data-a11y-warning', 'Input has no accessible label');
    }
    
    // Ensure required inputs are properly marked
    if (input.hasAttribute('required')) {
      input.setAttribute('aria-required', 'true');
    }
  }
}

/**
 * Enhance code blocks for screen readers
 * @param {HTMLElement} parsedHtml - Parsed HTML
 */
function enhanceCodeBlocks(parsedHtml) {
  const codeBlocks = parsedHtml.querySelectorAll('pre code');
  
  for (const codeBlock of codeBlocks) {
    const pre = codeBlock.closest('pre');
    
    if (pre) {
      // Make focusable
      pre.setAttribute('tabindex', '0');
      
      // Add role of region
      pre.setAttribute('role', 'region');
      
      // Determine language from class
      const classes = codeBlock.classList;
      let language = 'code';
      
      for (const className of classes) {
        if (className.startsWith('language-')) {
          language = className.replace('language-', '');
          break;
        }
      }
      
      // Add appropriate aria-label
      pre.setAttribute('aria-label', `Code example in ${language}`);
    }
  }
}

/**
 * Add skip navigation link if not present
 * @param {HTMLElement} parsedHtml - Parsed HTML
 */
function addSkipNavigation(parsedHtml) {
  const body = parsedHtml.querySelector('body');
  const existingSkipLink = parsedHtml.querySelector('a[href="#main"], a[href="#main-content"], a[href="#content"]');
  
  if (body && !existingSkipLink) {
    const skipLink = parsedHtml.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    
    // Add skip link as first child of body
    body.insertBefore(skipLink, body.firstChild);
  }
}

module.exports = {
  enhanceWithAria
};