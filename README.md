# Accessible-Documentation-Generator

# AccessDocs

AccessDocs is a documentation generator focused on creating highly accessible documentation that works seamlessly with screen readers and other assistive technologies.

## Features

- **WCAG Compliance**: Automatically ensures documentation meets WCAG 2.1 AA/AAA standards
- **Screen Reader Optimized**: Built from the ground up to work flawlessly with popular screen readers
- **Assistive Technology Testing**: Integrated testing for VoiceOver, NVDA, JAWS, and other assistive technologies
- **Semantic Structure**: Automatically generates proper heading hierarchies and document landmarks
- **Rich ARIA Support**: Intelligently adds appropriate ARIA attributes and roles
- **Alternative Formats**: Generates multiple versions optimized for different accessibility needs
- **Cognitive Accessibility**: Tools for simplifying complex content and improving readability
- **Keyboard Navigation**: Enhanced keyboard support with visible focus indicators
- **Accessible Code Blocks**: Makes code examples accessible to screen reader users
- **Multilingual Support**: Handles internationalization with appropriate language attributes

## Installation

```bash
npm install -g accessdocs
```

## Quick Start

1. Initialize a new documentation project:

```bash
accessdocs init my-project
```

2. Configure your accessibility preferences in `accessdocs.config.js`

3. Add your documentation in Markdown format to the `docs` directory

4. Generate your accessible documentation:

```bash
accessdocs build
```

5. Preview and test the accessibility of your documentation:

```bash
accessdocs serve
```

## Accessibility Features

### Screen Reader Optimization

AccessDocs ensures that documentation is perfectly navigable by screen readers by:

- Providing appropriate heading hierarchy for navigation
- Adding descriptive alt text for all images
- Ensuring proper semantic HTML structure
- Using ARIA landmarks and roles appropriately
- Creating skip navigation links
- Ensuring code examples are properly annotated

### Cognitive Accessibility

For users with cognitive disabilities, AccessDocs provides:

- Simplified content views with reduced complexity
- Reading level analysis and suggestions
- Consistent navigation and predictable page structure
- Options to reduce animations and distractions
- Clear, plain language summaries of complex topics

### Motor Disability Support

For users with motor disabilities, AccessDocs ensures:

- Complete keyboard navigability
- Large, easily clickable interaction targets
- Reduced need for precise mouse movements
- Shortcut keys for common operations

### Visual Impairment Support

Beyond screen reader support, AccessDocs provides:

- High contrast themes
- Customizable text sizing
- Support for user font preferences
- Respecting system-level color scheme preferences

## Configuration

AccessDocs can be configured using the `accessdocs.config.js` file. See the [configuration documentation](./docs/configuration.md) for details.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT
