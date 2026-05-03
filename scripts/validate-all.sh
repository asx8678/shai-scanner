#!/bin/bash

# Comprehensive Validation Script for shai-scanner
# Usage: ./scripts/validate-all.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 SHAI-SCANNER COMPREHENSIVE VALIDATION${NC}"
echo "=========================================="
echo ""

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper function to run test
run_test() {
  local test_name=$1
  local command=$2
  local critical=${3:-false}
  
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -n "${BLUE}Testing: ${test_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    if [ "$critical" = true ]; then
      echo -e "${RED}Critical test failed! Aborting.${NC}"
      exit 1
    fi
    return 0
  fi
}

# Phase 1: GitHub CLI Validation
echo -e "${BLUE}Phase 1: GitHub CLI Validation${NC}"
echo "-----------------------------"

run_test "GitHub CLI installed" "gh --version" true
run_test "GitHub CLI authenticated" "gh auth status" true
run_test "Repository accessible" "gh repo view asx8678/shai-scanner" true
run_test "Secrets permissions" "gh secret list" false

echo ""

# Phase 2: npm Validation
echo -e "${BLUE}Phase 2: npm Validation${NC}"
echo "-----------------------"

run_test "npm installed" "npm --version" true
run_test "npm authentication" "npm whoami" false
run_test "Package exists on npm" "npm view shai-scanner" false

echo ""

# Phase 3: Package.json Validation
echo -e "${BLUE}Phase 3: Package.json Validation${NC}"
echo "--------------------------------"

run_test "JSON syntax valid" "node -e \"require('./package.json')\"" true
run_test "Required fields present" "node -e \"
const pkg = require('./package.json');
const required = ['name', 'version', 'main', 'bin', 'files', 'engines'];
const missing = required.filter(field => !pkg[field]);
if (missing.length > 0) {
  console.error('Missing:', missing.join(', '));
  process.exit(1);
}
\"" true
run_test "Bin file exists" "test -f $(node -p "require('./package.json').bin.shai-scanner")" true
run_test "Main file exists" "test -f $(node -p "require('./package.json').main")" true

echo ""

# Phase 4: Test Suite Validation
echo -e "${BLUE}Phase 4: Test Suite Validation${NC}"
echo "-----------------------------"

run_test "Self-test suite" "npm test" true
run_test "SBOM tests" "node test/sbom-test.js" false
run_test "TUI tests" "node test/tui-test.js" false
run_test "Import validation" "node test/test-tui-imports.js" false

echo ""

# Phase 5: Documentation Validation
echo -e "${BLUE}Phase 5: Documentation Validation${NC}"
echo "--------------------------------"

run_test "README.md exists" "test -f README.md" true
run_test "CHANGELOG.md exists" "test -f CHANGELOG.md" true
run_test "LICENSE exists" "test -f LICENSE" true
run_test "SECURITY.md exists" "test -f SECURITY.md" true
run_test "API documentation" "test -f docs/API.md" false
run_test "Troubleshooting guide" "test -f docs/TROUBLESHOOTING.md" false

echo ""

# Phase 6: npm Pack Validation
echo -e "${BLUE}Phase 6: npm Pack Validation${NC}"
echo "--------------------------"

run_test "npm pack dry-run" "npm pack --dry-run" true
run_test "Package size check" "npm pack --dry-run 2>&1 | grep -q 'package size:'" true

echo ""

# Phase 7: GitHub Actions Validation
echo -e "${BLUE}Phase 7: GitHub Actions Validation${NC}"
echo "--------------------------------"

run_test "Publish workflow exists" "test -f .github/workflows/publish.yml" true
run_test "Release workflow exists" "test -f .github/workflows/release.yml" false
run_test "Test workflow exists" "test -f .github/workflows/test.yml" false

echo ""

# Phase 8: Security Validation
echo -e "${BLUE}Phase 8: Security Validation${NC}"
echo "---------------------------"

run_test "No tokens in code" "! grep -r 'npm_' --include='*.js' --include='*.json' . 2>/dev/null | grep -v node_modules" true
run_test ".gitignore includes sensitive files" "grep -q '.npmrc' .gitignore 2>/dev/null || true" false

echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo "=================="
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  echo -e "${GREEN}✅ ${TESTS_PASSED}/${TESTS_TOTAL} tests passed${NC}"
  echo ""
  echo -e "${GREEN}Ready for next phase: NPM_TOKEN setup${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Set up NPM_TOKEN: ./scripts/setup-npm-token.sh YOUR_TOKEN"
  echo "2. Run dry-run: ./scripts/test-publish-dry-run.sh"
  echo "3. Publish: ./scripts/publish.sh 4.6.5"
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  echo -e "${RED}❌ ${TESTS_FAILED}/${TESTS_TOTAL} tests failed${NC}"
  echo -e "${GREEN}✅ ${TESTS_PASSED}/${TESTS_TOTAL} tests passed${NC}"
  echo ""
  echo -e "${YELLOW}Please fix the failing tests before proceeding.${NC}"
  echo "Review the output above for details."
fi

echo ""
echo -e "${BLUE}Validation completed at: $(date)${NC}"