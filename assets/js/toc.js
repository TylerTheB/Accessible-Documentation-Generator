/**
 * Table of Contents Generator
 * Creates an accessible table of contents from document headings
 */

/**
 * Generate table of contents from document headings
 * @param {string} headingSelector - CSS selector for headings to include
 * @param {string} containerSelector - CSS selector for container element
 * @param {Object} options - Configuration options
 */
function generateTableOfContents(headingSelector, containerSelector, options = {}) {
  // Default options
  const defaults = {
    title: 'Table of Contents',
    listType: 'ul',
    includeTitle: true,
    skipTopLevel: false,
    maxLevel: 0,
    minLevel: 0,
    linkClass: 'toc-link',
    activeLinkClass: 'toc-link-active',
    updateOnScroll: true,
    scrollOffset: 100
  };
  
  // Merge options
  const settings = { ...defaults, ...options };
  
  // Get container
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`TOC container not found: ${containerSelector}`);
    return;
  }
  
  // Get headings
  const headings = document.querySelectorAll(headingSelector);
  if (headings.length === 0) {
    console.warn(`No headings found matching: ${headingSelector}`);
    container.style.display = 'none';
    return;
  }
  
  // Create TOC header if requested
  if (settings.includeTitle) {
    const tocTitle = document.createElement('h2');
    tocTitle.textContent = settings.title;
    tocTitle.id = 'toc-title';
    container.appendChild(tocTitle);
  }
  
  // Add ARIA attributes to container
  container.setAttribute('role', 'navigation');
  container.setAttribute('aria-labelledby', 'toc-title');
  
  // Create list
  const list = document.createElement(settings.listType);
  list.setAttribute('role', 'list');
  container.appendChild(list);
  
  // Track heading levels and their lists
  const levels = {};
  levels[settings.listType] = list;
  let currentLevel = 0;
  let minFoundLevel = 10; // Initialize with a high number
  let tocLinks = [];
  
  // Process each heading
  headings.forEach((heading) => {
    // Get heading level
    const level = parseInt(heading.tagName.substring(1), 10);
    
    // Track minimum level found
    if (level < minFoundLevel) {
      minFoundLevel = level;
    }
    
    // Skip if outside specified levels
    if (settings.minLevel > 0 && level < settings.minLevel) return;
    if (settings.maxLevel > 0 && level > settings.maxLevel) return;
    
    // Skip top level if specified
    if (settings.skipTopLevel && level === minFoundLevel) return;
    
    // Ensure heading has an ID
    if (!heading.id) {
      const headingText = heading.textContent.trim();
      const id = headingText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      heading.id = id;
    }
    
    // Determine parent list for this heading
    let parentLevel = level - 1;
    let parentList = list;
    
    // Find closest parent list or create if needed
    while (parentLevel > minFoundLevel) {
      if (levels[parentLevel]) {
        parentList = levels[parentLevel];
        break;
      }
      parentLevel--;
    }
    
    // Create a nested list if this level doesn't exist
    if (!levels[level] && level > minFoundLevel) {
      const lastItem = parentList.lastElementChild;
      
      if (lastItem) {
        const nestedList = document.createElement(settings.listType);
        nestedList.setAttribute('role', 'list');
        lastItem.appendChild(nestedList);
        levels[level] = nestedList;
        parentList = nestedList;
      }
    }
    
    // Create list item
    const listItem = document.createElement('li');
    
    // Create link
    const link = document.createElement('a');
    link.textContent = heading.textContent;
    link.href = `#${heading.id}`;
    link.classList.add(settings.linkClass);
    link.setAttribute('data-level', level);
    link.setAttribute('aria-describedby', `toc-desc-${heading.id}`);
    
    // Add screen reader description
    const srDescription = document.createElement('span');
    srDescription.id = `toc-desc-${heading.id}`;
    srDescription.className = 'sr-only';
    srDescription.textContent = `Jump to section: ${heading.textContent}`;
    link.appendChild(srDescription);
    
    // Store for scroll tracking
    tocLinks.push({
      link: link,
      targetId: heading.id,
      level: level
    });
    
    // Add to list
    listItem.appendChild(link);
    
    // Add to appropriate list
    if (level === minFoundLevel || !levels[level]) {
      list.appendChild(listItem);
      levels[level] = list;
    } else {
      parentList.appendChild(listItem);
    }
  });
  
  // Make the TOC keyboard accessible
  if (tocLinks.length > 0) {
    container.tabIndex = 0;
    
    // Add keyboard event handling
    container.addEventListener('keydown', (event) => {
      // Handle navigation keys
      if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        
        // Find currently focused link
        const focusedElement = document.activeElement;
        let focusedIndex = -1;
        
        if (focusedElement && focusedElement.classList.contains(settings.linkClass)) {
          tocLinks.forEach((item, index) => {
            if (item.link === focusedElement) {
              focusedIndex = index;
            }
          });
        }
        
        // Navigate based on key
        let newIndex = focusedIndex;
        
        if (event.key === 'ArrowUp' && focusedIndex > 0) {
          newIndex = focusedIndex - 1;
        } else if (event.key === 'ArrowDown' && focusedIndex < tocLinks.length - 1) {
          newIndex = focusedIndex + 1;
        } else if (event.key === 'Home') {
          newIndex = 0;
        } else if (event.key === 'End') {
          newIndex = tocLinks.length - 1;
        }
        
        // Focus the new item
        if (newIndex !== focusedIndex && newIndex >= 0) {
          tocLinks[newIndex].link.focus();
        }
      }
    });
  }
  
  // Update active link on scroll
  if (settings.updateOnScroll) {
    // Throttle scroll event
    let scrollTimeout;
    const throttleDelay = 100;
    
    // Initial check for active section
    setTimeout(() => {
      updateActiveLink();
    }, 100);
    
    // Update on scroll
    window.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          updateActiveLink();
          scrollTimeout = null;
        }, throttleDelay);
      }
    });
  }
  
  /**
   * Update active TOC link based on scroll position
   */
  function updateActiveLink() {
    // Calculate positions
    const scrollPosition = window.scrollY + settings.scrollOffset;
    
    // Find visible headings
    const visibleHeadings = [];
    
    tocLinks.forEach((item) => {
      const target = document.getElementById(item.targetId);
      if (target) {
        const position = target.getBoundingClientRect().top + window.scrollY;
        
        if (position <= scrollPosition) {
          visibleHeadings.push({
            id: item.targetId,
            position: position,
            level: item.level
          });
        }
      }
    });
    
    // Sort by position (closest to top of viewport)
    visibleHeadings.sort((a, b) => b.position - a.position);
    
    // Get active heading (first one that's visible)
    const activeHeading = visibleHeadings.length > 0 ? visibleHeadings[0] : null;
    
    // Update class on links
    tocLinks.forEach((item) => {
      item.link.classList.remove(settings.activeLinkClass);
      
      if (activeHeading && item.targetId === activeHeading.id) {
        item.link.classList.add(settings.activeLinkClass);
        
        // Ensure parent items are also highlighted
        let parent = item.link.parentElement.parentElement;
        while (parent && parent !== container) {
          if (parent.previousElementSibling && parent.previousElementSibling.tagName === 'A') {
            parent.previousElementSibling.classList.add(settings.activeLinkClass);
          }
          parent = parent.parentElement;
        }
      }
    });
  }
  
  return {
    container: container,
    links: tocLinks,
    update: updateActiveLink
  };
}

// Make the function globally available
window.generateTableOfContents = generateTableOfContents;
