# General Question Response Templates

**Category:** General Questions  
**Last Updated:** 2026-05-02  
**Maintainer:** Max 🐶 (code-puppy-df9bb5)

---

## Table of Contents

1. [Quick Answer Template](#31-quick-answer-template)
2. [Detailed Explanation Template](#32-detailed-explanation-template)
3. [Documentation Reference Template](#33-documentation-reference-template)
4. [Community Redirect Template](#34-community-redirect-template)

---

## 3.1 Quick Answer Template

**Template Name:** `question_quick`  
**Description:** Provide concise answer to straightforward question  
**When to use:** For simple, factual questions with clear answers

**Template Content:**
```markdown
Hi [User/Team Name],

Great question! Here's the quick answer:

**[Question summary]:**  
[Concise answer in 1-3 sentences]

**Example:**
```bash
[provide working example if applicable]
```

**Learn More:**
- [Link to relevant documentation section]
- [Link to related examples]

Let me know if you need more details!

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

Great question! Here's the quick answer:

**How to scan only production dependencies:**  
Use the `--production` flag to skip dev dependencies.

**Example:**
```bash
shai-scanner --production
```

**Learn More:**
- [Scanning Modes Documentation](../../TUI_USAGE_GUIDE.md#scanning-modes)
- [Dependency Filtering Examples](../../examples/)

Let me know if you need more details!

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [CLI Reference](../../API.md)
- [Usage Guide](../../TUI_USAGE_GUIDE.md)

---

## 3.2 Detailed Explanation Template

**Template Name:** `question_detailed`  
**Description:** Provide comprehensive answer with context  
**When to use:** For complex questions requiring explanation

**Template Content:**
```markdown
Hi [User/Team Name],

Thanks for the great question! Let me break this down for you.

## [Question Topic]

**Short Answer:**  
[1-2 sentence summary]

**Detailed Explanation:**

1. **Background:**  
   [Context about why this works this way]

2. **How It Works:**  
   [Step-by-step explanation]

3. **Example:**  
   ```bash
   [complete working example]
   ```

4. **Configuration Options:**  
   - `--option1`: [description]
   - `--option2`: [description]
   - `--option3`: [description]

5. **Best Practices:**  
   - [Practice 1]
   - [Practice 2]
   - [Practice 3]

**Related Features:**
- [Feature A]: [how it relates]
- [Feature B]: [how it complements]

**Further Reading:**
- [Documentation link 1]
- [Documentation link 2]
- [Example repository]

Does this help? Let me know if you'd like me to clarify anything!

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

Thanks for the great question! Let me break this down for you.

## How Custom IOC Integration Works

**Short Answer:**  
Custom IOCs let you add organization-specific threat intelligence to enhance scanning accuracy.

**Detailed Explanation:**

1. **Background:**  
   Organizations often have internal threat intelligence about malicious packages not yet in public databases. Custom IOCs bridge this gap.

2. **How It Works:**  
   ```yaml
   # .shai-scanner/config.yml
   custom_iocs:
     - name: "Internal Malware DB"
       source: "./internal-iocs.json"
       format: "json"
       priority: "high"
   ```

3. **Example:**  
   ```bash
   # Create IOC file
   echo '[{"name":"evil-pkg","hash":"abc123","reason":"Internal finding"}]' > internal-iocs.json
   
   # Run scanner with custom IOCs
   shai-scanner --iocs ./internal-iocs.json
   ```

4. **Configuration Options:**  
   - `--iocs`: Path to IOC file or directory
   - `--ioc-format`: json, csv, yara (default: auto-detect)
   - `--ioc-priority`: Override priority levels

5. **Best Practices:**  
   - Keep IOC files under version control
   - Use descriptive names for IOCs
   - Regularly update with new threat intel

**Related Features:**
- **Live Advisory Mode:** Complements custom IOCs with real-time public data
- **SBOM Generation:** Export enhanced scan results with custom IOC matches

**Further Reading:**
- [Custom IOC Documentation](../../API.md#custom-iocs)
- [Enterprise Configuration Examples](../../examples/enterprise-config/)

Does this help? Let me know if you'd like me to clarify anything!

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [API Documentation](../../API.md)
- [Configuration Guide](../../TUI_USAGE_GUIDE.md#configuration)

---

## 3.3 Documentation Reference Template

**Template Name:** `question_doc_reference`  
**Description:** Direct user to relevant documentation  
**When to use:** For questions already answered in docs

**Template Content:**
```markdown
Hi [User/Team Name],

Great question! This is covered in our documentation.

**Quick Answer:**  
[1-sentence summary]

**Full Documentation:**  
- 📖 **[Section Title]:** [Link to specific section]
- 📖 **[Related Section]:** [Link]

**Key Points:**
1. [Important point 1 from docs]
2. [Important point 2 from docs]
3. [Important point 3 from docs]

**Example from Docs:**
```bash
[copy relevant example from documentation]
```

**Pro Tip:**  
[Helpful hint or common gotcha]

If the documentation doesn't answer your question fully, let me know and I'll help!

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

Great question! This is covered in our documentation.

**Quick Answer:**  
Use `--output sarif` for GitHub integration.

**Full Documentation:**  
- 📖 **Output Formats:** [../../TUI_USAGE_GUIDE.md#output-formats]
- 📖 **GitHub Integration:** [../../TROUBLESHOOTING.md#4-cicd-issues]

**Key Points:**
1. SARIF format is required for GitHub Advanced Security
2. Use `--output sarif --output-file results.sarif`
3. GitHub expects specific schema version

**Example from Docs:**
```bash
shai-scanner --output sarif --output-file results.sarif
```

**Pro Tip:**  
GitHub has a 50MB limit for SARIF uploads. Use `--max-size 50m` for large projects.

If the documentation doesn't answer your question fully, let me know and I'll help!

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Documentation Index](../../README.md#documentation)
- [Tutorials](../../tutorials/)

---

## 3.4 Community Redirect Template

**Template Name:** `question_community`  
**Description:** Redirect to community resources  
**When to use:** For questions better answered by community

**Template Content:**
```markdown
Hi [User/Team Name],

Thanks for reaching out! This sounds like a great question for our community.

**Community Resources:**
- 💬 **GitHub Discussions:** [Link to discussions]
- 🐦 **Twitter:** [@ShaiScanner](https://twitter.com/shaiscanner)
- 📧 **Mailing List:** [Link to signup]
- 🎮 **Discord Server:** [Link to Discord]

**Why Community?**
- Other users may have faced similar challenges
- Get diverse perspectives and solutions
- Share your experience with others
- Stay updated on latest tips and tricks

**Before Posting:**
1. Check existing discussions for similar questions
2. Search documentation for answers
3. Include relevant details (version, OS, error messages)

**Official Support:**
- For bugs: [GitHub Issues](link)
- For security: [Security Policy](../../SECURITY.md)
- For enterprise: [Contact Sales](link)

We're here to help either way! Feel free to ask here or join the community.

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

Thanks for reaching out! This sounds like a great question for our community.

**Community Resources:**
- 💬 **GitHub Discussions:** [github.com/shai-scanner/discussions](https://github.com/shai-scanner/discussions)
- 🐦 **Twitter:** [@ShaiScanner](https://twitter.com/shaiscanner)
- 📧 **Mailing List:** [lists.shai-scanner.dev](https://lists.shai-scanner.dev)
- 🎮 **Discord Server:** [discord.gg/shai-scanner](https://discord.gg/shai-scanner)

**Why Community?**
- Other users may have faced similar challenges
- Get diverse perspectives and solutions
- Share your experience with others
- Stay updated on latest tips and tricks

**Before Posting:**
1. Check existing discussions for similar questions
2. Search documentation for answers
3. Include relevant details (version, OS, error messages)

**Official Support:**
- For bugs: [GitHub Issues](https://github.com/shai-scanner/issues)
- For security: [Security Policy](../../SECURITY.md)
- For enterprise: [enterprise@shai-scanner.dev](mailto:enterprise@shai-scanner.dev)

We're here to help either way! Feel free to ask here or join the community.

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Community Guidelines](../../CODE_OF_CONDUCT.md)
- [Contributing](../../CONTRIBUTING.md)

---

**[← Back to Main Index](../RESPONSE_TEMPLATES.md)**