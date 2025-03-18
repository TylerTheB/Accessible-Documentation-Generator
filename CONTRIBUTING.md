# Contributing to AccessDocs

Thank you for your interest in contributing to AccessDocs! This guide outlines how to contribute effectively to make documentation more accessible for everyone.

## Code of Conduct

By participating in this project, you agree to maintain a welcoming, inclusive, and harassment-free environment. Be respectful to all contributors regardless of background or experience level.

## How to Contribute

### Reporting Issues

If you encounter a bug or have a feature request:

1. Check if the issue already exists in the [Issues](https://github.com/yourusername/accessdocs/issues) section
2. If not, create a new issue with a clear title and description
3. For bugs, include:
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots (if applicable)
   - Browser/OS/device information
   - Any assistive technology affected (e.g., screen reader type and version)
4. For feature requests, explain:
   - What the feature would accomplish
   - How it enhances accessibility
   - Any relevant use cases or standards (e.g., WCAG guidelines)

### Submitting Changes

1. Fork the repository
2. Create a new branch with a descriptive name (`fix-contrast-issue`, `add-keyboard-navigation`)
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

### Pull Request Guidelines

When submitting a pull request:

1. Reference any related issues (`Fixes #123`)
2. Describe what the changes do and why they're necessary
3. Explain how the changes improve accessibility
4. Include screenshots or screen captures if relevant
5. If your PR adds new features, update the documentation

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/accessdocs.git
cd accessdocs

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Start development server
npm run serve
```

## Accessibility Guidelines

All contributions must:

1. Maintain or improve WCAG 2.1 AA compliance at minimum (AAA preferred)
2. Work properly with screen readers (test with at least one of: NVDA, JAWS, VoiceOver)
3. Support keyboard navigation (all interactive elements must be keyboard accessible)
4. Maintain proper heading hierarchy and semantic HTML
5. Include appropriate ARIA attributes where needed
6. Consider users with low vision, color blindness, and cognitive disabilities

## Coding Standards

- Use semantic HTML elements whenever possible
- Include descriptive alt text for all images
- Maintain appropriate color contrast ratios
- Use proper ARIA roles and attributes
- Add comments explaining accessibility features
- Follow the existing code style and formatting

## Testing

Before submitting your changes, test them with:

1. Automated accessibility tools (e.g., axe, WAVE)
2. At least one screen reader
3. Keyboard-only navigation
4. High contrast mode
5. Browser zoom (200%+)
6. Responsive design in multiple viewport sizes

## Documentation

If you modify or add features:

1. Update relevant documentation
2. Add code comments explaining the accessibility considerations
3. Include examples of usage
4. Document any accessibility features and how to use them

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

If you have questions about contributing, please open an issue with the "question" label, and we'll be happy to help.

Thank you for helping make documentation more accessible for everyone!
