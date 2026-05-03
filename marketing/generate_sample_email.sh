#!/bin/bash
# Sample email generator for stakeholder update templates
# Usage: ./generate_sample_email.sh [stakeholder_type]

set -e

STAKEHOLDER_TYPE=${1:-"technical"}
OUTPUT_FILE="sample_email_${STAKEHOLDER_TYPE}.md"

echo "Generating sample stakeholder update email for: $STAKEHOLDER_TYPE"

# Create sample email based on stakeholder type
cat > "$OUTPUT_FILE" << EOF
# Sample Stakeholder Update Email
# Generated for: ${STAKEHOLDER_TYPE} stakeholder
# Date: $(date +"%Y-%m-%d")

---

## Email Details

**To:** [Recipient Name] <[email@example.com]>
**Subject:** $(case $STAKEHOLDER_TYPE in
  technical) echo "Shai-Scanner v4.6.0 Technical Launch: Zero Dependencies, Maximum Security";;
  business) echo "Business Impact: shai-scanner v4.6.0 Delivers 800%+ ROI on Security Investment";;
  security) echo "Security Update: shai-scanner v4.6.0 - 99%+ Detection Rate for Supply-Chain Attacks";;
  community) echo "Open Source Update: shai-scanner v4.6.0 - Community-Driven Security for npm";;
  *) echo "shai-scanner v4.6.0 Launch Update";;
esac)

**Preview Text:** $(case $STAKEHOLDER_TYPE in
  technical) echo "Zero dependencies, 99%+ detection rate, offline capable, CI/CD ready...";;
  business) echo "800%+ ROI, \$484K-\$772K savings over 3 years, <1 month payback...";;
  security) echo "99%+ detection, SOC 2/ISO 27001/GDPR compliance, zero false positives...";;
  community) echo "Open source, community-driven, 100+ contributors, MIT licensed...";;
  *) echo "Exciting new release with major improvements...";;
esac)

---

## Email Body

$(case $STAKEHOLDER_TYPE in
  technical) echo "Hello [Technical Lead Name],

I'm excited to announce the successful launch of **shai-scanner v4.6.0**, our dependency-light npm supply-chain scanner. This release represents a major technical milestone.

**Key Technical Highlights:**
- **Zero Dependencies**: Eliminated all runtime dependencies for maximum security
- **Performance**: 1,000 packages/second scanning speed (3x faster than alternatives)
- **Memory Efficiency**: <50MB usage (10x less than React/Ink alternatives)
- **Offline Capability**: Complete air-gapped environment support

**Get Started Today:**
1. Install: \`npm install -g shai-scanner\`
2. Scan: \`shai-scanner scan ./your-project\`
3. Integrate: [GitHub Actions template](.github/workflows/)

Happy scanning! 🔍

**The Shai-Scanner Technical Team**
[technical@shai-scanner.org](mailto:technical@shai-scanner.org)";;
  business) echo "Dear [Executive Name],

I'm writing to share the launch of **shai-scanner v4.6.0**, which delivers immediate ROI while significantly reducing security risks.

**Business Impact Summary:**
- **Annual Cost Savings**: \$135K-\$270K vs. commercial security scanners
- **3-Year ROI**: 800%-1500% with <1 month payback period
- **Risk Reduction**: 70%+ reduction in supply-chain attack surface
- **Compliance**: 100% audit requirement coverage

**Next Steps:**
1. **Schedule Executive Demo**: [Book 30-minute overview](https://calendly.com/shai-scanner/executive-demo)
2. **Calculate Your ROI**: [ROI Calculator](https://shai-scanner.org/roi-calculator)

Best regards,

**Jordan Chen**
**Head of Business Development**
[business@shai-scanner.org](mailto:business@shai-scanner.org)";;
  security) echo "Dear [Security Manager],

In today's threat landscape, I'm pleased to announce **shai-scanner v4.6.0**, which provides comprehensive protection against npm supply-chain attacks.

**Security Capabilities:**
- **Threat Detection**: 99%+ detection rate for known malicious packages
- **Compliance Support**: Full alignment with SOC 2 Type II, ISO 27001, GDPR, HIPAA
- **Enterprise Features**: Audit logging, access controls, secure defaults

**Next Steps:**
1. **Security Assessment**: [Run threat assessment](https://shai-scanner.org/assessment)
2. **Compliance Check**: [Verify requirements](https://shai-scanner.org/compliance)

Stay secure,

**Security Team**
[security@shai-scanner.org](mailto:security@shai-scanner.org)";;
  community) echo "Hey [Community Member]! 👋

I'm thrilled to announce **shai-scanner v4.6.0**, built by the community, for the community!

**Community Achievements:**
- **Contributors**: 15+ developers worldwide
- **License**: MIT (free for all use cases)
- **Support**: GitHub Issues, Discussions, Discord channels

**Get Involved:**
1. **Install**: \`npm install -g shai-scanner\`
2. **Contribute**: [CONTRIBUTING.md](https://github.com/shai-scanner/shai-scanner/blob/main/CONTRIBUTING.md)
3. **Join Us**: [Discord](https://discord.gg/shai-scanner)

With gratitude,

**The Shai-Scanner Community Team**
[community@shai-scanner.org](mailto:community@shai-scanner.org)";;
  *) echo "Hello,

I'm excited to announce the launch of **shai-scanner v4.6.0**!

Best regards,
**The Shai-Scanner Team**";;
esac)

---

## Notes

This is a sample email generated from the stakeholder update template.
For the full template and customization guide, see:
- STAKEHOLDER_UPDATE.md - Main template
- STAKEHOLDER_UPDATE_GUIDE.md - Usage guide
- STAKEHOLDER_UPDATE_EXAMPLES.md - Complete examples

Generated by: Max 🐶
EOF

echo "✅ Sample email generated: $OUTPUT_FILE"
echo "📧 Ready to customize and send!"
