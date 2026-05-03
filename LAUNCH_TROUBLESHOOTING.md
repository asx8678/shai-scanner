# 🚨 LAUNCH TROUBLESHOOTING: shai-scanner v4.6.5

**Status:** 🟡 Reference Guide  
**Purpose:** Quick fixes for common launch issues  
**Last Updated:** 2026-05-03  

---

## 🔧 Common Issues & Solutions

### **Issue 1: NPM_TOKEN Not Working**

**Symptoms:**
- `E401 Unauthorized` error
- `E403 Forbidden` error
- `NPM_TOKEN not found` error
- Workflow fails at "Publish to npm" step

**Diagnosis:**
```bash
# Check if token is set in GitHub
gh secret list -R asx8678/shai-scanner | grep NPM_TOKEN

# Check token locally (DON'T commit this!)
npm set //registry.npmjs.org/:_authToken=your-token-here
npm whoami
```

**Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `E401 Unauthorized` | Token invalid or expired | Regenerate token at npmjs.com |
| `E403 Forbidden` | Wrong token type | Use "Automation" token type |
| `No secret found` | Secret name wrong | Check case: `NPM_TOKEN` (uppercase) |
| `Token expired` | Token has expiration | Regenerate with "No expiration" |

**Step-by-step fix:**
1. **Regenerate token:**
   ```bash
   open https://www.npmjs.com/settings/tokens
   # Delete old token, generate new "Automation" token
   ```

2. **Update GitHub secret:**
   ```bash
   gh secret set NPM_TOKEN -R asx8678/shai-scanner -b "new-token-here"
   ```

3. **Test with dry run:**
   ```bash
   gh workflow run publish.yml -f version="4.6.5" -f dry_run=true --ref main
   ```

---

### **Issue 2: Version Already Exists**

**Symptoms:**
- `npm ERR! 403 You cannot publish over the previously published versions` 
- Version already appears on npm registry

**Diagnosis:**
```bash
# Check current npm versions
npm view shai-scanner versions

# Check local version
node -p "require('./package.json').version"
```

**Solutions:**

| Scenario | Solution |
|----------|----------|
| Version exists, need to republish | Bump version: `npm version patch` |
| Version exists, want to overwrite | Deprecate first: `npm deprecate shai-scanner@4.6.5` |
| Wrong version published | Unpublish (within 72h): `npm unpublish shai-scanner@4.6.5` |

**Step-by-step fix:**
1. **Bump version:**
   ```bash
   npm version patch  # Creates 4.6.6
   ```

2. **Update package.json:**
   ```bash
   # Verify version updated
   node -p "require('./package.json').version"
   ```

3. **Push changes:**
   ```bash
   git add .
   git commit -m "Bump version to 4.6.6"
   git push origin main
   ```

4. **Publish new version:**
   ```bash
   gh workflow run publish.yml -f version="4.6.6" -f dry_run=false --ref main
   ```

---

### **Issue 3: GitHub Actions Workflow Fails**

**Symptoms:**
- Workflow shows red ❌
- Step fails with specific error
- Workflow doesn't trigger at all

**Diagnosis:**
```bash
# Check workflow runs
gh run list --repo asx8678/shai-scanner

# View specific run logs
gh run view <run-id> --repo asx8678/shai-scanner --log

# Check workflow file
cat .github/workflows/publish.yml
```

**Common Workflow Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Workflow not found` | File not in correct location | Check `.github/workflows/publish.yml` exists |
| `Permission denied` | Workflow permissions | Add `permissions: contents: write` |
| `Secret not available` | Secret name wrong | Check secret is named `NPM_TOKEN` |
| `Node.js version` | Wrong Node version | Update `node-version: '20'` |
| `Test failure` | Code broken | Fix tests before publishing |

**Step-by-step fix:**
1. **Check workflow permissions:**
   ```yaml
   permissions:
     contents: read
     id-token: write
   ```

2. **Verify secret access:**
   ```bash
   # Secret should be in correct repository
   gh secret list -R asx8678/shai-scanner
   ```

3. **Test locally first:**
   ```bash
   npm test
   npm pack --dry-run
   ```

---

### **Issue 4: Package Installation Fails**

**Symptoms:**
- `npm install -g shai-scanner@4.6.5` fails
- `Module not found` errors
- `Permission denied` errors

**Diagnosis:**
```bash
# Check npm version
npm --version

# Check Node version
node --version

# Check npm cache
npm cache ls shai-scanner

# Check global npm directory
npm config get prefix
```

**Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Node.js version` | Requires Node ≥ 18 | Update Node.js |
| `Module not found` | Cache issue | Clear cache: `npm cache clean --force` |
| `Permission denied` | npm permissions | Use `sudo` or fix permissions |
| `404 Not Found` | Package not published | Wait for npm to update (30-60 seconds) |

**Step-by-step fix:**
1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Fix permissions (Linux/Mac):**
   ```bash
   sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
   ```

3. **Wait for npm to update:**
   ```bash
   # Wait 30-60 seconds after publish
   sleep 60
   npm view shai-scanner version
   ```

4. **Try installation again:**
   ```bash
   npm install -g shai-scanner@4.6.5
   ```

---

### **Issue 5: CLI Not Working**

**Symptoms:**
- `shai-scanner: command not found`
- `shai-scanner --version` shows wrong version
- CLI crashes or throws errors

**Diagnosis:**
```bash
# Check if installed
which shai-scanner

# Check installed version
shai-scanner --version

# Check PATH
echo $PATH | grep -o "$(npm config get prefix)/bin"

# Check npm global bin
ls -la $(npm config get prefix)/bin | grep shai
```

**Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `command not found` | Not installed | `npm install -g shai-scanner@4.6.5` |
| Wrong version | Cached binary | Clear npm cache, reinstall |
| `Permission denied` | Global install permissions | Use `sudo` or fix permissions |
| CLI crashes | Missing dependencies | Check package.json dependencies |

**Step-by-step fix:**
1. **Uninstall and reinstall:**
   ```bash
   npm uninstall -g shai-scanner
   npm install -g shai-scanner@4.6.5
   ```

2. **Check PATH:**
   ```bash
   # Add npm global bin to PATH if needed
   export PATH="$(npm config get prefix)/bin:$PATH"
   ```

3. **Test CLI:**
   ```bash
   shai-scanner --version
   shai-scanner --help
   ```

---

### **Issue 6: GitHub Release Not Created**

**Symptoms:**
- No release appears on GitHub
- Release workflow fails
- Assets not uploaded

**Diagnosis:**
```bash
# Check releases
gh release list --repo asx8678/shai-scanner

# Check tags
git tag -l

# Check workflow runs
gh run list --repo asx8678/shai-scanner
```

**Solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| No release | Tag not created | Create tag: `git tag v4.6.5` |
| Workflow fails | Permissions | Add `contents: write` permission |
| Assets missing | Build step failed | Check release workflow logs |
| Release empty | No changes | Add release notes manually |

**Step-by-step fix:**
1. **Create tag manually:**
   ```bash
   git tag -a v4.6.5 -m "Release v4.6.5"
   git push origin v4.6.5
   ```

2. **Create release manually:**
   ```bash
   gh release create v4.6.5 \
     --title "v4.6.5" \
     --notes "Release v4.6.5" \
     shai-scanner-*.tgz
   ```

3. **Check release workflow:**
   ```bash
   cat .github/workflows/release.yml
   ```

---

## 🚨 Emergency Procedures

### **Critical Issue Found Post-Publish**

**Immediate Actions:**
1. **Deprecate version (5 minutes):**
   ```bash
   npm deprecate shai-scanner@4.6.5 "Critical security issue - use 3.6.1"
   ```

2. **Unpublish if within 72 hours (10 minutes):**
   ```bash
   npm unpublish shai-scanner@4.6.5
   ```

3. **Communicate with users:**
   ```bash
   # Update README
   echo "⚠️ v4.6.5 has been deprecated. Please use v3.6.1 or wait for v4.6.6" >> README.md
   
   # Create GitHub issue
   gh issue create --title "URGENT: v4.6.5 Deprecated" --body "Critical issue found..."
   ```

4. **Emergency patch (30 minutes):**
   ```bash
   # Fix the issue
   git add .
   git commit -m "Fix critical issue"
   
   # Bump version
   npm version patch  # 4.6.6
   
   # Push and publish
   git push origin main --tags
   ```

### **Security Vulnerability Found**

**Immediate Actions:**
1. **Contact security team:** security@shai-scanner.dev
2. **Deprecate current version**
3. **Create security advisory on GitHub**
4. **Prepare emergency patch**
5. **Notify users via email/social media**

---

## 📞 Support Contacts

### **npm Support**
- **Website:** https://npmjs.com/support
- **Email:** support@npmjs.com
- **Response Time:** 24-48 hours

### **GitHub Support**
- **Website:** https://support.github.com
- **Email:** support@github.com
- **Response Time:** 24-48 hours

### **Project Support**
- **Issues:** https://github.com/asx8678/shai-scanner/issues
- **Email:** tech-lead@shai-scanner.dev
- **Response Time:** 24 hours

### **Emergency Contacts**
- **Security Vulnerability:** security@shai-scanner.dev
- **Legal Threat:** legal@shai-scanner.dev
- **PR Crisis:** pr-crisis@shai-scanner.dev

---

## 📋 Quick Reference Commands

### **Token Management**
```bash
# Generate new token
npm token create --type=automation

# Check token
npm whoami

# Set token locally (DON'T commit!)
npm set //registry.npmjs.org/:_authToken=your-token
```

### **Version Management**
```bash
# Check current version
node -p "require('./package.json').version"

# Bump version
npm version patch  # 4.6.5 → 4.6.6
npm version minor  # 4.6.5 → 4.7.0
npm version major  # 4.6.5 → 5.0.0

# Check npm versions
npm view shai-scanner versions
```

### **Publishing**
```bash
# Dry run
npm publish --dry-run

# Publish
npm publish

# Deprecate
npm deprecate shai-scanner@4.6.5 "Reason"

# Unpublish (within 72h)
npm unpublish shai-scanner@4.6.5
```

### **Verification**
```bash
# Check package
npm view shai-scanner

# Test installation
npm install -g shai-scanner@4.6.5
shai-scanner --version

# Run verification script
./scripts/verify-npm-publish.sh 4.6.5
```

---

## 🎯 Success Checklist

### **Publishing Success**
- [ ] NPM_TOKEN configured correctly
- [ ] Dry run passes
- [ ] Publish workflow completes
- [ ] Package appears on npm registry
- [ ] Installation works globally
- [ ] CLI functions correctly

### **Launch Success**
- [ ] GitHub Release created
- [ ] Documentation updated
- [ ] Marketing materials deployed
- [ ] Community notified
- [ ] Monitoring active

### **Post-Launch Success**
- [ ] Metrics tracking active
- [ ] User feedback monitored
- [ ] Issues triaged within 24 hours
- [ ] Next version planned

---

*Troubleshooting guide created: 2026-05-03*  
*Package: shai-scanner@4.6.5*  
*Purpose: Quick reference for common issues*  
*Author: Max 🐶*