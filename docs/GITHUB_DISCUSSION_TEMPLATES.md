# GitHub Discussion Templates

This document explains the GitHub Discussion templates created for the shai-scanner project.

## Overview

We've created three discussion templates to help organize community conversations:

1. **Q&A Template** - For asking questions about shai-scanner
2. **Feature Request Template** - For suggesting new features or improvements
3. **Showcase Template** - For sharing how you're using shai-scanner

## Template Details

### 📋 Q&A Template (`DISCUSSION_TEMPLATE_QA.md`)

**Purpose**: Help users ask questions and get answers from the community.

**Sections**:
- **Question**: What's your question?
- **Context**: What are you trying to accomplish?
- **Environment**: OS, Node.js version, shai-scanner version
- **Expected Behavior**: What did you expect?
- **Actual Behavior**: What actually happened?
- **Common Questions Checklist**: Quick categorization
- **Helpful Resources**: Links to documentation

**Labels**: `question`, `help`

### 💡 Feature Request Template (`DISCUSSION_TEMPLATE_FEATURE.md`)

**Purpose**: Collect and organize feature suggestions from the community.

**Sections**:
- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Alternatives Considered**: Other approaches?
- **Use Cases**: Real-world scenarios
- **Priority Assessment**: How important is this?
- **Impact Assessment**: Who benefits?
- **Implementation Ideas**: Technical suggestions

**Labels**: `enhancement`, `feature`

### 🎉 Showcase Template (`DISCUSSION_TEMPLATE_SHOWCASE.md`)

**Purpose**: Share success stories and real-world usage of shai-scanner.

**Sections**:
- **Project Description**: What's your project?
- **How shai-scanner Helped**: Problems solved
- **Results**: Impact and metrics
- **Links**: Project repository, demos
- **Permission to Share**: Consent for sharing
- **Contact Information**: Optional follow-up

**Labels**: `showcase`, `success-story`

## Additional GitHub Templates

### Issue Templates

We've also created issue templates for structured bug reports and feature requests:

- **Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.md`)
- **Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.md`)

## Community Resources

Along with the templates, we've created:

- **Community Guidelines** (`.github/community/GUIDELINES.md`)
- **Contributor Recognition** (`.github/community/CONTRIBUTOR_RECOGNITION.md`)
- **FAQ** (`.github/community/FAQ.md`)
- **Community README** (`.github/community/README.md`)

## Validation Scripts

We've created scripts to validate the GitHub setup:

### Template Validation
```bash
npm run validate:templates
```
Validates YAML front matter and markdown structure of discussion templates.

### GitHub Setup Check
```bash
npm run check:github
```
Checks that all required GitHub files and directories are present.

## Best Practices

### For Users
1. **Use the right template**: Choose Q&A for questions, Feature Request for suggestions
2. **Fill out all sections**: Provide complete information for faster responses
3. **Search first**: Check if your question has already been asked
4. **Be specific**: Include environment details and reproduction steps

### For Contributors
1. **Help answer questions**: Share your knowledge in Q&A discussions
2. **Review feature requests**: Provide feedback on proposals
3. **Share your projects**: Use the Showcase template to inspire others
4. **Improve templates**: Suggest enhancements to make them more helpful

## Maintenance

### Updating Templates
1. Edit the template files in `.github/`
2. Run validation: `npm run validate:templates`
3. Update this documentation if needed
4. Test by creating a new discussion

### Adding New Templates
1. Create the template file with YAML front matter
2. Add to `scripts/validate-discussion-templates.js`
3. Update `scripts/check-github-setup.js`
4. Document in this file

## Integration with Existing Documentation

These templates complement:
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Code of Conduct](../CODE_OF_CONDUCT.md) - Community standards
- [Security Policy](../SECURITY.md) - Vulnerability reporting
- [Documentation](./) - Technical guides and references

## Getting Help

If you have questions about the templates:
1. Check the [FAQ](../.github/community/FAQ.md)
2. Search existing discussions
3. Start a new Q&A discussion using the template

---

*Last updated: [Date] | Part of Phase 4: User Onboarding Materials*