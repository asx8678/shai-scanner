#!/bin/bash
set -e

echo "📦 Verifying Tarball Contents..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
VERIFY_PASSED=0
VERIFY_FAILED=0

# Helper function
run_check() {
  local check_name=$1
  local command=$2
  
  echo -n "${BLUE}Checking: ${check_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    VERIFY_PASSED=$((VERIFY_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    VERIFY_FAILED=$((VERIFY_FAILED + 1))
    return 0
  fi
}

# Step 1: Create tarball
echo ""
echo -e "${BLUE}Step 1: Creating tarball...${NC}"
TARBALL=$(npm pack 2>&1 | tail -1)
if [ -f "$TARBALL" ]; then
  echo -e "${GREEN}✅ Created: ${TARBALL}${NC}"
  VERIFY_PASSED=$((VERIFY_PASSED + 1))
else
  echo -e "${RED}❌ Failed to create tarball${NC}"
  exit 1
fi

# Step 2: List contents
echo ""
echo -e "${BLUE}Step 2: Listing tarball contents...${NC}"
echo "   First 20 files:"
tar -tzf "$TARBALL" | head -20 | sed 's/^/   /'
TOTAL_FILES=$(tar -tzf "$TARBALL" | wc -l)
echo "   ... and $((TOTAL_FILES - 20)) more files"
echo -e "${GREEN}✅ Tarball contains ${TOTAL_FILES} files${NC}"
VERIFY_PASSED=$((VERIFY_PASSED + 1))

# Step 3: Check for sensitive files
echo ""
echo -e "${BLUE}Step 3: Checking for sensitive files...${NC}"
SENSITIVE_EXTENSIONS=(
  "\.env$"
  "\.env\."
  "\.key$"
  "\.pem$"
  "\.token$"
  "\.secret$"
  "\.credentials$"
  "\.p12$"
  "\.pfx$"
  "\.jks$"
)

SENSITIVE_FOUND=false
for ext in "${SENSITIVE_EXTENSIONS[@]}"; do
  if tar -tzf "$TARBALL" | grep -iE "$ext" 2>/dev/null; then
    echo -e "${RED}❌ Sensitive file found: $(tar -tzf "$TARBALL" | grep -iE "$ext")${NC}"
    SENSITIVE_FOUND=true
  fi
done

if [ "$SENSITIVE_FOUND" = false ]; then
  echo -e "${GREEN}✅ No sensitive files detected${NC}"
  VERIFY_PASSED=$((VERIFY_PASSED + 1))
else
  echo -e "${RED}❌ Sensitive files found in tarball!${NC}"
  VERIFY_FAILED=$((VERIFY_FAILED + 1))
fi

# Step 4: Check for node_modules
echo ""
echo -e "${BLUE}Step 4: Checking for node_modules in tarball...${NC}"
if tar -tzf "$TARBALL" | grep -q "node_modules"; then
  echo -e "${RED}❌ node_modules found in tarball!${NC}"
  echo "   This is not allowed in published packages"
  VERIFY_FAILED=$((VERIFY_FAILED + 1))
else
  echo -e "${GREEN}✅ No node_modules in tarball${NC}"
  VERIFY_PASSED=$((VERIFY_PASSED + 1))
fi

# Step 5: Check for test files
echo ""
echo -e "${BLUE}Step 5: Checking for test files in tarball...${NC}"
TEST_FILES=$(tar -tzf "$TARBALL" | grep -E "test/|tests/|__tests__/|\.test\.|\.spec\." || echo "")
if [ -n "$TEST_FILES" ]; then
  echo -e "${YELLOW}⚠️  Test files found in tarball:${NC}"
  echo "$TEST_FILES" | head -5 | sed 's/^/   /'
  echo "   (This is OK if tests are included intentionally)"
  VERIFY_PASSED=$((VERIFY_PASSED + 1))
else
  echo -e "${GREEN}✅ No test files in tarball${NC}"
  VERIFY_PASSED=$((VERIFY_PASSED + 1))
fi

# Step 6: Verify expected files
echo ""
echo -e "${BLUE}Step 6: Checking for expected files...${NC}"
EXPECTED_FILES=(
  "package/package.json"
  "package/README.md"
  "package/LICENSE"
  "package/src/cli.js"
  "package/src/index.js"
  "package/index.d.ts"
)

ALL_EXPECTED=true
for file in "${EXPECTED_FILES[@]}"; do
  if tar -tzf "$TARBALL" | grep -q "^$file$"; then
    echo -e "   ${GREEN}✅ $file${NC}"
  else
    echo -e "   ${RED}❌ $file (missing)${NC}"
    ALL_EXPECTED=false
  fi
done

if [ "$ALL_EXPECTED" = true ]; then
  echo -e "${GREEN}✅ All expected files present${NC}"
  VERIFY_PASSED=$((VERIFY_PASSED + 1))
else
  echo -e "${RED}❌ Some expected files missing${NC}"
  VERIFY_FAILED=$((VERIFY_FAILED + 1))
fi

# Step 7: Check package.json in tarball
echo ""
echo -e "${BLUE}Step 7: Verifying package.json in tarball...${NC}"
if tar -tzf "$TARBALL" | grep -q "package/package.json"; then
  # Extract and check package.json
  tar -xzf "$TARBALL" -C /tmp package/package.json 2>/dev/null
  if node -e "const pkg = require('/tmp/package/package.json'); 
    const required = ['name', 'version', 'main', 'bin'];
    const missing = required.filter(field => !pkg[field]);
    if (missing.length > 0) {
      console.error('Missing:', missing.join(', '));
      process.exit(1);
    }
    console.log('Valid package.json');
  " 2>/dev/null; then
    echo -e "${GREEN}✅ package.json is valid${NC}"
    VERIFY_PASSED=$((VERIFY_PASSED + 1))
  else
    echo -e "${RED}❌ package.json validation failed${NC}"
    VERIFY_FAILED=$((VERIFY_FAILED + 1))
  fi
  rm -f /tmp/package/package.json
  rmdir /tmp/package 2>/dev/null || true
else
  echo -e "${RED}❌ package.json not found in tarball${NC}"
  VERIFY_FAILED=$((VERIFY_FAILED + 1))
fi

# Step 8: Check file permissions
echo ""
echo -e "${BLUE}Step 8: Checking file permissions...${NC}"
EXECUTABLE_FILES=$(tar -tzf "$TARBALL" | while read file; do
  tar -xzf "$TARBALL" -C /tmp "$file" --to-stdout 2>/dev/null | head -c 2 | xxd | grep -q "2321" && echo "$file" || true
done 2>/dev/null || echo "")

if [ -n "$EXECUTABLE_FILES" ]; then
  echo -e "${GREEN}✅ Executable files found:${NC}"
  echo "$EXECUTABLE_FILES" | head -5 | sed 's/^/   /'
else
  echo -e "${YELLOW}⚠️  No executable files detected (normal for JS packages)${NC}"
fi
VERIFY_PASSED=$((VERIFY_PASSED + 1))

# Step 9: Calculate package size
echo ""
echo -e "${BLUE}Step 9: Calculating package size...${NC}"
TARBALL_SIZE=$(du -h "$TARBALL" | cut -f1)
UNPACKED_SIZE=$(tar -xzf "$TARBALL" -C /tmp 2>/dev/null && du -sh /tmp/package 2>/dev/null | cut -f1 && rm -rf /tmp/package 2>/dev/null)
echo "   Tarball size: ${TARBALL_SIZE}"
echo "   Unpacked size: ${UNPACKED_SIZE:-unknown}"
VERIFY_PASSED=$((VERIFY_PASSED + 1))

# Step 10: Check for binary files
echo ""
echo -e "${BLUE}Step 10: Checking for unexpected binary files...${NC}"
BINARY_FILES=$(tar -tzf "$TARBALL" | grep -E "\.(exe|dll|so|dylib|bin|dat)$" || echo "")
if [ -n "$BINARY_FILES" ]; then
  echo -e "${YELLOW}⚠️  Binary files found:${NC}"
  echo "$BINARY_FILES" | head -5 | sed 's/^/   /'
  echo "   (Review if these are expected)"
else
  echo -e "${GREEN}✅ No unexpected binary files${NC}"
fi
VERIFY_PASSED=$((VERIFY_PASSED + 1))

# Clean up
echo ""
echo -e "${BLUE}Cleaning up...${NC}"
rm -f "$TARBALL"
echo -e "${GREEN}✅ Removed ${TARBALL}${NC}"

# Summary
echo ""
echo "================================="
echo -e "${BLUE}TARBALL VERIFICATION SUMMARY${NC}"
echo "============================"
echo ""

if [ $VERIFY_FAILED -gt 0 ]; then
  echo -e "${RED}❌ TARBALL VERIFICATION FAILED${NC}"
  echo -e "${RED}   ${VERIFY_FAILED} check(s) failed${NC}"
  echo -e "${GREEN}   ${VERIFY_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${RED}🚨 Review issues before publishing${NC}"
  exit 1
else
  echo -e "${GREEN}✅ TARBALL VERIFICATION PASSED${NC}"
  echo -e "${GREEN}   ${VERIFY_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${GREEN}📦 Tarball is ready for publishing${NC}"
fi

echo ""
echo -e "${BLUE}Verification completed at: $(date)${NC}"
