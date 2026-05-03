# 🚀 Quick Reference: Publish shai-scanner v4.6.5

**⚡ TL;DR: 5 commands to publish**

---

## 🔑 **Step 1: Get npm Token (2 minutes)**

**Go to:** https://www.npmjs.com/settings/tokens

1. Click **"Generate New Token"**
2. Select **"Automation"** (bypasses 2FA)
3. Name: `github-actions-shai-scanner`
4. **Copy the token** (you won't see it again!)

---

## 📦 **Step 2: Add to GitHub Secrets (1 minute)**

**Command line (fastest):**
```bash
gh secret set NPM_TOKEN -R asx8678/shai-scanner -b "YOUR_TOKEN_HERE"
```

**Or GitHub UI:**
- Settings → Secrets → Actions → New secret
- Name: `NPM_TOKEN`
- Secret: (paste token)

---

## 🧪 **Step 3: Test Dry Run (2 minutes)**

```bash
gh workflow run publish.yml -f version="4.6.5" -f dry_run=true --ref main
```

**Verify:** Actions → Check for "Dry run mode - skipping actual publish"

---

## 🚀 **Step 4: Publish! (1 minute)**

```bash
gh workflow run publish.yml -f version="4.6.5" -f dry_run=false --ref main
```

**Wait 30 seconds...**

---

## ✅ **Step 5: Verify (1 minute)**

```bash
# Check npm registry
npm view shai-scanner version
# Output: 4.6.5

# Test installation
npm install -g shai-scanner@4.6.5
shai-scanner --version
# Output: 4.6.5
```

---

## 📋 **Post-Publish Checklist**

- [ ] Update README.md with new version
- [ ] Share on social media
- [ ] Monitor npm downloads: https://www.npmjs.com/package/shai-scanner
- [ ] Respond to issues/feedback
- [ ] Execute marketing plan (see `marketing/LAUNCH_CALENDAR.md`)

---

## 🆘 **Troubleshooting**

| Problem | Solution |
|---------|----------|
| `E401` auth failed | Check token permissions (need "Publish" or "Automation") |
| `E403` forbidden | Verify you own the package |
| `Version exists` | Bump version: `npm version patch` |
| `Secret not found` | Name must be exactly `NPM_TOKEN` (uppercase) |

---

## 📚 **Full Documentation**

- **Detailed Plan:** `EXECUTION_PLAN_NPM_PUBLISH.md`
- **Publish Guide:** `NPM_PUBLISH_GUIDE.md`
- **Launch Checklist:** `LAUNCH_DAY_CHECKLIST.md`
- **Marketing:** `marketing/LAUNCH_CALENDAR.md`

---

**⚡ Total Time: 7 minutes**  
**🎯 Status: Ready to publish!**  
**🐶 Max says: You got this, Adam!**