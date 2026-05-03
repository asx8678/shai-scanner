# Security Issue Response Templates

**Category:** Security Issues  
**Last Updated:** 2026-05-02  
**Maintainer:** Max 🐶 (code-puppy-df9bb5)

---

## Table of Contents

1. [Initial Acknowledgment (Confidential)](#41-initial-acknowledgment-confidential)
2. [Severity Assessment Template](#42-severity-assessment-template)
3. [Patch Notification Template](#43-patch-notification-template)
4. [Public Disclosure Template](#44-public-disclosure-template)

---

## 4.1 Initial Acknowledgment (Confidential)

**Template Name:** `security_ack_confidential`  
**Description:** Confidential acknowledgment of security issue  
**When to use:** Immediately after receiving security vulnerability report

**Template Content:**
```markdown
**CONFIDENTIAL - SECURITY ISSUE**

Hi [Reporter Name],

Thank you for reporting this security issue through our responsible disclosure program.

**Issue Reference:** [SEC-YYYY-XXX]  
**Severity:** [Critical/High/Medium/Low] (Initial Assessment)  
**Status:** Under Investigation

**Immediate Actions:**
1. ✅ Issue received and logged
2. 🔍 Security team notified
3. 📋 Initial triage scheduled

**What Happens Next:**
- Security team will investigate within [timeframe based on severity]
- You'll receive updates every [24/48/72] hours
- We'll coordinate disclosure timeline with you

**Confidentiality:**
- Please do not disclose publicly until we've released a fix
- Use secure channels for any additional information
- Our PGP key for encrypted communication: [link]

**Contact:**
- Security Team: security@shai-scanner.dev
- PGP Key: [link to key]

Thank you for helping keep Shai-Scanner secure!

Best regards,  
[Your Name]  
Security Response Team
```

**Example Usage:**
```markdown
**CONFIDENTIAL - SECURITY ISSUE**

Hi Security Researcher,

Thank you for reporting this security issue through our responsible disclosure program.

**Issue Reference:** SEC-2026-003  
**Severity:** Critical (Initial Assessment)  
**Status:** Under Investigation

**Immediate Actions:**
1. ✅ Issue received and logged
2. 🔍 Security team notified
3. 📋 Initial triage scheduled for today

**What Happens Next:**
- Security team will investigate within 4 hours
- You'll receive updates every 24 hours
- We'll coordinate disclosure timeline with you

**Confidentiality:**
- Please do not disclose publicly until we've released a fix
- Use secure channels for any additional information
- Our PGP key for encrypted communication: [link]

**Contact:**
- Security Team: security@shai-scanner.dev
- PGP Key: [https://shai-scanner.dev/security/pgp-key](https://shai-scanner.dev/security/pgp-key)

Thank you for helping keep Shai-Scanner secure!

Best regards,  
Max  
Security Response Team
```

**Related Documentation:**
- [Security Policy](../../SECURITY.md)
- [Responsible Disclosure](../../SECURITY.md#responsible-disclosure)

---

## 4.2 Severity Assessment Template

**Template Name:** `security_severity`  
**Description:** Provide severity assessment and next steps  
**When to use:** After initial investigation to communicate severity

**Template Content:**
```markdown
**CONFIDENTIAL - SECURITY ASSESSMENT**

Hi [Reporter Name],

**Security Issue:** [SEC-YYYY-XXX]  
**Assessment Complete**

**Severity Level:** [Critical/High/Medium/Low]  
**CVSS Score:** [Score] (if applicable)

**Impact Analysis:**
- **Affected Components:** [List of affected files/modules]
- **Attack Vector:** [Network/Local/Physical]
- **Impact Type:** [Confidentiality/Integrity/Availability]
- **User Impact:** [Description of what users could experience]

**Affected Versions:**
- [Version range affected]
- [Safe versions]

**Remediation Status:**
- [ ] Patch in development
- [ ] Patch in testing
- [ ] Patch ready for release

**Timeline:**
- **Fix Expected:** [Date/Timeframe]
- **Disclosure Date:** [Coordinated date with reporter]

**Workaround (if available):**
```bash
[provide workaround command or configuration]
```

**Next Steps:**
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

Please confirm you've received this assessment.

Best regards,  
[Your Name]  
Security Response Team
```

**Example Usage:**
```markdown
**CONFIDENTIAL - SECURITY ASSESSMENT**

Hi Security Researcher,

**Security Issue:** SEC-2026-003  
**Assessment Complete**

**Severity Level:** Critical  
**CVSS Score:** 9.8 (Critical)

**Impact Analysis:**
- **Affected Components:** src/advisory-fetcher.js, src/hash-verifier.js
- **Attack Vector:** Network (remote exploitation)
- **Impact Type:** Integrity (code execution)
- **User Impact:** Remote code execution via malicious advisory database

**Affected Versions:**
- v4.0.0 through v4.5.9
- Safe: v4.6.0+

**Remediation Status:**
- [ ] Patch in development
- [ ] Patch in testing
- [x] Patch ready for release

**Timeline:**
- **Fix Expected:** Today, 5:00 PM UTC
- **Disclosure Date:** May 9, 2026 (7 days from now)

**Workaround (if available):**
```bash
# Disable live advisory mode temporarily
shai-scanner --mode offline
```

**Next Steps:**
1. Patch release scheduled for today
2. Security advisory drafted for distribution
3. CVE申请 submitted

Please confirm you've received this assessment.

Best regards,  
Max  
Security Response Team
```

**Related Documentation:**
- [Security Advisories](../../SECURITY.md#advisories)
- [Vulnerability Scoring](https://www.first.org/cvss/)

---

## 4.3 Patch Notification Template

**Template Name:** `security_patch`  
**Description:** Notify about security patch release  
**When to use:** When security fix is released

**Template Content:**
```markdown
**SECURITY PATCH NOTIFICATION**

Hi [Reporter Name],

**Security Issue:** [SEC-YYYY-XXX]  
**Status:** ✅ Patch Released

**Release Details:**
- **Version:** [Version number]
- **Release Date:** [Date]
- **CVE:** [CVE ID if assigned]
- **Advisory:** [Link to public advisory]

**Patch Highlights:**
- [Key fix 1]
- [Key fix 2]
- [Key fix 3]

**Update Instructions:**
```bash
npm install -g shai-scanner@[version]
```

**Verification:**
```bash
shai-scanner --version
# Should show: [version]
```

**Coordinated Disclosure:**
- **Public Disclosure Date:** [Date]
- **Your Credit:** [How you'll be credited]

**Thank You:**
We truly appreciate your contribution to security. Your report helped protect all Shai-Scanner users.

**Next Steps:**
- Please verify the fix resolves the issue
- Let us know if you need any clarification
- We'll publicly acknowledge your contribution on [date]

Best regards,  
[Your Name]  
Security Response Team
```

**Example Usage:**
```markdown
**SECURITY PATCH NOTIFICATION**

Hi Security Researcher,

**Security Issue:** SEC-2026-003  
**Status:** ✅ Patch Released

**Release Details:**
- **Version:** v4.6.1
- **Release Date:** May 2, 2026
- **CVE:** CVE-2026-12345
- **Advisory:** [https://shai-scanner.dev/security/advisories/2026-001](https://shai-scanner.dev/security/advisories/2026-001)

**Patch Highlights:**
- Fixed remote code execution vulnerability in advisory fetcher
- Added input validation for external data sources
- Implemented cryptographic signature verification

**Update Instructions:**
```bash
npm install -g shai-scanner@4.6.1
```

**Verification:**
```bash
shai-scanner --version
# Should show: v4.6.1
```

**Coordinated Disclosure:**
- **Public Disclosure Date:** May 9, 2026
- **Your Credit:** "Discovered by Security Researcher (reported via responsible disclosure)"

**Thank You:**
We truly appreciate your contribution to security. Your report helped protect all Shai-Scanner users.

**Next Steps:**
- Please verify the fix resolves the issue
- Let us know if you need any clarification
- We'll publicly acknowledge your contribution on May 9, 2026

Best regards,  
Max  
Security Response Team
```

**Related Documentation:**
- [Security Changelog](../../CHANGELOG.md#security)
- [Update Instructions](../../MIGRATION_GUIDE.md)

---

## 4.4 Public Disclosure Template

**Template Name:** `security_disclosure`  
**Description:** Public disclosure of security issue after fix  
**When to use:** After coordinated disclosure date

**Template Content:**
```markdown
**SECURITY ADVISORY**

# [Title of Security Advisory]

**Date:** [Date]  
**CVE:** [CVE ID]  
**Severity:** [Severity Level]  
**Affected Versions:** [Version range]

## Summary
[Brief description of the vulnerability]

## Vulnerability Details
### Description
[Detailed technical description]

### Impact
[What an attacker could achieve]

### Attack Vector
[How the vulnerability could be exploited]

## Affected Versions
- **Vulnerable:** [List vulnerable versions]
- **Fixed:** [List fixed versions]

## Remediation
### Immediate Actions
1. [Action 1]
2. [Action 2]

### Update Instructions
```bash
npm install -g shai-scanner@[fixed-version]
```

### Workaround
[If applicable]

## Acknowledgments
We thank [Researcher Name] for reporting this vulnerability through our responsible disclosure program.

## References
- [Link to full advisory]
- [Link to commit/patch]
- [Link to test cases]

## Timeline
- **Reported:** [Date]
- **Acknowledged:** [Date]
- **Fix Developed:** [Date]
- **Fix Released:** [Date]
- **Public Disclosure:** [Date]

---
**Shai-Scanner Security Team**
```

**Example Usage:**
```markdown
**SECURITY ADVISORY**

# Remote Code Execution in Advisory Fetcher (CVE-2026-12345)

**Date:** May 9, 2026  
**CVE:** CVE-2026-12345  
**Severity:** Critical (CVSS 9.8)  
**Affected Versions:** v4.0.0 to v4.5.9

## Summary
A remote code execution vulnerability exists in the advisory fetcher component of Shai-Scanner versions 4.0.0 through 4.5.9.

## Vulnerability Details
### Description
The vulnerability allows an attacker to execute arbitrary code by crafting malicious responses from advisory databases.

### Impact
An attacker could gain complete control of systems running affected versions of Shai-Scanner.

### Attack Vector
Network-based attack requiring no authentication.

## Affected Versions
- **Vulnerable:** v4.0.0 to v4.5.9
- **Fixed:** v4.6.0 and later

## Remediation
### Immediate Actions
1. Update to v4.6.0 or later
2. If update is not possible, disable live advisory mode

### Update Instructions
```bash
npm install -g shai-scanner@4.6.0
```

### Workaround
```bash
shai-scanner --mode offline
```

## Acknowledgments
We thank Security Researcher for reporting this vulnerability through our responsible disclosure program.

## References
- [Full Advisory](https://shai-scanner.dev/security/advisories/2026-001)
- [Commit Fix](https://github.com/shai-scanner/shai-scanner/commit/abc123)
- [Test Cases](https://github.com/shai-scanner/shai-scanner/pull/123)

## Timeline
- **Reported:** April 28, 2026
- **Acknowledged:** April 28, 2026
- **Fix Developed:** May 1, 2026
- **Fix Released:** May 2, 2026
- **Public Disclosure:** May 9, 2026

---
**Shai-Scanner Security Team**
```

**Related Documentation:**
- [Security Advisories](../../SECURITY.md)
- [Release Notes](../../CHANGELOG.md)

---

**[← Back to Main Index](../RESPONSE_TEMPLATES.md)**