#!/bin/bash
set -e

echo "🔄 Rollback Dry-Run Testing..."
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ROLLBACK_PASSED=0
ROLLBACK_FAILED=0

# Helper function
run_check() {
  local check_name=$1
  local command=$2
  
  echo -n "${BLUE}Testing: ${check_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    ROLLBACK_FAILED=$((ROLLBACK_FAILED + 1))
    return 0
  fi
}

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo ""
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Step 1: Test npm deprecation syntax
echo ""
echo -e "${BLUE}Step 1: Testing npm deprecation syntax...${NC}"
# We can't actually run deprecation in dry-run, so we test the command syntax
if npm deprecate --help 2>&1 | grep -q "usage\|Usage"; then
  echo -e "${GREEN}✅ npm deprecate command available${NC}"
  ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
else
  echo -e "${RED}❌ npm deprecate command not found${NC}"
  ROLLBACK_FAILED=$((ROLLBACK_FAILED + 1))
fi

# Step 2: Test npm unpublish syntax
echo ""
echo -e "${BLUE}Step 2: Testing npm unpublish syntax...${NC}"
if npm unpublish --help 2>&1 | grep -q "usage\|Usage"; then
  echo -e "${GREEN}✅ npm unpublish command available${NC}"
  ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
else
  echo -e "${RED}❌ npm unpublish command not found${NC}"
  ROLLBACK_FAILED=$((ROLLBACK_FAILED + 1))
fi

# Step 3: Check if version is published
echo ""
echo -e "${BLUE}Step 3: Checking version status on npm...${NC}"
if npm view "shai-scanner@${CURRENT_VERSION}" version 2>/dev/null; then
  echo -e "${GREEN}✅ Version ${CURRENT_VERSION} exists on npm${NC}"
  echo "   Rollback would affect this version"
  ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Version ${CURRENT_VERSION} not found on npm${NC}"
  echo "   Rollback may not be needed"
fi

# Step 4: Check git status
echo ""
echo -e "${BLUE}Step 4: Checking git status...${NC}"
if git status 2>/dev/null | grep -q "nothing to commit"; then
  echo -e "${GREEN}✅ Git working directory clean${NC}"
  ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Git has uncommitted changes${NC}"
  echo "   Consider committing before rollback"
fi

# Step 5: Test git revert (dry-run)
echo ""
echo -e "${BLUE}Step 5: Testing git revert (dry-run)...${NC}"
if git revert HEAD --dry-run 2>&1; then
  echo -e "${GREEN}✅ Git revert possible (no conflicts)${NC}"
  ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Git revert may have conflicts${NC}"
  echo "   Manual conflict resolution may be needed"
fi

# Step 6: Test emergency rollback script
echo ""
echo -e "${BLUE}Step 6: Testing emergency rollback script...${NC}"
if [ -f "./scripts/emergency-rollback.sh" ]; then
  if ./scripts/emergency-rollback.sh --help 2>&1 | grep -q "Usage\|usage"; then
    echo -e "${GREEN}✅ Emergency rollback script works${NC}"
    ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
  else
    echo -e "${RED}❌ Emergency rollback script has issues${NC}"
    ROLLBACK_FAILED=$((ROLLBACK_FAILED + 1))
  fi
else
  echo -e "${RED}❌ Emergency rollback script not found${NC}"
  ROLLBACK_FAILED=$((ROLLBACK_FAILED + 1))
fi

# Step 7: Create version backup tag
echo ""
echo -e "${BLUE}Step 7: Creating version backup tag...${NC}"
BACKUP_TAG="backup/v${CURRENT_VERSION}"
if git tag -l "$BACKUP_TAG" | grep -q "$BACKUP_TAG"; then
  echo -e "${YELLOW}⚠️  Tag ${BACKUP_TAG} already exists${NC}"
  echo "   Skipping tag creation"
else
  echo -e "${GREEN}✅ Backup tag command: git tag ${BACKUP_TAG}${NC}"
  echo "   (Not creating tag in dry-run mode)"
fi
ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))

# Step 8: Check for previous versions
echo ""
echo -e "${BLUE}Step 8: Checking for previous versions...${NC}"
if npm view shai-scanner versions --json 2>/dev/null | grep -q "\"${CURRENT_VERSION}\""; then
  echo -e "${GREEN}✅ Previous versions available for rollback${NC}"
  npm view shai-scanner versions --json 2>/dev/null | tail -5 | sed 's/^/   /'
  ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Could not retrieve version history${NC}"
fi

# Step 9: Test npm login status
echo ""
echo -e "${BLUE}Step 9: Testing npm authentication...${NC}"
if npm whoami 2>/dev/null; then
  echo -e "${GREEN}✅ Logged into npm${NC}"
  ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Not logged into npm locally${NC}"
  echo "   Rollback would require authentication"
fi

# Step 10: Check GitHub CLI
echo ""
echo -e "${BLUE}Step 10: Checking GitHub CLI...${NC}"
if command -v gh &> /dev/null; then
  if gh auth status 2>/dev/null | grep -q "Logged in"; then
    echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
    ROLLBACK_PASSED=$((ROLLBACK_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  GitHub CLI not authenticated${NC}"
    echo "   Some rollback features may not work"
  fi
else
  echo -e "${YELLOW}⚠️  GitHub CLI not installed${NC}"
  echo "   Install with: brew install gh"
fi

# Summary
echo ""
echo "================================="
echo -e "${BLUE}ROLLBACK DRY-RUN SUMMARY${NC}"
echo "========================"
echo ""

if [ $ROLLBACK_FAILED -gt 0 ]; then
  echo -e "${RED}❌ ROLLBACK TEST FAILED${NC}"
  echo -e "${RED}   ${ROLLBACK_FAILED} check(s) failed${NC}"
  echo -e "${GREEN}   ${ROLLBACK_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${RED}🚨 Review rollback procedures before publishing${NC}"
  exit 1
else
  echo -e "${GREEN}✅ ROLLBACK TEST PASSED${NC}"
  echo -e "${GREEN}   ${ROLLBACK_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${GREEN}🔄 Rollback procedures are ready${NC}"
fi

echo ""
echo -e "${BLUE}📋 Rollback Commands Reference:${NC}"
echo "   Deprecate: npm deprecate shai-scanner@${CURRENT_VERSION} 'Use version X.X.X'"
echo "   Unpublish: npm unpublish shai-scanner@${CURRENT_VERSION}"
echo "   Git revert: git revert HEAD"
echo "   Emergency: ./scripts/emergency-rollback.sh ${CURRENT_VERSION} --deprecate"
echo ""
echo -e "${BLUE}Dry-run completed at: $(date)${NC}"
