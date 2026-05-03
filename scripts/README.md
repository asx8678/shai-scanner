# 🐶 NPM Publish Scripts

This directory contains helper scripts for publishing shai-scanner to npm.

## 📋 Available Scripts

### 1. `test-npm-publish.sh`
**Purpose:** Test npm publish configuration locally  
**Usage:** `./scripts/test-npm-publish.sh`

**What it checks:**
- ✅ package.json configuration
- ✅ npm pack dry-run
- ✅ npm publish dry-run
- ✅ npm registry status
- ✅ npm authentication
- ✅ .npmignore configuration
- ✅ GitHub Actions workflow

**When to use:**
- Before setting up NPM_TOKEN
- When debugging publish issues
- To verify package configuration

### 2. `test-github-actions-locally.sh`
**Purpose:** Simulate GitHub Actions workflow locally  
**Usage:** `./scripts/test-github-actions-locally.sh`

**What it simulates:**
- ✅ Dependencies installation (npm ci)
- ✅ Running tests (npm test)
- ✅ Version validation
- ✅ Package validation (npm pack --dry-run)
- ✅ Publish dry-run (npm publish --dry-run)
- ✅ npm registry check
- ✅ package.json verification

**When to use:**
- To test workflow steps locally
- When debugging CI/CD issues
- Before pushing changes

### 3. `verify-npm-publish.sh`
**Purpose:** Verify successful npm publish  
**Usage:** `./scripts/verify-npm-publish.sh [version]`

**What it verifies:**
- ✅ npm registry has the correct version
- ✅ Package installation works
- ✅ CLI command works
- ✅ Scanner functionality

**When to use:**
- After running publish workflow
- To confirm package is live
- For post-publish validation

### 4. `validate-all.sh`
**Purpose:** Run comprehensive validation checks  
**Usage:** `./scripts/validate-all.sh`

**What it validates:**
- ✅ GitHub CLI setup and authentication
- ✅ npm account and package availability
- ✅ package.json configuration
- ✅ Test suite (174 tests)
- ✅ Documentation files
- ✅ npm pack dry-run
- ✅ GitHub Actions workflows
- ✅ Security checks

**When to use:**
- Before any publish attempt
- During pre-launch validation
- When debugging configuration issues

### 5. `publish.sh`
**Purpose:** One-command publish to npm  
**Usage:** `./scripts/publish.sh <version> [--dry-run] [--skip-tests]`

**What it does:**
- ✅ Runs tests (unless --skip-tests)
- ✅ Updates package.json version
- ✅ Creates git commit and tag
- ✅ Pushes to GitHub
- ✅ Publishes to npm
- ✅ Creates release summary

**When to use:**
- When ready to publish a new version
- For automated releases
- When you want a single command to handle everything

### 6. `verify.sh`
**Purpose:** Post-publish verification  
**Usage:** `./scripts/verify.sh [version]`

**What it verifies:**
- ✅ npm registry has the correct version
- ✅ Installation works (global and local)
- ✅ CLI commands work
- ✅ Package metadata is correct
- ✅ GitHub release exists
- ✅ Smoke tests pass

**When to use:**
- After publishing a new version
- To confirm everything is working
- For post-launch validation

### 7. `setup-npm-token.sh`
**Purpose:** Configure NPM_TOKEN in GitHub secrets  
**Usage:** `./scripts/setup-npm-token.sh <npm-token> [--validate] [--test]`

**What it does:**
- ✅ Validates token format
- ✅ Sets secret in GitHub
- ✅ Verifies secret exists
- ✅ Validates token permissions (optional)
- ✅ Tests token with npm (optional)

**When to use:**
- First time setup
- When rotating tokens
- When token issues occur

### 8. `validate-npm-token.sh`
**Purpose:** Validate NPM_TOKEN configuration and test permissions  
**Usage:** `./scripts/validate-npm-token.sh [npm-token]`

**What it checks:**
- ✅ GitHub CLI setup and authentication
- ✅ NPM_TOKEN secret exists in GitHub
- ✅ Token format validation (starts with 'npm_')
- ✅ Token length validation
- ✅ Token authentication via npm whoami
- ✅ Token package permissions

**When to use:**
- After setting up NPM_TOKEN
- When debugging token issues
- Before publishing to verify configuration
- When rotating tokens

### 9. `monitor-launch.sh`
**Purpose:** Monitor package after launch  
**Usage:** `./scripts/monitor-launch.sh [--continuous] [--interval <minutes>]`

**What it monitors:**
- ✅ npm package status
- ✅ GitHub release status
- ✅ Recent issues and workflows
- ✅ Repository statistics

**When to use:**
- After publishing a new version
- During launch day monitoring
- For ongoing package health checks

### 10. `emergency-rollback.sh`
**Purpose:** Emergency rollback procedures  
**Usage:** `./scripts/emergency-rollback.sh <version> [--deprecate] [--force]`

**What it does:**
- ✅ Deprecates or unpublishes a version
- ✅ Provides git rollback instructions
- ✅ Verifies the action
- ✅ Creates summary

**When to use:**
- Critical issues with published version
- Security vulnerabilities
- When you need to quickly disable a version

## 🚀 Quick Start

### Before Publishing
```bash
# 1. Validate everything
./scripts/validate-all.sh

# 2. Test your configuration
./scripts/test-npm-publish.sh

# 3. Simulate GitHub Actions workflow
./scripts/test-github-actions-locally.sh

# 4. Set up and validate NPM_TOKEN (if not done)
./scripts/setup-npm-token.sh your-token-here --validate --test
./scripts/validate-npm-token.sh your-token-here
```

### Publishing
```bash
# Option A: One-command publish (recommended)
./scripts/publish.sh 4.6.5

# Option B: Dry run first
./scripts/publish.sh 4.6.5 --dry-run

# Option C: Use existing workflow
gh workflow run publish.yml -f version="4.6.5" -f dry_run=false
```

### After Publishing
```bash
# 1. Verify publish was successful
./scripts/verify.sh 4.6.5

# 2. Monitor launch (optional)
./scripts/monitor-launch.sh --continuous
```

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| `COMPREHENSIVE_BD_NEXT_STEPS_PLAN.md` | Complete execution plan with all phases |
| `NPM_PUBLISH_GUIDE.md` | Complete step-by-step guide |
| `NPM_QUICK_START.md` | Quick reference card |
| `NPM_PUBLISH_SUMMARY.md` | Status summary |
| `BD_NEXT_RECOMMENDED_READY.md` | Next recommended steps |

## 🎯 Complete Workflow

```
1. Validate everything
   └─► ./scripts/validate-all.sh

2. Set up and validate NPM_TOKEN (if needed)
   └─► ./scripts/setup-npm-token.sh your-token --validate
   └─► ./scripts/validate-npm-token.sh your-token

3. Test configuration
   └─► ./scripts/test-npm-publish.sh

4. Publish (choose one):
   a) One-command: ./scripts/publish.sh 4.6.5
   b) GitHub CLI: gh workflow run publish.yml -f version="4.6.5"
   c) GitHub UI: https://github.com/asx8678/shai-scanner/actions/workflows/publish.yml

5. Verify publish
   └─► ./scripts/verify.sh 4.6.5

6. Monitor launch (optional)
   └─► ./scripts/monitor-launch.sh --continuous

7. Emergency rollback (if needed)
   └─► ./scripts/emergency-rollback.sh 4.6.5 --deprecate
```

## 🐶 Woof!

You've got this, Adam! 🚀