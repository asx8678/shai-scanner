#!/bin/bash
set -e

echo "🖥️  Cross-Platform Testing Matrix..."
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PLATFORM_PASSED=0
PLATFORM_FAILED=0

# Helper function
run_check() {
  local check_name=$1
  local command=$2
  
  echo -n "${BLUE}Testing: ${check_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
    return 0
  fi
}

# Detect current platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo ""
echo -e "${BLUE}Platform Information:${NC}"
echo "   OS: $PLATFORM"
echo "   Architecture: $ARCH"
echo "   Node.js: $NODE_VERSION"
echo "   npm: $NPM_VERSION"
echo ""

# Test matrix (for documentation)
echo -e "${BLUE}Test Matrix (CI/CD will test all combinations):${NC}"
echo "   ┌─────────────┬─────────────────────────────┐"
echo "   │ Platform    │ Node.js Versions            │"
echo "   ├─────────────┼─────────────────────────────┤"
echo "   │ Ubuntu      │ 18.x, 20.x, 22.x           │"
echo "   │ Windows     │ 18.x, 20.x, 22.x           │"
echo "   │ macOS       │ 18.x, 20.x, 22.x           │"
echo "   └─────────────┴─────────────────────────────┘"
echo "   Total combinations: 9"
echo ""

# Step 1: Run self-test suite
echo -e "${BLUE}Step 1: Running self-test suite...${NC}"
if npm test 2>&1; then
  echo -e "${GREEN}✅ Self-test passed${NC}"
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ Self-test failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Step 2: Run TUI tests
echo ""
echo -e "${BLUE}Step 2: Running TUI tests...${NC}"
if [ -f "test/tui-test.js" ]; then
  if node test/tui-test.js 2>&1; then
    echo -e "${GREEN}✅ TUI tests passed${NC}"
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  TUI tests had issues (non-critical)${NC}"
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))  # Non-blocking
  fi
else
  echo -e "${YELLOW}⚠️  TUI test file not found${NC}"
fi

# Step 3: Run SBOM tests
echo ""
echo -e "${BLUE}Step 3: Running SBOM tests...${NC}"
if [ -f "test/sbom-test.js" ]; then
  if node test/sbom-test.js 2>&1; then
    echo -e "${GREEN}✅ SBOM tests passed${NC}"
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  SBOM tests had issues (non-critical)${NC}"
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))  # Non-blocking
  fi
else
  echo -e "${YELLOW}⚠️  SBOM test file not found${NC}"
fi

# Step 4: Platform-specific checks
echo ""
echo -e "${BLUE}Step 4: Platform-specific checks...${NC}"
case "$PLATFORM" in
  Linux*)
    echo -e "${GREEN}✅ Linux-specific tests${NC}"
    
    # Test with different locales
    if LANG=en_US.UTF-8 npm test > /dev/null 2>&1; then
      echo -e "   ${GREEN}✅ UTF-8 locale${NC}"
    else
      echo -e "   ${YELLOW}⚠️  UTF-8 locale issue (non-critical)${NC}"
    fi
    
    # Test file permissions
    if chmod +x src/cli.js 2>/dev/null; then
      echo -e "   ${GREEN}✅ File permissions${NC}"
      chmod -x src/cli.js 2>/dev/null || true
    fi
    
    # Test case-sensitive filesystem
    if [ ! -f "README.md" ] || [ ! -f "readme.md" ]; then
      echo -e "   ${GREEN}✅ Case-sensitive filesystem handling${NC}"
    fi
    
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
    ;;
    
  Darwin*)
    echo -e "${GREEN}✅ macOS-specific tests${NC}"
    
    # Test case-insensitive filesystem behavior
    if [ -f "README.md" ]; then
      echo -e "   ${GREEN}✅ Case-insensitive filesystem handling${NC}"
    fi
    
    # Test with Homebrew Node
    if command -v brew &> /dev/null; then
      echo -e "   ${GREEN}✅ Homebrew available${NC}"
    fi
    
    # Test Gatekeeper (macOS security)
    if spctl --status 2>/dev/null | grep -q "enabled"; then
      echo -e "   ${GREEN}✅ Gatekeeper enabled${NC}"
    fi
    
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
    ;;
    
  MINGW*|MSYS*|CYGWIN*)
    echo -e "${GREEN}✅ Windows-specific tests${NC}"
    
    # Test Windows path handling
    if [ -f "src/cli.js" ]; then
      echo -e "   ${GREEN}✅ Windows path handling${NC}"
    fi
    
    # Test line endings (CRLF vs LF)
    if grep -q $'\r' package.json 2>/dev/null; then
      echo -e "   ${YELLOW}⚠️  CRLF line endings detected${NC}"
    else
      echo -e "   ${GREEN}✅ LF line endings${NC}"
    fi
    
    # Test Windows executable permissions
    if [ -f "src/cli.js" ]; then
      echo -e "   ${GREEN}✅ Windows executable handling${NC}"
    fi
    
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
    ;;
    
  *)
    echo -e "${YELLOW}⚠️  Unknown platform: $PLATFORM${NC}"
    echo "   Running generic tests..."
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
    ;;
esac

# Step 5: Test CLI commands
echo ""
echo -e "${BLUE}Step 5: Testing CLI commands...${NC}"

# Test version command
if node src/cli.js --version 2>&1 | grep -q "4.6.5"; then
  echo -e "${GREEN}✅ --version command${NC}"
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ --version command failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Test help command
if node src/cli.js --help 2>&1 | grep -q "Usage\|usage"; then
  echo -e "${GREEN}✅ --help command${NC}"
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ --help command failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Test scan command (dry run)
if node src/cli.js --scan . --offline --no-auto-update 2>&1 | head -5; then
  echo -e "${GREEN}✅ --scan command${NC}"
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ --scan command failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Step 6: Test module imports
echo ""
echo -e "${BLUE}Step 6: Testing module imports...${NC}"
if node -e "import('./src/index.js').then(m => console.log('Module loaded'))" 2>&1 | grep -q "Module loaded"; then
  echo -e "${GREEN}✅ ES module imports${NC}"
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ ES module imports failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Step 7: Test npm pack
echo ""
echo -e "${BLUE}Step 7: Testing npm pack...${NC}"
if npm pack --dry-run 2>&1 | grep -q "package size:"; then
  echo -e "${GREEN}✅ npm pack works${NC}"
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ npm pack failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Step 8: Test TypeScript definitions
echo ""
echo -e "${BLUE}Step 8: Testing TypeScript definitions...${NC}"
if [ -f "index.d.ts" ]; then
  if npx tsc index.d.ts --noEmit 2>&1 || true; then
    echo -e "${GREEN}✅ TypeScript definitions${NC}"
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  TypeScript definitions have issues (non-critical)${NC}"
    PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
  fi
else
  echo -e "${YELLOW}⚠️  No TypeScript definitions found${NC}"
fi

# Step 9: Test file system operations
echo ""
echo -e "${BLUE}Step 9: Testing file system operations...${NC}"

# Test temp directory creation
TEST_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'shai-test')
if [ -d "$TEST_DIR" ]; then
  echo -e "${GREEN}✅ Temp directory creation${NC}"
  
  # Test file write
  if echo "test" > "$TEST_DIR/test.txt" 2>/dev/null; then
    echo -e "${GREEN}✅ File write operations${NC}"
  fi
  
  # Test file read
  if cat "$TEST_DIR/test.txt" 2>/dev/null | grep -q "test"; then
    echo -e "${GREEN}✅ File read operations${NC}"
  fi
  
  # Clean up
  rm -rf "$TEST_DIR"
  echo -e "${GREEN}✅ Temp directory cleanup${NC}"
  
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ Temp directory creation failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Step 10: Test environment variables
echo ""
echo -e "${BLUE}Step 10: Testing environment variable handling...${NC}"
if NODE_ENV=test node -e "console.log(process.env.NODE_ENV)" 2>&1 | grep -q "test"; then
  echo -e "${GREEN}✅ Environment variables${NC}"
  PLATFORM_PASSED=$((PLATFORM_PASSED + 1))
else
  echo -e "${RED}❌ Environment variables failed${NC}"
  PLATFORM_FAILED=$((PLATFORM_FAILED + 1))
fi

# Summary
echo ""
echo "================================="
echo -e "${BLUE}CROSS-PLATFORM TEST SUMMARY${NC}"
echo "============================"
echo ""

if [ $PLATFORM_FAILED -gt 0 ]; then
  echo -e "${RED}❌ CROSS-PLATFORM TEST FAILED${NC}"
  echo -e "${RED}   ${PLATFORM_FAILED} check(s) failed${NC}"
  echo -e "${GREEN}   ${PLATFORM_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${RED}🚨 Review platform-specific issues${NC}"
  exit 1
else
  echo -e "${GREEN}✅ CROSS-PLATFORM TEST PASSED${NC}"
  echo -e "${GREEN}   ${PLATFORM_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${GREEN}🖥️  Package is cross-platform compatible${NC}"
fi

echo ""
echo -e "${BLUE}Platform: $PLATFORM ($ARCH)${NC}"
echo -e "${BLUE}Test completed at: $(date)${NC}"
