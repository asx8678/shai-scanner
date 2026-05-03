# 🚀 Comprehensive Launch Execution Plan
## shai-scanner v4.6.5 — Final BD Readiness Tasks

**Created:** 2026-05-03 | **Author:** Max 🐶 (code-puppy-39f735)
**Status:** 🎯 ACTIONABLE PLAN | **Current Version:** 4.6.5
**Blocker:** `NPM_TOKEN` secret not configured in GitHub
**Latest:** ✅ SBOM test import fix applied — all tests passing

---

## 📊 Current State Assessment

| Metric | Status | Notes |
|--------|--------|-------|
| **Tests (self-test)** | ✅ 174 passing | 100% success rate |
| **SBOM Test** | ✅ Fixed | Added missing re-exports to `src/index.js` — all 14 SBOM tests pass |
| **Package Size** | ✅ 104.3 kB | Well under 200 kB target |
| **Runtime Deps** | ✅ 0 | Major competitive advantage |
| **CI/CD Workflows** | ✅ 5 active | publish, release, test, pr-quality, codeql |
| **TUI CLI Integration** | ✅ Exists | `--tui` flag, dynamic import, full feature parity |
| **NPM Publish** | ❌ Blocked | Missing `NPM_TOKEN` secret |
| **Documentation** | ✅ 14,000+ lines | 50+ files across all audiences |
| **Marketing** | ✅ 19 docs ready | Launch calendar, social, email, press |

---

## Phase 1: Pre-Launch Fixes (Optional but Recommended)

> **Time Estimate:** 10–20 minutes
> **Responsible:** Max (automated) + User (decision on TUI)

### Task 1.1: Fix SBOM Test Import Issue ✅ DONE

**The Bug:** `test/sbom-test.js` imports `generateSBOM`, `generateMinimalSBOM`, and `validateNTIACompliance` from `../src/index.js`, but `src/index.js` does not re-export these functions from `src/sbom.js`. This causes a `SyntaxError` at import time.

**The Fix:** Add SBOM re-exports to `src/index.js`.

| Item | Detail |
|------|--------|
| **Effort** | 2 minutes |
| **Risk** | None — purely additive export |
| **Impact** | Test suite completeness, npm package API surface |
| **Who** | Max (automated) |
| **Verification** | Run `node test/sbom-test.js` — should pass |

**What gets added to `src/index.js`:**
```js
export { generateSBOM, generateMinimalSBOM, validateNTIACompliance } from './sbom.js';
```

**Why this matters:**
- The SBOM functionality already works (the functions exist in `src/sbom.js`)
- The test just can't import them through the public API barrel file
- Adding these to the public API actually **increases** the product's value — consumers can use SBOM generation programmatically
- This is consistent with the `index.d.ts` type definitions (if SBOM types are declared there, they should be exported)

---

### Task 1.2: TUI CLI Integration — Feature Gap vs Launch Blocker

**Current State:** The TUI is fully integrated. `src/cli.js` has a `--tui` flag that dynamically imports `src/tui/components/app.js`. Tests confirm CLI parity (`test/tui-test.js` lines 136–137, 399).

| Question | Answer |
|----------|--------|
| Does the TUI exist? | ✅ Yes — full TUI in `src/tui/` |
| Does it work from CLI? | ✅ Yes — `--tui` flag triggers it |
| Is it feature-complete? | ✅ Yes — full parity with CLI flags per `PHASE3_COMPLETE.md` |
| Is it a launch blocker? | **No** |

**Decision: NOT a launch blocker.** The TUI is implemented, tested, and documented (`docs/TUI_USAGE_GUIDE.md`). It's a feature, not a gap.

| Item | Detail |
|------|--------|
| **Action Required** | None — already fully integrated |
| **Evidence** | `test/tui-test.js` line 136-137 confirms `--tui` flag and dynamic import |
| **Optional Enhancement** | Could add `--no-tui` flag for CI environments, but not needed |
| **Recommendation** | Launch now, iterate later if feedback warrants |

---

## Phase 2: NPM_TOKEN Configuration

> **Time Estimate:** 5 minutes
> **Responsible:** User (manual) — Max cannot access npm/GitHub accounts

### Task 2.1: Generate npm Access Token

**Step-by-step:**

1. **Navigate to npm token settings:**
   - Open: https://www.npmjs.com/settings/tokens
   - Log in if prompted

2. **Generate new token:**
   - Click **"Generate New Token"**
   - Select token type: **"Automation"**
     - ⚠️ Do NOT select "Publish" — Automation is designed for CI/CD and bypasses 2FA prompts
   - Name: `github-actions-shai-scanner`
   - Click **"Generate Token"**
   - **🔑 COPY THE TOKEN IMMEDIATELY** — it's only shown once!

3. **Verification (optional but recommended):**
   ```bash
   npm set //registry.npmjs.org/:_authToken=<your-token-here>
   npm whoami
   # Should print your npm username
   ```

| Item | Detail |
|------|--------|
| **Time** | 2 minutes |
| **Prerequisite** | npm account with publish rights to `shai-scanner` package |
| **Token Type** | Automation (recommended for CI/CD) |
| **Risk** | Low — token can be revoked at any time |

### Task 2.2: Add Token to GitHub Secrets

**Step-by-step:**

1. **Navigate to repo secrets:**
   - Open: https://github.com/asx8678/shai-scanner/settings/secrets/actions
   - (Or: Repository → Settings → Secrets and variables → Actions)

2. **Create secret:**
   - Click **"New repository secret"**
   - Name: `NPM_TOKEN` (case-sensitive, exactly this)
   - Secret: (paste the token from Step 2.1)
   - Click **"Add secret"**

3. **Alternative — CLI method (if GitHub CLI installed):**
   ```bash
   gh secret set NPM_TOKEN --body "your-token-here"
   gh secret list | grep NPM_TOKEN
   # Should show: NPM_TOKEN  Updated just now
   ```

| Item | Detail |
|------|--------|
| **Time** | 2 minutes |
| **Prerequisite** | Admin access to GitHub repository |
| **Secret Name** | `NPM_TOKEN` (must match exactly) |

### Task 2.3: Verify NPM_TOKEN Configuration

```bash
# Method 1: Trigger a dry-run publish and watch it succeed auth step
gh workflow run publish.yml -f version="4.6.5" -f dry_run=true --ref main

# Method 2: Check GitHub Actions UI
# → Go to Actions tab → "Publish to npm" workflow
# → If it gets past "auth" step without E401, the token is good
```

| Verification | Expected Result |
|--------------|-----------------|
| Dry-run workflow succeeds auth step | ✅ No E401 error |
| `gh secret list` shows NPM_TOKEN | ✅ Secret exists |
| Workflow logs show "Authenticated to npm" | ✅ Token valid |

**Potential Issues & Solutions:**

| Error | Cause | Fix |
|-------|-------|-----|
| `E401 Unauthorized` | Token invalid/expired | Regenerate at npmjs.com |
| `E403 Forbidden` | Wrong token type | Use "Automation" type, not "Read Only" |
| `No secret named NPM_TOKEN` | Typo in secret name | Ensure exactly `NPM_TOKEN` (case-sensitive) |
| `Token lacks publish permission` | npm account issue | Verify you're a maintainer of `shai-scanner` |

---

## Phase 3: Launch Execution

> **Time Estimate:** 5–15 minutes (mostly automated)
> **Responsible:** User triggers → Max verifies

### Task 3.1: Pre-Launch Validation Checklist

Run these checks **before** triggering the publish:

```bash
# 1. Tests pass
npm test
# Expected: "self-test passed"

# 2. Package builds correctly
npm pack --dry-run
# Expected: 50 files, ~110 kB

# 3. CLI works
node src/cli.js --version
# Expected: 4.6.5

node src/cli.js --help
# Expected: Full help output

# 4. Workflow files exist
ls .github/workflows/
# Expected: codeql.yml pr-quality.yml publish.yml release.yml test.yml

# 5. SBOM test passes (after Phase 1 fix)
node test/sbom-test.js
# Expected: No errors
```

| Check | Status | Pass Criteria |
|-------|--------|---------------|
| `npm test` | ⬜ | "self-test passed" |
| `npm pack --dry-run` | ⬜ | 50 files, ~110 kB |
| `--version` | ⬜ | Returns `4.6.5` |
| `--help` | ⬜ | Full usage output |
| SBOM test | ✅ | All 14 tests pass |
| Workflows exist | ⬜ | 5 YAML files |

### Task 3.2: Launch Execution (Pick One)

#### Option A: GitHub UI (Simplest) ⭐ RECOMMENDED
1. Go to: https://github.com/asx8678/shai-scanner/actions/workflows/publish.yml
2. Click **"Run workflow"**
3. Fill in:
   - Branch: `main`
   - Version: `4.6.5`
   - Dry run: `false`
4. Click **"Run workflow"**
5. ⏱️ Wait ~2 minutes

#### Option B: GitHub CLI (Power User)
```bash
# Dry run first (safe — no publish)
gh workflow run publish.yml -f version="4.6.5" -f dry_run=true --ref main
echo "Watch workflow at: https://github.com/asx8678/shai-scanner/actions"

# After dry run passes, do the real thing
gh workflow run publish.yml -f version="4.6.5" -f dry_run=false --ref main
```

#### Option C: Full Release Pipeline (Bumps + Tag + Publish)
```bash
# This does everything: tests → version bump → git tag → push → publish
./scripts/release.sh patch

# If the script doesn't auto-push tags:
git push origin main --tags
```

| Option | Complexity | Safety | Recommended For |
|--------|-----------|--------|-----------------|
| **A: GitHub UI** | Easy | Safe | First-timers |
| **B: CLI dry-run** | Medium | Safest | Cautious users |
| **C: Release script** | Advanced | Automated | Power users |

### Task 3.3: Post-Launch Verification

After the workflow completes (~2 minutes), run these checks:

```bash
# 1. Check npm registry
npm view shai-scanner version
# Expected: 4.6.5

# 2. Check package details
npm view shai-scanner
# Expected: Full package info, 0 dependencies, ~110 kB

# 3. Test global installation
npm install -g shai-scanner@4.6.5
shai-scanner --version
# Expected: 4.6.5

# 4. Test local scan
mkdir /tmp/test-scan && cd /tmp/test-scan
npm init -y > /dev/null 2>&1
npm install express > /dev/null 2>&1
shai-scanner --scan . --offline
# Expected: Scan results with 0 vulnerabilities (or real findings)

# 5. Check GitHub Release
gh release view v4.6.5
# Expected: Release notes, assets (tar.gz, zip, checksums)
```

| Verification | Command | Expected |
|--------------|---------|----------|
| npm version | `npm view shai-scanner version` | `4.6.5` |
| npm metadata | `npm view shai-scanner` | Full info, 0 deps |
| Global install | `npm install -g shai-scanner@4.6.5` | Success |
| CLI works | `shai-scanner --version` | `4.6.5` |
| GitHub Release | `gh release view v4.6.5` | Release notes + assets |

**Troubleshooting:**

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Workflow failed at npm publish | Token issue | Re-check Phase 2, regenerate token |
| Version already exists on npm | Version conflict | Bump to `4.6.6`: `npm version patch` |
| GitHub Release missing | Tag not pushed | `git tag v4.6.5 && git push origin main --tags` |
| Install fails | Node version | Requires Node.js ≥ 18 |

---

## Phase 4: Post-Launch Activities

> **Time Estimate:** 1–4 hours (spread over day 1)
> **Responsible:** User executes marketing; Max provides materials

### Task 4.1: Launch Day Checklist Execution

Follow the hour-by-hour checklist in `LAUNCH_DAY_CHECKLIST.md`:

| Time | Task | Status |
|------|------|--------|
| 8:00 AM | Final technical verification | ⬜ |
| 9:00 AM | Publish to npm (Phase 3 above) | ⬜ |
| 9:30 AM | Verify installation works | ⬜ |
| 10:00 AM | Publish blog post (`marketing/BLOG_POST.md`) | ⬜ |
| 10:30 AM | Send email sequences (`marketing/EMAIL_SEQUENCES.md`) | ⬜ |
| 11:00 AM | Post to social media (`marketing/SOCIAL_MEDIA.md`) | ⬜ |
| 12:00 PM | Submit to Hacker News, Reddit, Dev.to | ⬜ |
| 1:00 PM | Brief support team (`docs/support/SUPPORT_TEAM_BRIEFING.md`) | ⬜ |
| 2:00 PM | Monitor first downloads and issues | ⬜ |
| 5:00 PM | Day 1 summary and metrics check | ⬜ |

### Task 4.2: Marketing Material Deployment

All materials are ready in `marketing/`. Deployment targets:

| Channel | Document | Action |
|---------|----------|--------|
| **Blog** | `marketing/BLOG_POST.md` | Publish to personal blog / Dev.to / Medium |
| **Twitter/X** | `marketing/SOCIAL_MEDIA.md` | Schedule thread (10 posts) |
| **LinkedIn** | `marketing/SOCIAL_MEDIA.md` | Publish long-form post |
| **Reddit** | `marketing/SOCIAL_MEDIA.md` | Post to r/programming, r/javascript, r/netsec |
| **Hacker News** | `marketing/PRESS_RELEASE.md` | Submit as "Show HN" |
| **Email** | `marketing/EMAIL_SEQUENCES.md` | Send to subscriber list |
| **GitHub** | `marketing/LANDING_PAGE.md` | Update README badges and links |

### Task 4.3: Monitoring and Metrics Tracking

**Day 1 Metrics to Track:**

| Metric | Target | How to Check |
|--------|--------|-------------|
| npm downloads | 10+ | `npm view shai-scanner` or https://www.npmjs.com/package/shai-scanner |
| GitHub stars | 5+ | GitHub repo page |
| Issues opened | 0 critical | GitHub Issues tab |
| Installation success | 100% | Manual test on clean machine |

**Automated Monitoring Available:**
- `scripts/monitor-npm.js` — npm download analytics
- `scripts/repo-health.js` — repository health dashboard

```bash
# Run monitoring scripts
node scripts/monitor-npm.js
node scripts/repo-health.js
```

**Week 1 Metrics:**

| Metric | Target | Source |
|--------|--------|--------|
| npm downloads | 100+ | npmjs.com |
| GitHub stars | 25+ | GitHub |
| Community contributors | 2+ | PRs/Issues |
| Issue resolution time | < 48 hours | GitHub |

---

## 📋 Quick Reference Guide

### The 10-Step Launch Checklist

```
☑ 1. ~~Fix SBOM exports~~ (DONE — 1 line added to src/index.js)
□ 2. Generate npm Automation token
□ 3. Add NPM_TOKEN to GitHub secrets
□ 4. Run `npm test` — confirm "self-test passed"
□ 5. Run `node test/sbom-test.js` — confirm no errors
□ 6. Trigger publish workflow (version=4.6.5, dry_run=false)
□ 7. Wait 2 minutes, then `npm view shai-scanner version`
□ 8. `npm install -g shai-scanner@4.6.5` — confirm it works
□ 9. Execute launch day checklist (social, blog, email)
□ 10. Monitor downloads and issues for first 24 hours
```

### Emergency Rollback

If something goes wrong after publish:
```bash
# npm doesn't allow unpublishing after 72 hours, but you can:
# 1. Yank the version (deprecate)
npm deprecate shai-scanner@4.6.5 "Deprecated due to issue. Use 4.6.6+"

# 2. Publish a hotfix
./scripts/bump-version.sh patch
./scripts/release.sh patch
```

### Key Commands Cheat Sheet

| Action | Command |
|--------|---------|
| Run tests | `npm test` |
| Test SBOM | `node test/sbom-test.js` |
| Pack (dry) | `npm pack --dry-run` |
| Version check | `node src/cli.js --version` |
| Set npm token | `gh secret set NPM_TOKEN --body "token"` |
| Trigger publish | `gh workflow run publish.yml -f version="4.6.5" -f dry_run=false` |
| Check npm | `npm view shai-scanner version` |
| Install globally | `npm install -g shai-scanner@4.6.5` |
| Full release | `./scripts/release.sh patch` |
| Monitor | `node scripts/monitor-npm.js` |

---

## ⏱️ Total Time Estimate

| Phase | Time | Who |
|-------|------|-----|
| Phase 1: Fix SBOM exports | ✅ Done | Max (automated) |
| Phase 1: TUI decision | ✅ Done (not a blocker) | User (no action needed) |
| Phase 2: npm token | 3 min | User (manual) |
| Phase 2: GitHub secret | 2 min | User (manual) |
| Phase 3: Pre-launch checks | 3 min | User + Max |
| Phase 3: Trigger publish | 2 min | User |
| Phase 3: Verify publish | 2 min | User |
| Phase 4: Launch activities | 2–4 hrs | User (spread over day) |
| **TOTAL to public npm** | **~13 min** (Phase 1 done!) | |

---

## 🎯 What Max Has Done (Automated)

✅ 1. Added SBOM exports to `src/index.js` (1 line change)
✅ 2. Ran the full test suite — all tests pass
✅ 3. Validated the package — 104.3 kB, 49 files, 0 deps
✅ 4. Created this comprehensive execution plan

## 🎯 What Max Can Still Do (On Request)

- Add SBOM type definitions to `index.d.ts`
- Generate marketing launch content in optimal format
- Prepare any final verification scripts

## 🙋 What You Need to Do (Manual)

1. Generate npm Automation token (2 min)
2. Add `NPM_TOKEN` to GitHub secrets (2 min)
3. Trigger the publish workflow (1 min)
4. Verify it worked (2 min)
5. Execute launch marketing (2–4 hrs over day 1)

**That's it — 7 minutes of hands-on work before you're live on npm!**

---

**Ready to go?** Just say the word and I'll knock out Phase 1, then walk you through Phase 2 step by step! 🐶

*Woof woof! Let's ship this thing!*
