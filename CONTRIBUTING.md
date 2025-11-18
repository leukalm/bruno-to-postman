# Contributing to bruno-to-postman

First off, thank you for considering contributing to bruno-to-postman! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/leukalm/bruno-to-postman/issues) to avoid duplicates.

When creating a bug report, include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (Node.js version, OS, etc.)
- Sample .bru files if relevant

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:
- A clear and descriptive title
- A detailed description of the proposed functionality
- Examples of how the feature would be used
- Why this enhancement would be useful

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes**
4. **Add tests** if applicable
5. **Ensure tests pass**: `npm test`
6. **Ensure code builds**: `npm run build`
7. **Follow the code style**: `npm run lint`
8. **Update documentation** if needed
9. **Commit your changes** with a clear commit message
10. **Push to your fork** and submit a pull request

### Commit Message Guidelines

We follow conventional commits format:

```
<type>(<scope>): <subject>

<body>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(converter): add support for GraphQL requests
fix(parser): handle multiline headers correctly
docs(readme): update installation instructions
test(e2e): add batch conversion test cases
```

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0

### Setup
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/bruno-to-postman.git
cd bruno-to-postman

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Test the CLI locally
npm link
bruno-to-postman convert ./test.bru -o ./output.json
```

### Project Structure
```
src/
  builders/        # Postman collection builders
  commands/        # CLI commands
  converters/      # Bruno to Postman converters
  parsers/         # Bruno file parsers
  services/        # File I/O, logging, etc.
  types/           # TypeScript type definitions
  utils/           # Utility functions
  validators/      # Request/collection validators

tests/
  unit/            # Unit tests
  integration/     # Integration tests
  contract/        # Contract tests
  fixtures/        # Test data
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Code Style

- **TypeScript**: Use strict typing, avoid `any` types
- **Formatting**: Prettier (auto-formatted on save)
- **Linting**: ESLint rules enforced
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for types and interfaces
  - Descriptive names (prefer clarity over brevity)

### Testing Guidelines

- Write tests for new features
- Maintain or improve code coverage
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with your question or reach out via GitHub discussions.

Thank you for contributing! 🚀
