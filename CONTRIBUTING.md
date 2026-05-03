# Contributing to Shai-Scanner

Thank you for your interest in contributing to Shai-Scanner! This document provides guidelines and information for contributors.

## 🎉 Welcome

Shai-Scanner is an open-source project that benefits from community contributions. Whether you're fixing a bug, adding a feature, improving documentation, or reporting a security vulnerability, we appreciate your help!

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 🛠️ Development Setup

### Prerequisites

- **Node.js 18 or higher** (LTS recommended)
- **npm** (comes with Node.js)
- **Git**

### Getting Started

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/shai-scanner.git
   cd shai-scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   node src/cli.js --version
   ```

### Development Commands

```bash
# Core testing (174+ tests)
npm test

# Run specific test suites
npm run test:tui           # TUI component tests
npm run test:visual        # Visual regression tests
npm run test:benchmark     # Performance benchmarks
npm run test:cross-platform # Cross-platform compatibility

# Run scanner in development mode
npm run tui                # Launch interactive TUI
node src/cli.js --scan . --offline --no-auto-update  # CLI scan

# Update IOC database
npm run update-db

# Build and package
npm run build              # Build for distribution
npm pack --dry-run         # Preview package contents
```

## 📝 Coding Standards

### Core Principles

1. **Zero Runtime Dependencies**: This is non-negotiable. All functionality must use Node.js built-ins only.
2. **Modern JavaScript**: Use ES modules (`import`/`export`), async/await, and modern syntax.
3. **Descriptive Naming**: Use clear, descriptive variable and function names.
4. **Comments for Complexity**: Document complex logic, algorithms, or security considerations.

### Code Style

While we don't use a linter, maintain consistency with the existing codebase:

```javascript
// Good example
async function scanDirectory(dirPath, options = {}) {
  const { includeNodeModules = true, includeLockfiles = true } = options;
  
  // Validate path exists
  if (!existsSync(dirPath)) {
    throw new Error(`Path does not exist: ${dirPath}`);
  }
  
  // Complex algorithm explanation here
  const findings = [];
  
  // ... implementation
  
  return { findings, stats };
}
```

### File Organization

- Keep files under 600 lines
- Split into smaller components only when it improves cohesion
- Follow the existing module structure in `src/`

## 🧪 Testing Requirements

### All Changes Must Be Tested

1. **New Features**: Include unit tests and integration tests
2. **Bug Fixes**: Add regression tests
3. **Visual Changes**: Run visual regression tests
4. **Performance Changes**: Benchmark before and after

### Running Tests

```bash
# Full test suite
npm test

# Specific test categories
npm run test:tui          # TUI components
npm run test:visual       # Visual regression
npm run test:benchmark    # Performance
```

### Writing Tests

Tests are located in the `test/` directory. Follow the existing patterns:

```javascript
// Example test structure
describe('Scanner', () => {
  test('should scan directory with lockfiles', async () => {
    const db = new VulnerabilityDatabase({ offline: true });
    const scanner = new Scanner(db);
    
    const result = await scanner.scan(['test/fixtures'], {
      includeLockfiles: true
    });
    
    expect(result.findings).toBeDefined();
    expect(result.stats.packagesScanned).toBeGreaterThan(0);
  });
});
```

## 🔄 Pull Request Process

### 1. Create a Feature Branch

```bash
# From main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### 2. Make Your Changes

- Write code following the standards above
- Add or update tests as needed
- Update documentation if your changes affect the API or usage

### 3. Test Your Changes

```bash
# Run the full test suite
npm test

# Run specific tests related to your changes
npm run test:tui  # If you modified TUI code

# Test CLI commands mentioned in documentation
node src/cli.js --help
node src/cli.js --scan . --offline --no-auto-update
```

### 4. Commit with Descriptive Messages

```bash
# Good commit messages
git commit -m "fix: resolve lockfile parsing error for yarn.lock v2"
git commit -m "feat: add SBOM generation in tag-value format"
git commit -m "docs: update API documentation for live advisory queries"

# Use conventional commits format when possible
# type(scope): description
```

### 5. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create pull request on GitHub
# Include:
# - Clear description of changes
# - Test results
# - Any breaking changes
# - Related issue numbers
```

### 6. Code Review Process

- All PRs require review before merging
- Address feedback promptly
- Keep PRs focused and reasonably sized
- Update documentation as needed

## 🚀 Release Process

### For Maintainers

1. **Version Bumping**
   ```bash
   # Use the version bump script
   ./scripts/bump-version.sh [major|minor|patch]
   ```

2. **Update Changelog**
   - Add entries to `CHANGELOG.md`
   - Follow the existing format

3. **Create Release**
   ```bash
   # Run the release script
   ./scripts/release.sh
   ```

4. **Verify Release**
   ```bash
   # Test installation
   npm install -g ./shai-scanner-*.tgz
   shai-scanner --version
   ```

## 🐛 Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Package name and version** (if applicable)
2. **Lockfile snippet or package path**
3. **Scanner command and output**
4. **Steps to reproduce**
5. **Expected vs actual behavior**
6. **Node.js version and OS**

### Security Vulnerabilities

For security vulnerabilities, please follow our [Security Policy](SECURITY.md). **Do not** report security issues through public GitHub issues.

### Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Describe the use case
3. Explain why it would benefit the community
4. Consider implementation complexity

## 📚 Documentation

### Improving Documentation

Documentation improvements are always welcome:

- Fix typos or grammatical errors
- Add examples or clarify instructions
- Update outdated information
- Improve API documentation

### Documentation Structure

```
docs/
├── API.md                  # API documentation (you're here)
├── TUI_USAGE_GUIDE.md     # TUI usage and architecture
├── MIGRATION_GUIDE.md     # Migration from legacy TUI
├── CROSS_PLATFORM_TESTING.md # Test results and compatibility
└── stakeholders/          # Stakeholder documentation
```

## 🤝 Community

### Getting Help

- **Issues**: For bugs and feature requests
- **Discussions**: For questions, feature suggestions, and showcasing projects
  - [Q&A Template](.github/DISCUSSION_TEMPLATE_QA.md) - For questions about shai-scanner
  - [Feature Request Template](.github/DISCUSSION_TEMPLATE_FEATURE.md) - For suggesting improvements
  - [Showcase Template](.github/DISCUSSION_TEMPLATE_SHOWCASE.md) - For sharing your projects
- **Security**: For security vulnerabilities (see SECURITY.md)

### Recognition

We value and appreciate all contributions! Check out our comprehensive [Contributor Recognition Program](.github/community/CONTRIBUTOR_RECOGNITION.md) for detailed information on how we recognize contributors.

**Recognition Levels:**
- 🥉 **Bronze**: First-time contributors
- 🥈 **Silver**: Regular contributors (5+ contributions)
- 🥇 **Gold**: Significant contributors (20+ contributions)
- 💎 **Diamond**: Exceptional contributors (50+ contributions)
- 🛡️ **Maintainer**: Core team members

**Benefits include:**
- GitHub badges for your profile
- Swag and merchandise
- Conference ticket sponsorship
- Speaking opportunities
- Early access to features
- Special Discord roles

**Where we recognize contributors:**
- `CHANGELOG.md` for significant contributions
- GitHub contributors page
- Release notes
- Community newsletter
- Social media spotlights
- Annual contributor summit

For nomination details and full criteria, see the [Contributor Recognition Program](.github/community/CONTRIBUTOR_RECOGNITION.md).

## 📋 Checklist for Contributors

Before submitting a PR, ensure:

- [ ] Code follows the project's coding standards
- [ ] Tests are included for new features/bug fixes
- [ ] All tests pass (`npm test`)
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] No runtime dependencies are added
- [ ] Cross-platform compatibility is maintained
- [ ] Security considerations are addressed

## 🎯 Good First Issues

Looking for a way to contribute? Check out issues labeled:

- `good-first-issue` - Perfect for new contributors
- `documentation` - Documentation improvements
- `bug` - Bug fixes
- `enhancement` - New features

## 📞 Contact

- **General Questions**: GitHub Issues
- **Security Issues**: security@shai-scanner.dev (see [SECURITY.md](SECURITY.md))
- **Code of Conduct**: See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

Thank you for contributing to Shai-Scanner! Your help makes this project better for everyone. 🐕