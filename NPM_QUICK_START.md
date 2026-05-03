# 🐶 NPM Publish Quick Reference Card

**Package:** shai-scanner@4.6.5  
**Status:** Ready to publish (just need NPM_TOKEN)  
**Time to complete:** ~5 minutes

---

## 🎯 3-Step Process

### Step 1: Generate npm Token (1 minute)
```
1. Go to: https://www.npmjs.com/settings/tokens
2. Click: "Generate New Token"
3. Select: "Automation" (recommended)
4. Name: "github-actions-shai-scanner"
5. Generate → COPY IMMEDIATELY!
```

### Step 2: Add to GitHub Secrets (1 minute)
```
1. Go to: https://github.com/<you>/shai-scanner/settings/secrets/actions
2. Click: "New repository secret"
3. Name: NPM_TOKEN
4. Secret: (paste token)
5. Add secret
```

### Step 3: Publish (1 minute)
```bash
# Dry run test (safe)
gh workflow run publish.yml -f version="4.6.5" -f dry_run=true

# Actual publish
gh workflow run publish.yml -f version="4.6.5" -f dry_run=false

# Verify
npm view shai-scanner version
npm install -g shai-scanner@4.6.5
```

---

## 🚨 Common Issues & Fixes

| Error | Fix |
|-------|-----|
| `E401/E403` | Token needs "Publish" permission |
| `No secret found` | Secret name must be exactly `NPM_TOKEN` |
| `Version exists` | Bump version: `npm version patch` |
| `403 Forbidden` | You don't own the package |

---

## 📦 Package Stats
- **Size:** 102.3 kB ✅
- **Files:** 48 ✅
- **Dependencies:** 0 ✅
- **Tests:** 174 passing ✅

---

## 🔗 Quick Links
- **npm tokens:** https://www.npmjs.com/settings/tokens
- **GitHub secrets:** https://github.com/<you>/shai-scanner/settings/secrets/actions
- **Actions:** https://github.com/<you>/shai-scanner/actions/workflows/publish.yml
- **Full guide:** NPM_PUBLISH_GUIDE.md

---

**🐶 Woof! You've got this, Adam!**