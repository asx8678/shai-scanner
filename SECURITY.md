# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 4.6.x   | :white_check_mark: |
| 4.5.x   | :white_check_mark: |
| < 4.5   | :x:                |

Only the latest patch release in each minor version line receives security updates. We recommend always using the most recent release.

## Reporting a Vulnerability

The Shai-Scanner team takes security bugs seriously. We appreciate your efforts to responsibly disclose any issues you find.

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities.
2. Send an email to **security@shai-scanner.dev** (or use the GitHub Security Advisory feature).
3. Include the following details in your report:
   - Description of the vulnerability
   - Steps to reproduce (proof-of-concept code if possible)
   - Potential impact assessment
   - Suggested fix (if you have one)

### What to Include

When reporting a vulnerability, please provide:

- **Package name and version**: `@shai-scanner/core@4.6.5`
- **Lockfile snippet or package path**: The affected file or configuration
- **Scanner command and output**: How you discovered the issue
- **Network configuration**: Whether `--online` mode was used
- **Environment details**: Node.js version, OS, and any relevant environment variables

**Do NOT include:**
- Live credentials, tokens, or private keys
- Private repository dumps or source code
- Secret-scanner output containing sensitive findings
- Production data or personally identifiable information

## Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial triage | Within 5 business days |
| Status update | Within 10 business days |
| Resolution target | Within 30 days for critical/high severity |

We will keep you informed throughout the process and work with you to understand and address the issue before any public disclosure.

## Scope

### In Scope

The following are considered valid security vulnerabilities:

- **Command injection**: Any possibility of executing arbitrary commands via scanner arguments or configuration
- **Path traversal**: Unauthorized file access outside the project directory
- **Dependency confusion**: Scanner succumbing to dependency confusion attacks
- **Data exfiltration**: Unintended data leakage through scanner outputs or network requests
- **Authentication bypass**: Circumventing access controls in server mode (`--server`)
- **Denial of Service**: Resource exhaustion vulnerabilities (memory, CPU, disk)
- **Supply chain attacks**: Vulnerabilities in the scanner's own dependencies that affect scan accuracy
- **Information disclosure**: Leaking sensitive information through error messages or logs

### Out of Scope

The following are not considered security vulnerabilities:

- **False positives/negatives**: Scanner incorrectly identifying or missing threats (report as bugs instead)
- **Performance issues**: Slow scanning speed (unless it enables DoS)
- **Feature requests**: New security features or detection capabilities
- **Third-party integrations**: Issues in external services the scanner connects to
- **User configuration errors**: Security issues resulting from incorrect user configuration
- **Known CVEs in dependencies**: We track these separately; report only if they affect scanner operation

## Severity Classification

We use the following severity levels to classify vulnerabilities:

### Critical (CVSS 9.0-10.0)
- Remote code execution
- Authentication bypass
- Data exfiltration of sensitive information
- Complete system compromise
- **Response**: Immediate patch, hotfix if needed

### High (CVSS 7.0-8.9)
- Significant privilege escalation
- Local file access outside scope
- Denial of service affecting production systems
- **Response**: Patch within 7 days

### Medium (CVSS 4.0-6.9)
- Limited information disclosure
- Non-critical path traversal
- Resource exhaustion with mitigation
- **Response**: Patch within 30 days

### Low (CVSS 0.1-3.9)
- Minor information leakage
- Theoretical attack vectors
- Issues requiring unlikely user interaction
- **Response**: Patch in next scheduled release

## Disclosure Policy

### Coordinated Disclosure

We follow a coordinated disclosure process:

1. **Report received**: We acknowledge receipt within 48 hours
2. **Validation**: We validate the vulnerability within 5 business days
3. **Fix development**: We develop a fix based on severity
4. **Testing**: We test the fix thoroughly
5. **Release**: We release the patched version
6. **Disclosure**: We publish a security advisory after users have had time to update

### Public Disclosure Timeline

- **Critical**: 7 days after fix release
- **High**: 14 days after fix release
- **Medium**: 30 days after fix release
- **Low**: 60 days after fix release

### Credit

We will credit reporters in our security advisories unless they prefer to remain anonymous. We also have a bug bounty program with rewards based on severity (contact us for details).

## Security-Related Configuration Options

The scanner provides several security-focused configuration options:

### Network Security
```bash
# Disable automatic updates (offline mode)
shai-scanner --offline --no-auto-update

# Use proxy for network requests
shai-scanner --proxy http://proxy:8080

# Certificate pinning for IOC downloads
shai-scanner --certificate-pin --certificate-path /path/to/ca.pem
```

### File System Security
```bash
# Scan only lockfiles (no source code access)
shai-scanner --lockfiles-only

# Restrict to specific directories
shai-scanner --project-root /safe/path

# Disable file system writes
shai-scanner --read-only --output /dev/null
```

### Execution Security
```bash
# Skip lifecycle scripts (npm, yarn, pnpm)
shai-scanner --ignore-scripts

# Disable network during dependency resolution
shai-scanner --offline

# Run with minimal permissions
shai-scanner --sandbox --no-filesystem-access
```

### Server Security (when using --server mode)
```bash
# Enable HTTPS with certificate
shai-scanner --server --https --cert /path/to/cert.pem --key /path/to/key.pem

# Restrict listening interface
shai-scanner --server --host 127.0.0.1

# Enable authentication
shai-scanner --server --auth-token YOUR_SECRET_TOKEN

# Rate limiting
shai-scanner --server --rate-limit 100 --rate-window 60
```

## Known Security Considerations

### Network Dependencies
- The scanner fetches IOC (Indicators of Compromise) data over HTTPS from a fixed allowlist of URLs
- All network requests use TLS 1.2+ with certificate verification
- Network activity can be monitored and logged via `--verbose` flag
- **Mitigation**: Use `--offline` mode for air-gapped environments

### File System Access
- The scanner reads local project files (package.json, lockfiles, etc.)
- It does NOT execute package lifecycle scripts
- It does NOT import scanned packages
- It does NOT upload scan results (unless explicitly configured)
- **Mitigation**: Use `--lockfiles-only` and `--read-only` flags

### Data Processing
- Scan results are processed locally by default
- No data is sent to external services unless using cloud reporting features
- Audit logs are stored locally and can be encrypted
- **Mitigation**: Use `--local-only` mode and enable audit log encryption

### Dependency Risks
- The scanner's own dependencies are audited regularly
- We use lockfiles to prevent dependency confusion
- We perform reproducible builds
- **Mitigation**: Always verify package integrity with checksums

### Server Mode Risks
- When running in server mode (`--server`), ensure proper network segmentation
- Use authentication and HTTPS in production
- Monitor for unusual access patterns
- **Mitigation**: Deploy behind a reverse proxy with additional security controls

## Security Updates

Security updates are released as patch versions (e.g., 4.6.5 → 4.6.6). We recommend:

1. **Subscribe to security advisories** on GitHub
2. **Enable Dependabot** or similar tools for automated updates
3. **Test updates** in a staging environment before production
4. **Review changelogs** for security-related changes

## Contact

For security-related inquiries:
- **Email**: security@shai-scanner.dev
- **GitHub**: [Security Advisories](https://github.com/shai-scanner/shai-scanner/security/advisories)
- **PGP Key**: Available on our website for encrypted communication

## Legal

This security policy is effective as of January 1, 2024 and was last updated on May 3, 2026.

We reserve the right to modify this policy at any time. The latest version will always be available in our repository.

---

*Thank you for helping keep Shai-Scanner and its users secure!*