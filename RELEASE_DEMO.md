# Release Process Demo

**Project:** shai-scanner v4.6.0  
**Date:** 2026-05-02  
**Status:** Ready for Release  

## 🎬 Demo: How to Release shai-scanner

### Step 1: Version Bump (Dry Run)
```bash
./scripts/bump-version.sh patch --dry-run
```

**Expected Output:**
```
Current version: 4.6.0
New version: 4.6.1
=== DRY RUN MODE ===
Would update:
  - package.json: 4.6.0 → 4.6.1
  - src/cli.js: 4.6.0 → 4.6.1
  ... (other files)
Would create:
  - Git tag: v4.6.1
  - Git commit: 'chore: bump version to 4.6.1'
Dry run completed. No changes made.
```

### Step 2: Version Bump (Actual)
```bash
./scripts/bump-version.sh patch
```

**Expected Output:**
```
Current version: 4.6.0
New version: 4.6.1
Updating package.json...
Updating version in other files...
Running tests to verify changes...
Tests passed!
Creating git commit...
Creating git tag...
✅ Version bumped successfully!
New version: 4.6.1
Git tag: v4.6.1
```

### Step 3: Full Release (Dry Run)
```bash
./scripts/release.sh patch --dry-run
```

**Expected Output:**
```
=== DRY RUN MODE ===
Would perform:
  1. Run tests (unless --skip-tests)
  2. Bump version (patch)
  3. Create git commit
  4. Create git tag
  5. Push to GitHub
  6. Create GitHub release
  7. Publish to npm
Dry run completed. No changes made.
```

### Step 4: Full Release (Actual)
```bash
./scripts/release.sh patch
```

**Expected Output:**
```
Step 1: Running tests...
✅ Tests passed!
Step 2: Bumping version...
✅ Version bumped to 4.6.1
Step 3: Pushing to GitHub...
Step 4: Waiting for GitHub to process...
Step 5: Creating GitHub release...
Step 6: Monitoring release status...
🎉 Release initiated successfully!
Release Details:
  - Version: 4.6.1
  - Git tag: v4.6.1
  - GitHub Release: https://github.com/.../releases/tag/v4.6.1
  - npm package: https://www.npmjs.com/package/shai-scanner/v/4.6.1
```

## 🔄 What Happens After Release

### Automatic Triggers
1. **Git tag push** → Triggers GitHub Release workflow
2. **GitHub Release created** → Triggers npm publish workflow
3. **npm publish** → Package available on npmjs.com

### Manual Verification
1. **Check GitHub Release:**
   ```bash
   # Visit: https://github.com/.../releases
   ```

2. **Check npm package:**
   ```bash
   npm view shai-scanner version
   # Should show: 4.6.1
   ```

3. **Test installation:**
   ```bash
   npm install -g shai-scanner@4.6.1
   shai-scanner --version
   # Should show: 4.6.1
   ```

## 📋 Release Checklist

### Before Release
- [ ] All tests passing
- [ ] No uncommitted changes
- [ ] Version bump planned
- [ ] Release notes ready

### During Release
- [ ] Version bumped successfully
- [ ] Git tag created
- [ ] Changes pushed to GitHub
- [ ] GitHub Release created
- [ ] npm package published

### After Release
- [ ] GitHub Release verified
- [ ] npm package verified
- [ ] Installation tested
- [ ] Release notes accurate
- [ ] Stakeholders notified

## 🎯 Quick Commands Reference

### Version Management
```bash
# Check current version
node -p "require('./package.json').version"

# Bump version (dry run)
./scripts/bump-version.sh patch --dry-run

# Bump version (actual)
./scripts/bump-version.sh patch

# Full release (dry run)
./scripts/release.sh patch --dry-run

# Full release (actual)
./scripts/release.sh patch
```

### Package Management
```bash
# Test package creation
npm pack --dry-run

# Create package
npm pack

# Install from file
npm install ./shai-scanner-4.6.1.tgz

# Publish to npm (requires auth)
npm publish
```

### GitHub Management
```bash
# List tags
git tag -l

# Push tags
git push origin main --tags

# Delete tag (if needed)
git tag -d v4.6.1
git push origin :refs/tags/v4.6.1
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Tests Fail During Release
**Solution:**
```bash
# Check what failed
npm test

# Fix the issue, then retry
./scripts/release.sh patch
```

#### 2. Version Already Exists
**Solution:**
```bash
# Check npm for existing version
npm view shai-scanner versions

# Use next version
./scripts/bump-version.sh minor
```

#### 3. GitHub Actions Not Triggered
**Solution:**
```bash
# Check if tag was pushed
git tag -l

# Push tags manually
git push origin main --tags

# Or trigger workflow manually from GitHub UI
```

#### 4. npm Publish Failed
**Solution:**
```bash
# Check npm authentication
npm whoami

# Check package version
npm view shai-scanner version

# Try dry run
npm publish --dry-run
```

## 📊 Release Metrics

### What to Track
- **npm downloads** (24h, 7d, 30d)
- **GitHub stars** and forks
- **Issue creation rate**
- **Community engagement**

### Where to Track
- **npm:** https://www.npmjs.com/package/shai-scanner
- **GitHub:** Repository Insights
- **Analytics:** GitHub Actions metrics

## 🎉 Success Indicators

### Technical Success
- ✅ Tests pass before release
- ✅ Version bump successful
- ✅ GitHub Release created
- ✅ npm package published
- ✅ Installation works

### Business Success
- ✅ Downloads increasing
- ✅ Stars growing
- ✅ Community engaged
- ✅ Stakeholders notified

---

**Demo Author:** Max 🐶  
**Date:** 2026-05-02  
**Status:** ✅ Ready for Release