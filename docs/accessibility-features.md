---
title: Accessibility Features in AccessDocs
description: An overview of the accessibility features built into AccessDocs
language: en
---

# Accessibility Features in AccessDocs

AccessDocs is designed with accessibility as its primary focus. This document outlines the key accessibility features available to both documentation authors and end users.

## For Content Consumers

AccessDocs creates documentation that provides a seamless experience for all users, including those who rely on assistive technologies.

### Screen Reader Support

All documentation generated with AccessDocs is optimized for screen readers through:

- Proper semantic HTML structure
- Appropriate ARIA landmarks and roles
- Descriptive alt text for images
- Accessible navigation of tables
- Properly annotated code examples

### Keyboard Navigation

Users who navigate by keyboard can:

- Use the Tab key to navigate through all interactive elements
- Access a "Skip to main content" link at the beginning of each page
- Navigate the table of contents with arrow keys
- Copy code examples with keyboard shortcuts
- Toggle accessibility features without using a mouse

### Visual Adjustments

Users can customize the appearance of documentation with:

- A high contrast mode toggle
- Font size controls
- Multiple theme options (light, dark, sepia)
- Respecting system-level preferences (reduced motion, color scheme)

### Cognitive Accessibility

For users with cognitive disabilities, AccessDocs provides:

- A simplified view mode that:
  - Increases spacing
  - Simplifies layout
  - Enhances readability
  - Reduces distractions
- Clear, consistent navigation
- Predictable page structure
- Visible focus indicators

## For Documentation Authors

When creating documentation with AccessDocs, authors benefit from:

### Automated Accessibility Checks

AccessDocs validates documentation against:

- WCAG 2.1 criteria (configurable level: A, AA, or AAA)
- Proper heading hierarchy
- Sufficient color contrast
- Proper ARIA usage
- HTML semantics
- Screen reader announcements

### Accessibility Warnings

During the documentation creation process, AccessDocs provides:

- Warnings about missing alt text
- Alerts for empty links
- Suggestions for improving keyboard accessibility
- Guidance on proper ARIA usage
- Notifications for any WCAG violations

### Built-in Best Practices

AccessDocs automatically implements accessibility best practices:

```html
<!-- Example of automatic ARIA enhancement -->
<table role="table" aria-labelledby="table-heading-1">
  <caption>Monthly Sales Data</caption>
  <thead>
    <tr role="row">
      <th scope="col" role="columnheader">Month</th>
      <th scope="col" role="columnheader">Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="cell">January</td>
      <td role="cell">$10,000</td>
    </tr>
  </tbody>
</table>
```

## Keyboard Shortcuts

AccessDocs provides the following keyboard shortcuts for enhanced navigation:

| Shortcut | Function |
|----------|----------|
| Alt + C | Toggle high contrast mode |
| Alt + S | Toggle simplified view |
| Alt + + | Increase font size |
| Alt + - | Decrease font size |
| Alt + 0 | Reset font size |
| Alt + A | Run accessibility checker |
| F2 or Alt + H | Show keyboard shortcuts help |
| Esc | Close any open dialog |

## Testing Your Documentation

You can run accessibility tests on your documentation by:

1. Using the built-in checker:
   ```bash
   accessdocs test
   ```

2. Clicking the "Check Accessibility" button in the interface

3. Using the keyboard shortcut Alt + A

## Configuring Accessibility Options

You can customize accessibility settings in your `accessdocs.config.js` file:

```javascript
module.exports = {
  // Accessibility settings
  wcagLevel: 'AA',
  indicateExternalLinks: true,
  checkAccessibility: true,
  
  // Cognitive accessibility settings
  generateSimplifiedView: true,
  readabilityTarget: 'grade8'
}
```

## Best Practices for Documentation Authors

When creating content for AccessDocs:

1. **Use clear, simple language** - Aim for readability at an 8th-grade level when possible

2. **Structure content logically** - Use proper heading levels (h1, h2, h3) in sequence

3. **Provide text alternatives** - Include descriptive alt text for all images

4. **Write descriptive link text** - Avoid vague phrases like "click here"

5. **Use lists for sequential information** - Ordered and unordered lists improve readability

6. **Consider users on all devices** - Test your documentation on mobile and desktop

7. **Include descriptive table captions** - Help users understand table content before navigating it

8. **Add summaries for complex content** - Provide TL;DR sections for lengthy explanations

By following these guidelines and utilizing AccessDocs' built-in accessibility features, you can create documentation that truly works for everyone.
