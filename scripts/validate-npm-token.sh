#!/bin/bash

# NPM_TOKEN Validation Script for shai-scanner
# Usage: ./scripts/validate-npm-token.sh [token]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

echo -e "${BLUE}🔍 NPM TOKEN VALIDATION${NC}"
echo "========================"
echo ""

# Helper function to run a validation check
run_check() {
  local check_name=$1
  local command=$2
  local critical=${3:-false}
  
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
  echo -n "${BLUE}Checking: ${check_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    if [ "$critical" = true ]; then
      echo -e "${RED}Critical check failed! Aborting.${NC}"
      exit 1
    fi
    return 0
  fi
}

# Parse command line arguments
TOKEN=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --help|-h)
      echo "Usage: $0 [npm-token]"
      echo ""
      echo "Validates NPM_TOKEN configuration for shai-scanner."
      echo "If token is provided, validates format and permissions."
      echo "Always checks GitHub secret exists and validates setup."
      echo ""
      echo "Examples:"
      echo "  $0                    # Validate GitHub secret exists"
      echo "  $0 npm_abc123xyz      # Validate specific token"
      echo "  $0 --help             # Show this help message"
      exit 0
      ;;
    *)
      TOKEN="$1"
      shift
      ;;
  esac
done

# Step 1: Check GitHub CLI
echo -e "${BLUE}Step 1: Checking GitHub CLI setup${NC}"
echo "--------------------------------"
run_check "GitHub CLI installed" "gh --version" true
run_check "GitHub CLI authenticated" "gh auth status" true
run_check "Repository accessible" "gh repo view" true
echo ""

# Step 2: Check NPM_TOKEN secret in GitHub
echo -e "${BLUE}Step 2: Checking GitHub secrets${NC}"
echo "------------------------------"
if gh secret list | grep -q "NPM_TOKEN"; then
  echo -e "${GREEN}✅ NPM_TOKEN secret exists in GitHub${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${RED}❌ NPM_TOKEN secret not found in GitHub${NC}"
  echo ""
  echo -e "${YELLOW}To set it up:${NC}"
  echo "  1. Generate token: https://www.npmjs.com/settings/tokens"
  echo "  2. Run setup script: ./scripts/setup-npm-token.sh YOUR_TOKEN"
  echo "  3. Or manually: gh secret set NPM_TOKEN --body 'npm_...'"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi
echo ""

# Step 3: Validate token format (if provided)
if [ -n "$TOKEN" ]; then
  echo -e "${BLUE}Step 3: Validating token format${NC}"
  echo "-----------------------------"
  
  # Check token starts with npm_
  if [[ $TOKEN =~ ^npm_ ]]; then
    echo -e "${GREEN}✅ Token format is valid (starts with 'npm_')${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}❌ Invalid token format - must start with 'npm_'${NC}"
    echo "  Token starts with: $(echo $TOKEN | cut -c1-10)..."
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
  
  # Check token length (rough validation)
  TOKEN_LENGTH=${#TOKEN}
  if [ $TOKEN_LENGTH -ge 36 ]; then
    echo -e "${GREEN}✅ Token length appears valid (${TOKEN_LENGTH} chars)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  Token seems short (${TOKEN_LENGTH} chars) - verify this is correct${NC}"
  fi
  echo ""
  
  # Step 4: Test token permissions
  echo -e "${BLUE}Step 4: Testing token permissions${NC}"
  echo "-------------------------------"
  
  # Temporarily set token for testing
  echo "   Setting up temporary npm config..."
  npm set //registry.npmjs.org/:_authToken="$TOKEN" 2>/dev/null
  
  # Test npm whoami
  if npm whoami > /dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✅ Token authenticated successfully${NC}"
    echo "   Logged in as: ${NPM_USER}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}❌ Token authentication failed${NC}"
    echo "   Token may be expired or invalid"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
  
  # Test if we can see packages
  if npm access ls-packages > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Token has package read permissions${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  Token may not have package read permissions${NC}"
  fi
  
  # Cleanup npm config
  echo "   Cleaning up temporary npm config..."
  npm config delete //registry.npmjs.org/:_authToken 2>/dev/null || true
  echo ""

# Step 5: Test token from GitHub secret (if no token provided)
else
  echo -e "${BLUE}Step 3: Testing token from GitHub secret${NC}"
  echo "--------------------------------------"
  
  # Check if we can test with the secret (requires gh CLI and local env)
  echo -e "${YELLOW}⚠️  To test the GitHub secret token:${NC}"
  echo "   1. Provide token as argument: $0 npm_..."
  echo "   2. Or run: ./scripts/setup-npm-token.sh TOKEN --test"
  echo "   3. Or manually test in GitHub Actions workflow"
fi

# Summary
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo "=================="
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
  echo -e "${GREEN}✅ ${CHECKS_PASSED}/${CHECKS_TOTAL} checks passed${NC}"
  echo ""
  echo -e "${GREEN}NPM_TOKEN is properly configured for shai-scanner${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Test publishing: ./scripts/test-publish-dry-run.sh"
  echo "  2. Publish: ./scripts/publish.sh"
  echo "  3. Verify: ./scripts/verify.sh"
else
  echo -e "${RED}⚠️  SOME CHECKS FAILED${NC}"
  echo -e "${RED}❌ ${CHECKS_FAILED}/${CHECKS_TOTAL} checks failed${NC}"
  echo -e "${GREEN}✅ ${CHECKS_PASSED}/${CHECKS_TOTAL} checks passed${NC}"
  echo ""
  echo -e "${YELLOW}Please fix the failing checks before publishing.${NC}"
  echo "Review the output above for details."
  exit 1
fi

echo ""
echo -e "${BLUE}Validation completed at: $(date)${NC}"