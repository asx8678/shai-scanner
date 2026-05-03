#!/bin/bash

# Post-Publish Verification Script for shai-scanner
# Usage: ./scripts/verify.sh [version]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from argument or package.json
VERSION=${1:-$(node -p "require('./package.json').version")}

echo -e "${BLUE}🔍 SHAI-SCANNER POST-PUBLISH VERIFICATION${NC}"
echo "=========================================="
echo -e "${BLUE}Verifying version: ${VERSION}${NC}"
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
  
  ((TESTS_TOTAL++))
  echo -n "${BLUE}Testing: ${test_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
    if [ "$critical" = true ]; then
      echo -e "${RED}Critical test failed! Aborting.${NC}"
      exit 1
    fi
    return 1
  fi
}

# Phase 1: npm Registry Verification
echo -e "${BLUE}Phase 1: npm Registry Verification${NC}"
echo "--------------------------------"

run_test "Package exists on npm" "npm view shai-scanner" true
run_test "Version matches" "npm view shai-scanner version | grep -q '^${VERSION}$'" true
run_test "Dist-tags correct" "npm view shai-scanner dist-tags | grep -q 'latest:'" false
run_test "Package size reasonable" "npm view shai-scanner dist.unpackedSize | awk '{if (\$1 < 200000) exit 0; else exit 1}'" false

echo ""

# Phase 2: Installation Verification
echo -e "${BLUE}Phase 2: Installation Verification${NC}"
echo "--------------------------------"

# Create temporary directory for testing
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "Testing in temporary directory: $TEMP_DIR"

# Test global installation
echo -e "${BLUE}Testing global installation...${NC}"
if npm install -g "shai-scanner@${VERSION}"; then
  echo -e "${GREEN}✅ Global installation successful${NC}"
  
  # Test version command
  if shai-scanner --version | grep -q "${VERSION}"; then
    echo -e "${GREEN}✅ Version command works${NC}"
  else
    echo -e "${RED}❌ Version command failed${NC}"
  fi
  
  # Test help command
  if shai-scanner --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Help command works${NC}"
  else
    echo -e "${RED}❌ Help command failed${NC}"
  fi
  
  # Uninstall global
  npm uninstall -g shai-scanner
else
  echo -e "${RED}❌ Global installation failed${NC}"
fi

# Test local installation in temp project
echo -e "${BLUE}Testing local installation...${NC}"
mkdir test-project && cd test-project
npm init -y > /dev/null 2>&1

if npm install "shai-scanner@${VERSION}"; then
  echo -e "${GREEN}✅ Local installation successful${NC}"
  
  # Test require/import
  if node -e "require('shai-scanner')" 2>/dev/null; then
    echo -e "${GREEN}✅ Module can be required${NC}"
  else
    echo -e "${YELLOW}⚠️  Module require failed (might be ESM only)${NC}"
  fi
else
  echo -e "${RED}❌ Local installation failed${NC}"
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo ""

# Phase 3: Package Metadata Verification
echo -e "${BLUE}Phase 3: Package Metadata Verification${NC}"
echo "------------------------------------"

run_test "Repository URL correct" "npm view shai-scanner repository.url | grep -q 'github.com/asx8678/shai-scanner'" false
run_test "License specified" "npm view shai-scanner license | grep -q 'MIT'" false
run_test "Homepage set" "npm view shai-scanner homepage | grep -q 'github.com/asx8678/shai-scanner'" false
run_test "README available" "npm view shai-scanner readme | head -1 | grep -q '#'" false

echo ""

# Phase 4: GitHub Release Verification
echo -e "${BLUE}Phase 4: GitHub Release Verification${NC}"
echo "-----------------------------------"

run_test "GitHub release exists" "gh release view v${VERSION}" false
run_test "Release assets present" "gh release view v${VERSION} --json assets | grep -q 'tar.gz'" false

echo ""

# Phase 5: Smoke Tests
echo -e "${BLUE}Phase 5: Smoke Tests${NC}"
echo "-------------------"

# Create temporary directory for smoke tests
TEMP_SMOKE=$(mktemp -d)
cd "$TEMP_SMOKE"

# Create a simple test project
cat > package.json << EOF
{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "shai-scanner": "${VERSION}"
  }
}
EOF

npm install > /dev/null 2>&1

echo "Running smoke tests..."

# Test 1: Version check
echo -n "Smoke test: Version check... "
if npx shai-scanner --version | grep -q "${VERSION}"; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

# Test 2: Help command
echo -n "Smoke test: Help command... "
if npx shai-scanner --help > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

# Test 3: Basic scan
echo -n "Smoke test: Basic scan... "
if npx shai-scanner --scan . --offline > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${YELLOW}⚠️  WARN (scan failed, might be expected)${NC}"
fi

# Cleanup
cd /
rm -rf "$TEMP_SMOKE"

echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo "==================="
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL VERIFICATIONS PASSED!${NC}"
  echo -e "${GREEN}✅ ${TESTS_PASSED}/${TESTS_TOTAL} tests passed${NC}"
  echo ""
  echo -e "${GREEN}Version ${VERSION} is successfully published and verified!${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Update documentation: ./scripts/update-docs-for-npm.sh"
  echo "  2. Send notifications: ./scripts/send-launch-notifications.sh"
  echo "  3. Start monitoring: ./scripts/monitor-launch.sh"
else
  echo -e "${RED}⚠️  SOME VERIFICATIONS FAILED${NC}"
  echo -e "${RED}❌ ${TESTS_FAILED}/${TESTS_TOTAL} tests failed${NC}"
  echo -e "${GREEN}✅ ${TESTS_PASSED}/${TESTS_TOTAL} tests passed${NC}"
  echo ""
  echo -e "${YELLOW}Please review the failures above.${NC}"
  echo "Some failures might be expected (e.g., GitHub release not created yet)."
fi

echo ""
echo -e "${BLUE}Verification completed at: $(date)${NC}"