# Shai-Scanner v4.6.0 Support Team Briefing

**Version:** 1.0  
**Last Updated:** 2026-05-02  
**Prepared for:** Support Team Members  
**Prepared by:** Max 🐶 (code-puppy-254051)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Audience](#2-target-audience)
3. [Key Technical Details](#3-key-technical-details)
4. [Common Issues & Solutions](#4-common-issues--solutions)
5. [Troubleshooting Guide Reference](#5-troubleshooting-guide-reference)
6. [Escalation Procedures](#6-escalation-procedures)
7. [Response Guidelines](#7-response-guidelines)
8. [Resources](#8-resources)
9. [Launch Timeline](#9-launch-timeline)
10. [Success Metrics](#10-success-metrics)

---

## 1. Product Overview

### What is Shai-Scanner?

Shai-Scanner is a **dependency-light npm supply-chain scanner** designed to detect and prevent sophisticated supply-chain attacks targeting JavaScript/Node.js ecosystems. It provides offline-capable, zero-dependency scanning that eliminates the very risks it aims to protect against.

### Purpose

- **Detect known malicious packages** (Shai-Hulud, Mini Shai-Hulud variants)
- **Identify suspicious install-time artifacts** (setup scripts, environment manipulation)
- **Prevent dependency confusion attacks** (typosquatting, namespace hijacking)
- **Integrate with live advisories** (OSV.dev, GitHub Advisory Database)
- **Support compliance requirements** (SOC 2, ISO 27001, GDPR)

### Key Features

| Feature | Description |
|---------|-------------|
| **Zero Runtime Dependencies** | No React, Ink, Commander, Chalk, or transitive install risk |
| **Component-based TUI** | Modern terminal UI with lifecycle management and differential rendering |
| **Offline Capability** | Air-gapped environments, CI/CD without internet access |
| **Multi-Format Output** | JSON, SARIF, HTML reports for different stakeholders |
| **Multi-Project Scanning** | Scan multiple repositories from a single command |
| **Custom IOC Support** | Import organization-specific threat intelligence |
| **Live Advisory Mode** | Optional exact-version checks against OSV.dev and GitHub |
| **SBOM Generation** | SPDX 2.3 format for supply chain transparency |

### What's New in v4.6.0

- **Ground-up hardening pass** over older React/Ink TUI bundle
- **Broader dependency coverage**: pnpm, yarn, bun lockfiles
- **Mini Shai-Hulud coverage** for April 2026 npm packages
- **Artifact and persistence detection** for suspicious files
- **Safer update path** with private file permissions
- **HTML reports** with interactive charts and export capabilities
- **Multi-project scanning** with parallel execution support

---

## 2. Target Audience

### Primary Users

1. **Open Source Projects**: Protecting npm ecosystem from supply-chain attacks
2. **Small-Medium Businesses**: Cost-effective security without enterprise overhead
3. **Startups**: Security from day one without budget constraints
4. **Educational Institutions**: Teaching secure development practices

### Secondary Users

1. **Enterprise Development Teams**: Supplementing existing security tools
2. **Government Contractors**: Meeting strict security compliance requirements
3. **Financial Institutions**: Protecting critical financial software
4. **Healthcare Organizations**: Securing patient data applications

### Use Cases

- **CI/CD Pipeline Integration**: Automated security scanning in GitHub Actions, GitLab CI, Jenkins
- **Developer Workstations**: Local scanning before code commits
- **Security Audits**: Comprehensive vulnerability assessment for compliance
- **Incident Response**: Forensic analysis when attacks are suspected
- **Supply Chain Transparency**: SBOM generation for regulatory compliance

---

## 3. Key Technical Details

### Node.js Requirements

- **Minimum Version**: Node.js 18.0.0 (required for native `fetch` API)
- **Recommended**: Node.js 20.x LTS
- **Compatibility**: Windows, macOS, Linux

### Installation Methods

#### Global Installation (Recommended for regular use)
```bash
npm install -g shai-scanner
# Or from local folder
npm install -g .
```

#### One-Time Use with npx (Recommended for CI/CD)
```bash
npx shai-scanner --scan .
```

#### Local Project Installation
```bash
npm install shai-scanner
npx shai-scanner --scan .
```

### CLI Usage

#### Basic Commands
```bash
# Scan current directory
shai-scanner --scan .

# Scan specific directory
shai-scanner --scan /path/to/project

# Check single package
shai-scanner --check package-name@version

# Launch interactive TUI
shai-scanner --tui
```

#### Advanced Commands
```bash
# Lockfiles only (fastest)
shai-scanner --scan . --lockfiles-only

# Offline mode (deterministic CI)
shai-scanner --scan . --offline --no-auto-update

# Live advisory checks
shai-scanner --scan . --live

# Multiple output formats
shai-scanner --scan . --json --sarif --html

# Multi-project scanning
shai-scanner --multi-scan projects.txt
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No vulnerabilities found |
| 1 | Vulnerabilities found, `--fail-on-advisory` matched, or `--fail-on-warning` matched |
| 2 | Scan/runtime error |
| 3 | Database update failed |
| 4 | Invalid arguments |

### Programmatic API

```javascript
import { VulnerabilityDatabase, Scanner, queryLiveAdvisories } from 'shai-scanner';

const db = new VulnerabilityDatabase({ offline: true });
const scanner = new Scanner(db);
const result = await scanner.scan(['.'], {
  includeNodeModules: true,
  includeLockfiles: true,
  includeManifests: true
});
```

---

## 4. Common Issues & Solutions

### Top 10 Most Likely Support Issues

#### 1. **"fetch is not a function" Error**
**Problem**: Node.js version too old  
**Solution**: Upgrade to Node.js 18+ using `nvm install 18` or download from nodejs.org

#### 2. **Permission Denied on Global Install**
**Problem**: `npm install -g` fails with EACCES errors  
**Solution**: Use nvm to avoid permission issues, or fix npm global directory permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
```

#### 3. **"shai-scanner: command not found"**
**Problem**: Scanner not installed globally or not in PATH  
**Solution**: Use `npx shai-scanner` instead, or add global bin to PATH:
```bash
export PATH="$(npm bin -g):$PATH"
```

#### 4. **Scan Hangs on Large Repositories**
**Problem**: Performance issues with large codebases  
**Solution**: Use `--lockfiles-only` for faster scans, or limit depth with `--max-depth 3`

#### 5. **Memory Issues with Large Dependency Trees**
**Problem**: JavaScript heap out of memory  
**Solution**: Increase memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" shai-scanner --scan .
```

#### 6. **SARIF Upload Failures**
**Problem**: SARIF file fails to upload to GitHub  
**Solution**: Ensure proper GitHub Actions permissions:
```yaml
permissions:
  security-events: write
```

#### 7. **Offline Mode Not Working**
**Problem**: Scanner tries to make network requests  
**Solution**: Cache database first with `shai-scanner --update`, then use `--offline --no-auto-update`

#### 8. **Custom IOC CSV Not Loading**
**Problem**: Custom IOC file not parsing correctly  
**Solution**: Verify CSV format: `name,version,type,severity,description`

#### 9. **Multi-Project Scanning Failures**
**Problem**: Multi-scan fails or misses projects  
**Solution**: Check project list file format and paths, use glob patterns carefully

#### 10. **HTML Report Generation Issues**
**Problem**: HTML report is blank or corrupted  
**Solution**: Ensure write permissions to output directory, verify file size > 10KB

---

## 5. Troubleshooting Guide Reference

### Primary Resource
- **Full Troubleshooting Guide**: [docs/TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
  - **Installation Issues**: Node.js compatibility, permissions, PATH issues
  - **Scan Issues**: Performance, memory, parsing errors
  - **Output Issues**: JSON/SARIF/HTML formatting problems
  - **CI/CD Issues**: GitHub Actions, GitLab CI, Jenkins integration
  - **Network Issues**: Proxy settings, firewall blocking, cache corruption
  - **Configuration Issues**: Environment variables, config files, debug mode

### Quick Diagnostic Commands
```bash
# Check installation
shai-scanner --version
node --version
npm --version

# Test basic functionality
shai-scanner --scan . --offline --quiet --json | jq '.summary'

# Verify database
shai-scanner --list-db

# Test network connectivity
shai-scanner --update --json 2>&1 | head -20
```

### Common Fix Commands
```bash
# Reset everything
rm -rf ~/.shai-scanner/cache/
shai-scanner --update
shai-scanner --scan . --offline

# Force reinstall
npm uninstall -g shai-scanner
npm install -g shai-scanner@latest
```

---

## 6. Escalation Procedures

### When to Escalate

#### Immediate Escalation (Critical Issues)
- **Security vulnerabilities** in shai-scanner itself
- **Data loss** or corruption caused by scanner
- **Production outages** linked to scanner updates
- **Compliance violations** reported by customers

#### Standard Escalation (High Priority)
- **Reproducible bugs** affecting multiple users
- **Performance regressions** in new versions
- **Integration failures** with major CI/CD platforms
- **Documentation gaps** causing widespread confusion

#### Routine Escalation (Medium Priority)
- **Feature requests** from multiple customers
- **Edge case bugs** with workarounds available
- **Compatibility issues** with specific environments
- **Localization or accessibility concerns**

### Escalation Contacts

| Issue Type | Primary Contact | Secondary Contact |
|------------|-----------------|-------------------|
| **Security Vulnerabilities** | Adam (Project Lead) | Security Team |
| **Critical Bugs** | Adam (Project Lead) | Technical Team |
| **Feature Requests** | Community Manager | Product Team |
| **Compliance Questions** | Security Lead | Legal Team |
| **Business Inquiries** | Business Development | Executive Team |

### Escalation Process

1. **Gather Information**: Collect all relevant details (logs, steps to reproduce, environment)
2. **Document Issue**: Create detailed ticket with severity assessment
3. **Initial Response**: Acknowledge issue within 2 hours (critical) or 24 hours (standard)
4. **Escalation Path**: 
   - Level 1: Support Team (initial triage)
   - Level 2: Technical Team (bug fixes, investigations)
   - Level 3: Adam/Project Lead (critical decisions, security issues)
5. **Communication**: Keep customer updated on progress and timeline

### Information Required for Escalation

```markdown
## Issue Report Template

**Issue Type**: Bug / Feature Request / Question / Security
**Severity**: Critical / High / Medium / Low
**Environment**: 
- Node.js version: 
- npm version: 
- OS: 
- shai-scanner version: 

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**: 

**Actual Behavior**: 

**Additional Context**:
- Logs/output: 
- Screenshots: 
- Workaround (if any): 
```

---

## 7. Response Guidelines

### Response Templates

#### For Bugs
```markdown
Thank you for reporting this issue, [Name].

I've confirmed this is a bug in shai-scanner v[version]. Here's what's happening:

**Root Cause**: [Brief technical explanation]
**Impact**: [Who is affected and how]
**Workaround**: [If available]

We've created ticket #[number] and are working on a fix. Expected resolution: [timeline].

In the meantime, you can:
1. [Workaround step 1]
2. [Workaround step 2]

I'll keep you updated on our progress. Please let me know if you have any questions.
```

#### For Feature Requests
```markdown
Thanks for the suggestion, [Name]!

This is a great idea that would benefit many users. I've added it to our roadmap as ticket #[number].

**Current Status**: Under review
**Priority**: [Based on community interest]
**Estimated Timeline**: [If known]

Would you be willing to:
1. Share more details about your use case?
2. Test the feature when it's ready?
3. Contribute to the implementation?

Your feedback helps us prioritize what matters most to our community.
```

#### For Questions
```markdown
Great question, [Name]!

**Answer**: [Clear, concise answer]

**Additional Resources**:
- [Link to relevant documentation]
- [Example code or command]

Let me know if you need clarification or have follow-up questions. We're here to help!
```

#### For Security Issues
```markdown
Thank you for reporting this security concern, [Name].

**Security issues are treated with highest priority.** I've immediately escalated this to our security team.

**What happens next**:
1. Security team will investigate within 24 hours
2. We'll provide an initial assessment within 48 hours
3. We'll coordinate disclosure and fixes

**Please do not**:
- Post details publicly until we've addressed the issue
- Share vulnerability details with others

For immediate security concerns, please contact: security@shai-scanner.dev

We appreciate your responsible disclosure and will keep you updated on our progress.
```

### Response Time Guidelines

| Issue Type | Initial Response | Resolution Target |
|------------|------------------|-------------------|
| **Critical Security** | 2 hours | 24 hours |
| **Critical Bug** | 4 hours | 48 hours |
| **High Priority** | 24 hours | 1 week |
| **Medium Priority** | 48 hours | 2 weeks |
| **Low Priority** | 1 week | 1 month |
| **Feature Request** | 1 week | Roadmap planning |

### Tone and Voice

- **Professional but friendly**: We're approachable experts
- **Empathetic**: Understand user frustration
- **Solution-focused**: Always provide next steps
- **Transparent**: Be honest about limitations and timelines
- **Community-oriented**: Encourage collaboration and feedback

---

## 8. Resources

### Documentation

| Resource | Description | Link |
|----------|-------------|------|
| **README.md** | Product overview and quick start | [README.md](../../README.md) |
| **API Documentation** | Programmatic usage reference | [docs/API.md](../API.md) |
| **Troubleshooting Guide** | Common issues and solutions | [docs/TROUBLESHOOTING.md](../TROUBLESHOOTING.md) |
| **TUI Usage Guide** | Interactive terminal UI guide | [docs/TUI_USAGE_GUIDE.md](../TUI_USAGE_GUIDE.md) |
| **Migration Guide** | Upgrading from legacy versions | [docs/MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) |
| **Cross-Platform Testing** | Compatibility information | [docs/CROSS_PLATFORM_TESTING.md](../CROSS_PLATFORM_TESTING.md) |
| **Architecture** | System design and principles | [ARCHITECTURE.md](../../ARCHITECTURE.md) |

### Stakeholder Documentation

| Document | Purpose | Link |
|----------|---------|------|
| **Executive Summary** | Business value proposition | [docs/stakeholders/EXECUTIVE_SUMMARY.md](../stakeholders/EXECUTIVE_SUMMARY.md) |
| **ROI Analysis** | Financial justification | [docs/stakeholders/ROI_ANALYSIS.md](../stakeholders/ROI_ANALYSIS.md) |
| **Security Assessment** | Security features and controls | [docs/stakeholders/SECURITY_ASSESSMENT.md](../stakeholders/SECURITY_ASSESSMENT.md) |
| **Compliance** | Regulatory support | [docs/stakeholders/COMPLIANCE.md](../stakeholders/COMPLIANCE.md) |

### Community Channels

| Channel | Purpose | Link |
|---------|---------|------|
| **GitHub Issues** | Bug reports and feature requests | [GitHub Issues](https://github.com/shai-scanner/shai-scanner/issues) |
| **GitHub Discussions** | Q&A, showcases, community | [GitHub Discussions](https://github.com/shai-scanner/shai-scanner/discussions) |
| **Contributing Guide** | How to contribute | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| **Security Policy** | Vulnerability reporting | [SECURITY.md](../../SECURITY.md) |
| **Code of Conduct** | Community standards | [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) |

### Marketing Materials

| Material | Description | Link |
|----------|-------------|------|
| **Product One-Pager** | Executive summary for stakeholders | [marketing/PRODUCT_ONE_PAGER.md](../../marketing/PRODUCT_ONE_PAGER.md) |
| **Feature Comparison** | Competitive analysis | [marketing/FEATURE_COMPARISON.md](../../marketing/FEATURE_COMPARISON.md) |
| **Use Cases** | Implementation scenarios | [marketing/USE_CASES.md](../../marketing/USE_CASES.md) |
| **FAQ** | Frequently asked questions | [.github/community/FAQ.md](../../.github/community/FAQ.md) |

### Quick Reference Commands

```bash
# Check version and installation
shai-scanner --version
npm list -g shai-scanner

# Basic scan
shai-scanner --scan .

# Offline scan (deterministic)
shai-scanner --scan . --offline --no-auto-update

# Fast CI scan
shai-scanner --scan . --lockfiles-only --quiet --json

# Generate reports
shai-scanner --scan . --json --sarif --html

# Update database
shai-scanner --update

# Import custom IOCs
shai-scanner --scan . --import-csv custom-iocs.csv
```

---

## 9. Launch Timeline

### Key Dates for v4.6.0 Launch

| Phase | Timeline | Activities |
|-------|----------|------------|
| **Content Creation** | Days 1-7 | Documentation, marketing materials, support resources |
| **Soft Launch** | Week 3 | Early adopter testing, community feedback |
| **Public Launch** | Week 4 | npm update, press release, social campaign |
| **Post-Launch** | Months 1-3 | Monitoring, feedback collection, iterations |

### Detailed Schedule

#### Pre-Launch (Current Phase)
- [x] Technical documentation complete
- [x] Marketing materials created
- [x] Support team briefing prepared
- [ ] Final review and approval
- [ ] Technical setup (hosting, analytics)

#### Launch Week Activities
- **Day 1**: Update GitHub repository, publish npm package
- **Day 2**: Publish blog post, launch social campaign
- **Day 3**: Send newsletter, engage community
- **Day 4-5**: Monitor adoption, respond to issues

#### Post-Launch Monitoring
- **Week 1-2**: Track npm downloads, GitHub stars, community engagement
- **Week 3-4**: Analyze website traffic, email campaign performance
- **Month 2-3**: Evaluate content performance, plan improvements

### Support Team Readiness

#### Before Launch
- [ ] Complete this briefing review
- [ ] Test all troubleshooting procedures
- [ ] Set up monitoring for GitHub issues
- [ ] Prepare response templates
- [ ] Coordinate with technical team

#### During Launch
- [ ] Monitor support channels 24/7
- [ ] Respond to critical issues within 2 hours
- [ ] Escalate security concerns immediately
- [ ] Collect user feedback for improvements

#### After Launch
- [ ] Track support ticket trends
- [ ] Identify common issues for documentation
- [ ] Plan training sessions based on user questions
- [ ] Contribute to knowledge base improvements

---

## 10. Success Metrics

### Technical Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| **npm Downloads** | 1,000+ first month | npm analytics |
| **GitHub Stars** | 100+ first month | GitHub insights |
| **Community Contributors** | 10+ first quarter | GitHub contributors |
| **Vulnerability Detection Rate** | 99%+ accuracy | Internal testing |
| **Scan Performance** | < 5 minutes average | User reports |

### Support Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Response Time** | < 24 hours (high priority) | Ticket timestamps |
| **Resolution Time** | < 1 week (high priority) | Ticket timestamps |
| **Customer Satisfaction** | 4.5/5.0 average | Post-resolution surveys |
| **Ticket Volume Trend** | Decreasing after first month | Weekly reports |
| **Escalation Rate** | < 10% of tickets | Escalation tracking |

### Business Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cost Savings** | $100K+ annually per enterprise | ROI calculations |
| **Risk Reduction** | 70%+ reduction in attack surface | Security assessments |
| **Compliance Achievement** | 100% audit requirements met | Audit reports |
| **Developer Adoption** | 80%+ satisfaction rate | User surveys |

### Community Metrics to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| **GitHub Issues Response** | 100% within 48 hours | Issue tracking |
| **Discussion Engagement** | 50+ responses first month | GitHub Discussions |
| **Documentation Usage** | 1,000+ page views first month | Analytics |
| **Feature Adoption** | 30%+ using advanced features | Usage analytics |

### Support Team Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Knowledge Base Updates** | 5+ articles monthly | Documentation commits |
| **Training Completion** | 100% team certified | Training records |
| **Process Improvements** | 2+ suggestions monthly | Team feedback |
| **Cross-training** | 100% coverage of all features | Skill matrix |

### How to Track These Metrics

1. **Set up dashboards** for real-time monitoring
2. **Schedule weekly reviews** of key metrics
3. **Monthly reporting** to stakeholders
4. **Quarterly strategy adjustments** based on data
5. **Annual comprehensive review** of all metrics

### Success Indicators

#### Positive Signs
- Increasing npm downloads week-over-week
- Growing GitHub community (stars, forks, discussions)
- Positive user feedback and testimonials
- Enterprise inquiries and partnership opportunities
- Decreasing support ticket resolution time

#### Warning Signs to Watch
- High volume of installation issues
- Repeated questions about basic usage
- Negative feedback about documentation
- Performance complaints from large projects
- Security concerns or vulnerability reports

---

## Appendix A: Quick Reference Card

### Essential Commands
```bash
# Install
npm install -g shai-scanner
npx shai-scanner --help

# Scan
shai-scanner --scan .
shai-scanner --scan . --lockfiles-only
shai-scanner --scan . --offline

# Reports
shai-scanner --scan . --json
shai-scanner --scan . --sarif
shai-scanner --scan . --html

# Troubleshooting
shai-scanner --version
shai-scanner --list-db
shai-scanner --update
```

### Common Issues Cheat Sheet

| Issue | Quick Fix |
|-------|-----------|
| "fetch is not a function" | Upgrade to Node.js 18+ |
| Permission denied | Use `npx` or fix npm permissions |
| Command not found | Use `npx shai-scanner` |
| Scan too slow | Use `--lockfiles-only` |
| Memory errors | Set `NODE_OPTIONS="--max-old-space-size=4096"` |
| SARIF upload fails | Check GitHub Actions permissions |
| Offline not working | Run `shai-scanner --update` first |

### Escalation Quick Reference

| Severity | Response Time | Escalation Path |
|----------|---------------|-----------------|
| **Critical** | 2 hours | Adam → Security Team |
| **High** | 24 hours | Technical Team → Adam |
| **Medium** | 48 hours | Support Team → Technical Team |
| **Low** | 1 week | Support Team |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **IOC** | Indicator of Compromise - known malicious packages or versions |
| **SARIF** | Static Analysis Results Interchange Format - for code scanning tools |
| **SBOM** | Software Bill of Materials - supply chain transparency document |
| **Shai-Hulud** | Known npm supply-chain attack campaign |
| **Mini Shai-Hulud** | April 2026 variant of Shai-Hulud attack |
| **OSV** | Open Source Vulnerabilities - Google's vulnerability database |
| **Lockfile** | Dependency resolution file (package-lock.json, yarn.lock, etc.) |
| **TUI** | Terminal User Interface - interactive command-line interface |

---

## Appendix C: Contact Directory

### Core Team

| Role | Name | Contact |
|------|------|---------|
| **Project Lead** | Adam | [Internal Contact] |
| **Technical Lead** | Adam | [Internal Contact] |
| **Security Lead** | [To be assigned] | [Internal Contact] |
| **Community Manager** | [To be assigned] | [Internal Contact] |

### Support Channels

| Channel | Purpose | Response Time |
|---------|---------|---------------|
| **GitHub Issues** | Bug reports, feature requests | 24-48 hours |
| **GitHub Discussions** | Q&A, community support | 24-48 hours |
| **Security Email** | Vulnerability reports | 2 hours |
| **Internal Slack** | Team coordination | Immediate |

### External Resources

| Resource | URL |
|----------|-----|
| **npm Package** | https://www.npmjs.com/package/shai-scanner |
| **GitHub Repository** | https://github.com/shai-scanner/shai-scanner |
| **Documentation Site** | [To be established] |
| **Community Discord** | [To be established] |

---

**Document Status**: ✅ Ready for Review  
**Next Review**: 2026-05-09  
**Distribution**: Support Team, Technical Team, Community Managers  

---

*This briefing document is maintained by Max 🐶 (code-puppy-254051) and updated regularly to reflect the latest product changes and support procedures.*