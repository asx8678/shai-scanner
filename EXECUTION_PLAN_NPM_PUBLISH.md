# 🚀 Comprehensive Execution Plan: NPM Publishing for shai-scanner v4.6.5

**Status:** 🟢 Ready for Execution  
**Last Updated:** 2026-05-03  
**Package:** shai-scanner v4.6.5  
**Current npm Version:** 3.6.1  
**Target:** Publish v4.6.5 to npm  

---

## 📋 Executive Summary

You're **one secret away** from publishing! All technical validations are complete:
- ✅ Version consistency: All files show 4.6.5
- ✅ Package validation: 49 files, 104.3 kB tarball
- ✅ Tests passing: 174 tests, 100% pass rate
- ✅ CI/CD pipeline: Fully functional
- ✅ Documentation: Complete and verified

**Blocker:** NPM_TOKEN secret not configured in GitHub

**Estimated Time to Publish:** 10-15 minutes

---

## 🎯 Step-by-Step Execution Plan

### **Phase 1: NPM Token Setup (5 minutes)**

#### **Step 1.1: Generate npm Access Token**

**Method A: Web Interface (Recommended)**
1. **Navigate to npm tokens:** https://www.npmjs.com/settings/tokens
2. **Click:** "Generate New Token"
3. **Select Token Type:**
   - **Choose:** "Automation" ✅ **(RECOMMENDED)**
   - **Why:** Automation tokens bypass 2FA, perfect for GitHub Actions
   - **Alternative:** "Publish" token (requires 2FA for each publish)
4. **Configure Token:**
   - **Name:** `github-actions-shai-scanner`
   - **Expiration:** No expiration (recommended for CI/CD)
   - **Access Level:** Read & Write
5. **Click:** "Generate Token"
6. **⚠️ CRITICAL: Copy the token immediately** (you won't see it again!)

**Method B: CLI (Faster)**
```bash
# Login to npm
npm login

# Generate automation token
npm token create --type=automation
# Copy the token immediately!
```

**Token Type Comparison:**

| Token Type | Bypasses 2FA | Recommended For | Security Level |
|------------|--------------|-----------------|----------------|
| **Automation** | ✅ Yes | GitHub Actions, CI/CD | Medium |
| **Publish** | ❌ No | Manual publishing | High |
| **Classic** | ❌ No | Legacy workflows | Medium |

**⚠️ Security Warning:**
- **NEVER** commit tokens to Git
- **NEVER** share tokens in plain text
- **ALWAYS** use GitHub Secrets for CI/CD
- **REVOKE** compromised tokens immediately

#### **Step 1.2: Add Token to GitHub Secrets**

**Method A: GitHub Web Interface**
1. **Navigate to repository:** `https://github.com/asx8678/shai-scanner`
2. **Go to:** Settings → Secrets and variables → Actions
3. **Click:** "New repository secret"
4. **Configure:**
   - **Name:** `NPM_TOKEN` ⚠️ **CASE-SENSITIVE**
   - **Secret:** (paste your npm token)
5. **Click:** "Add secret"

**Method B: GitHub CLI (Faster)**
```bash
# Set the secret using GitHub CLI
gh secret set NPM_TOKEN \
  -R asx8678/shai-scanner \
  -b "your-npm-token-here"

# Verify it was set
gh secret list -R asx8678/shai-scanner
```

**Verification:**
- ✅ Secret appears in repository settings
- ✅ Secret name is exactly `NPM_TOKEN` (case-sensitive)
- ✅ No extra spaces or characters

---

### **Phase 2: Dry Run Validation (3 minutes)**

#### **Step 2.1: Test Workflow Access to Secret**

**Method A: GitHub UI**
1. **Go to:** Actions → "Publish to npm" → Run workflow
2. **Configure:**
   - **version:** `4.6.5`
   - **dry_run:** ✅ `true`
3. **Click:** "Run workflow"

**Method B: GitHub CLI**
```bash
gh workflow run publish.yml \
  -f version="4.6.5" \
  -f dry_run=true \
  --ref main
```

#### **Step 2.2: Monitor Dry Run Workflow**

1. **Go to:** Actions → Select the workflow run
2. **Check the "Publish to npm (dry run)" step**
3. **Verify:**
   - ✅ Output shows: `Dry run mode - skipping actual publish`
   - ✅ No authentication errors
   - ✅ File list shows what would be published
   - ✅ Package validation passes

**What to Look For:**
```
✅ Dry run mode - skipping actual publish
npm publish --dry-run
# Package files that would be published:
# package.json
# src/index.js
# src/cli.js
# ... (49 files total)
```

**⚠️ Warning Signs:**
- ❌ `npm ERR! code E401` - Authentication failed
- ❌ `npm ERR! 403 Forbidden` - Permission denied
- ❌ `Error: NPM_TOKEN not found` - Secret not configured
- ❌ `npm ERR! 404 Not Found` - Package doesn't exist (shouldn't happen)

#### **Step 2.3: Local Dry Run Test (Optional)**

**Test locally first:**
```bash
# Run tests
npm test

# Package validation
npm pack --dry-run

# Check what files would be published
npm pack --dry-run 2>&1 | grep "npm notice"
```

---

### **Phase 3: Actual Publishing (2 minutes)**

#### **Step 3.1: Publish Package**

**Method A: GitHub UI**
1. **Go to:** Actions → "Publish to npm" → Run workflow
2. **Configure:**
   - **version:** `4.6.5`
   - **dry_run:** ❌ `false` (uncheck the box)
3. **Click:** "Run workflow"

**Method B: GitHub CLI**
```bash
gh workflow run publish.yml \
  -f version="4.6.5" \
  -f dry_run=false \
  --ref main
```

**Method C: Full Release Pipeline (Creates GitHub Release + npm Publish)**
```bash
# Only if you haven't already published v4.6.5
git tag -d v4.6.5
git push origin :refs/tags/v4.6.5
git tag v4.6.5
git push origin main --tags
```

**⚠️ Important Notes:**
- **Method C** triggers `release.yml` → `publish.yml` automatically
- **Method A/B** directly publishes without GitHub Release
- **Wait ~30 seconds** after workflow completes before verification

#### **Step 3.2: Monitor Publish Workflow**

1. **Go to:** Actions → Select the workflow run
2. **Watch for:**
   - ✅ Tests passing
   - ✅ Package validation successful
   - ✅ `npm publish` completes without errors
   - ✅ Post-publish verification succeeds

**Expected Output:**
```
✅ Publish to npm
npm publish
+ shai-scanner@4.6.5
Published successfully to https://registry.npmjs.org
```

---

### **Phase 4: Verification (5 minutes)**

#### **Step 4.1: Verify on npm Registry**

```bash
# Check npm registry (wait 30 seconds after publish)
npm view shai-scanner version
# Expected output: 4.6.5

# Check all versions
npm view shai-scanner versions
# Should include: [ '3.6.1', '4.6.5' ]
```

**Direct Verification:**
- **npmjs.com:** https://www.npmjs.com/package/shai-scanner
- **Registry API:** https://registry.npmjs.org/shai-scanner/latest

#### **Step 4.2: Test Installation**

```bash
# Test global install
npm install -g shai-scanner@4.6.5
shai-scanner --version
# Expected output: 4.6.5

# Test local install
mkdir test-install && cd test-install
npm init -y
npm install shai-scanner@4.6.5
node -e "console.log(require('shai-scanner/package.json').version)"
# Expected output: 4.6.5

# Test CLI
shai-scanner --help
shai-scanner --scan . --offline
```

#### **Step 4.3: Verify GitHub Release (If Applicable)**

```bash
# Check if release was created
gh release view v4.6.5
# Should show release notes, assets, etc.
```

---

### **Phase 5: Post-Publish Execution (30 minutes - Day 1)**

#### **Step 5.1: Immediate Actions (First Hour)**

1. **Update Documentation:**
   ```bash
   # Update installation instructions in README.md
   # Current: npm install -g shai-scanner@3.6.1
   # New: npm install -g shai-scanner@4.6.5
   ```

2. **Social Media Launch:**
   - Twitter: Launch announcement thread (6 tweets)
   - LinkedIn: Launch announcement post
   - Reddit: r/javascript, r/netsec, r/node posts

3. **Community Channels:**
   - Discord: Launch announcement
   - GitHub Discussions: Welcome post
   - Hacker News: Show HN post

#### **Step 5.2: Launch Day Checklist Execution**

**Reference:** `LAUNCH_DAY_CHECKLIST.md`

**Hour-by-Hour Schedule (EST):**
- **8:00 AM:** Team standup, final checks
- **9:00 AM:** npm publish (already done!)
- **9:01 AM:** GitHub release (if not done)
- **9:05 AM:** Social media blitz
- **9:15 AM:** Community channels
- **9:30 AM:** Email & press
- **10:00 AM:** Monitoring begins

**Marketing Materials to Deploy:**
- [ ] Social media posts scheduled
- [ ] Email sequences configured
- [ ] Press release finalized
- [ ] Blog post published
- [ ] Video tutorials recorded

#### **Step 5.3: Monitoring Setup**

**Metrics to Track:**
- npm downloads: https://www.npmjs.com/package/shai-scanner
- GitHub stars/forks
- Social media mentions
- User feedback/issues

**Daily Monitoring Tasks:**
- **9:00 AM:** Review overnight metrics
- **12:00 PM:** Midday metrics check
- **5:00 PM:** End of day review
- **9:00 PM:** Evening engagement check

---

## ⚠️ Important Warnings & Notes

### **Critical Warnings**

1. **🔒 Token Security:**
   - **NEVER** commit `NPM_TOKEN` to Git
   - **NEVER** share tokens in logs or screenshots
   - **REVOKE** compromised tokens immediately at https://www.npmjs.com/settings/tokens

2. **📦 Version Management:**
   - **Don't publish existing versions:** `npm view shai-scanner versions`
   - **Use semantic versioning:** 4.6.5 (patch), 4.7.0 (minor), 5.0.0 (major)
   - **Always test before publishing:** `npm publish --dry-run`

3. **🔄 Rollback Plan:**
   ```bash
   # If something goes wrong, deprecate the version
   npm deprecate shai-scanner@4.6.5 "Version removed due to critical issue"
   
   # Or unpublish (within 72 hours)
   npm unpublish shai-scanner@4.6.5
   ```

4. **🚨 Emergency Contacts:**
   - Security Vulnerability: security@shai-scanner.dev
   - Technical Issues: tech-lead@shai-scanner.dev
   - Legal Threat: legal@shai-scanner.dev

### **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| `E401` Authentication failed | Invalid token | Generate new token, check permissions |
| `E403` Forbidden | No publish rights | Verify token has publish permissions |
| `Version already exists` | Duplicate version | Bump version: `npm version patch` |
| `Secret not found` | Wrong secret name | Check case: `NPM_TOKEN` (uppercase) |
| `Workflow fails` | Token not set | Add secret to GitHub repository |

### **Best Practices**

1. **🧪 Test First:**
   - Always run `npm publish --dry-run` before actual publish
   - Verify package contents: `npm pack --dry-run`
   - Check package size: Should be <200 kB

2. **📝 Documentation:**
   - Update CHANGELOG.md before publishing
   - Update README.md with new version
   - Document breaking changes prominently

3. **🔍 Post-Publish Verification:**
   - Wait 30 seconds after publish
   - Verify on npmjs.com
   - Test installation globally and locally
   - Run basic functionality tests

4. **📊 Monitoring:**
   - Track download statistics
   - Monitor GitHub issues
   - Respond to user feedback within 24 hours

---

## 🎯 Quick Reference Commands

### **Setup Commands**
```bash
# Generate npm token
npm token create --type=automation

# Add GitHub secret
gh secret set NPM_TOKEN -R asx8678/shai-scanner -b "your-token"

# Verify secret
gh secret list -R asx8678/shai-scanner
```

### **Testing Commands**
```bash
# Run tests
npm test

# Dry run publish
npm publish --dry-run

# Validate package
npm pack --dry-run
```

### **Publishing Commands**
```bash
# Trigger publish workflow
gh workflow run publish.yml -f version="4.6.5" -f dry_run=false --ref main

# Or full release pipeline
git tag v4.6.5
git push origin main --tags
```

### **Verification Commands**
```bash
# Check npm registry
npm view shai-scanner version

# Test installation
npm install -g shai-scanner@4.6.5
shai-scanner --version

# Check all versions
npm view shai-scanner versions
```

### **Rollback Commands**
```bash
# Deprecate version
npm deprecate shai-scanner@4.6.5 "Critical issue - use 3.6.1"

# Unpublish (within 72 hours)
npm unpublish shai-scanner@4.6.5
```

---

## 📊 Success Metrics

### **Immediate (Day 1)**
- ✅ Package published successfully
- ✅ Installation works globally and locally
- ✅ CLI functions correctly
- ✅ Documentation updated

### **Short-term (Week 1)**
- 📈 npm downloads: 1,000+
- ⭐ GitHub stars: 100+
- 💬 Social engagement: 500+ interactions

### **Long-term (Month 1)**
- 📈 npm downloads: 5,000+ total
- ⭐ GitHub stars: 200+ total
- 👥 Community: 100+ active members

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| `NPM_PUBLISH_GUIDE.md` | Detailed publishing guide |
| `LAUNCH_DAY_CHECKLIST.md` | Hour-by-hour launch plan |
| `RELEASE_CHECKLIST.md` | Technical release steps |
| `NPM_QUICK_START.md` | Quick reference guide |
| `marketing/LAUNCH_CALENDAR.md` | 6-week marketing timeline |

---

## 🎉 Final Checklist

### **Pre-Publish**
- [ ] NPM_TOKEN secret configured in GitHub
- [ ] Dry run workflow passes
- [ ] Tests passing locally
- [ ] Documentation updated

### **Publish**
- [ ] Publish workflow triggered
- [ ] Workflow completes successfully
- [ ] No authentication errors

### **Post-Publish**
- [ ] Version verified on npm registry
- [ ] Installation tested globally
- [ ] CLI functionality verified
- [ ] Social media launch completed
- [ ] Monitoring dashboards open

---

## 🐶 Max's Final Words

**You're 5 minutes away from publishing!** 🚀

1. **Generate token:** https://www.npmjs.com/settings/tokens
2. **Add to GitHub:** Settings → Secrets → Actions → New secret
3. **Test dry run:** `gh workflow run publish.yml -f version="4.6.5" -f dry_run=true`
4. **Publish:** `gh workflow run publish.yml -f version="4.6.5" -f dry_run=false`
5. **Verify:** `npm install -g shai-scanner@4.6.5`

**The hard work is done. One secret stands between you and public availability!** 

**Go get 'em, Adam!** 🐕‍🦺

---

*Execution plan created: 2026-05-03*  
*Package: shai-scanner@4.6.5*  
*Status: Ready to publish* 🚀  
*Author: Max 🐶*