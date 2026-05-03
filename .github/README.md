# GitHub Discussion Templates

This directory contains templates for GitHub Discussions in the shai-scanner project.

## Templates

### 📋 Q&A Template (`DISCUSSION_TEMPLATE_QA.md`)
Use this template for asking questions about shai-scanner. Include:
- Specific question details
- Environment information
- What you've already tried
- Expected vs actual behavior

**Labels:** `question`, `help`

### 💡 Feature Request Template (`DISCUSSION_TEMPLATE_FEATURE.md`)
Use this template to suggest new features or improvements. Include:
- Problem statement
- Proposed solution
- Use cases and impact assessment
- Implementation ideas

**Labels:** `enhancement`, `feature`

### 🎉 Showcase Template (`DISCUSSION_TEMPLATE_SHOWCASE.md`)
Use this template to share how you're using shai-scanner in your project. Include:
- Project description
- How shai-scanner helped
- Results and metrics
- Permission to share your story

**Labels:** `showcase`, `success-story`

## Validation

Run the validation script to ensure templates are properly formatted:

```bash
node scripts/validate-discussion-templates.js
```

## Contributing

When modifying these templates:
1. Maintain YAML front matter structure
2. Include helpful prompts and examples
3. Keep templates under 5KB each
4. Test with the validation script
5. Update this README if adding new templates

## Best Practices

- Use clear, descriptive titles
- Include relevant labels for categorization
- Provide helpful prompts in comments
- Add validation checklists
- Link to relevant documentation