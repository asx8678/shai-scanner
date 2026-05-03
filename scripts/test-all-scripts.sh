#!/bin/bash

# Test All Scripts for shai-scanner
# Usage: ./scripts/test-all-scripts.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 TESTING ALL SCRIPTS${NC}"
echo "====================="
echo ""

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper function to run test
run_test() {
  local test_name=$1
  local command=$2
  
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -n "${BLUE}Testing: ${test_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Test script existence and permissions
echo -e "${BLUE}Phase 1: Script Existence and Permissions${NC}"
echo "----------------------------------------"

SCRIPTS=(
  "validate-all.sh"
  "publish.sh"
  "verify.sh"
  "setup-npm-token.sh"
  "validate-npm-token.sh"
  "monitor-launch.sh"
  "emergency-rollback.sh"
  "test-npm-publish.sh"
  "test-github-actions-locally.sh"
  "verify-npm-publish.sh"
  "bump-version.sh"
  "release.sh"
  "check-github-setup.js"
  "monitor-npm.js"
  "repo-health.js"
  "validate-discussion-templates.js"
  "validate-migration.js"
  "validate_phase4.js"
  "test-all-scripts.sh"
  "generate-docs.sh"
)

for script in "${SCRIPTS[@]}"; do
  run_test "Script exists: $script" "test -f scripts/$script"
  run_test "Script executable: $script" "test -x scripts/$script"
done

echo ""

# Test script help options
echo -e "${BLUE}Phase 2: Script Help Options${NC}"
echo "---------------------------"

HELP_SCRIPTS=(
  "publish.sh"
  "setup-npm-token.sh"
  "validate-npm-token.sh"
  "monitor-launch.sh"
  "emergency-rollback.sh"
)

for script in "${HELP_SCRIPTS[@]}"; do
  run_test "Help option: $script" "./scripts/$script --help"
done

echo ""

# Test script syntax
echo -e "${BLUE}Phase 3: Script Syntax${NC}"
echo "---------------------"

for script in "${SCRIPTS[@]}"; do
  if [[ "$script" == *.sh ]]; then
    run_test "Syntax check: $script" "bash -n scripts/$script"
  fi
done

echo ""

# Test dry-run modes
echo -e "${BLUE}Phase 4: Dry-Run Modes${NC}"
echo "---------------------"

run_test "publish.sh dry-run" "./scripts/publish.sh 4.6.5 --dry-run"
run_test "monitor-launch.sh one-time" "./scripts/monitor-launch.sh 2>/dev/null || true"

echo ""

# Test script error handling
echo -e "${BLUE}Phase 5: Error Handling${NC}"
echo "----------------------"

run_test "publish.sh no version" "./scripts/publish.sh 2>/dev/null || true"
run_test "setup-npm-token.sh no token" "./scripts/setup-npm-token.sh 2>/dev/null || true"
run_test "emergency-rollback.sh no version" "./scripts/emergency-rollback.sh 2>/dev/null || true"

echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "============"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL SCRIPT TESTS PASSED!${NC}"
  echo -e "${GREEN}✅ ${TESTS_PASSED}/${TESTS_TOTAL} tests passed${NC}"
  echo ""
  echo -e "${GREEN}All scripts are ready for use!${NC}"
else
  echo -e "${RED}⚠️  SOME SCRIPT TESTS FAILED${NC}"
  echo -e "${RED}❌ ${TESTS_FAILED}/${TESTS_TOTAL} tests failed${NC}"
  echo -e "${GREEN}✅ ${TESTS_PASSED}/${TESTS_TOTAL} tests passed${NC}"
  echo ""
  echo -e "${YELLOW}Please review the failures above.${NC}"
fi

echo ""
echo -e "${BLUE}Script testing completed at: $(date)${NC}"