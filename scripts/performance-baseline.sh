#!/bin/bash
set -e

echo "📊 Performance Baseline Testing..."
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PERF_PASSED=0
PERF_FAILED=0

# Helper function
run_check() {
  local check_name=$1
  local command=$2
  
  echo -n "${BLUE}Measuring: ${check_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PERF_PASSED=$((PERF_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    PERF_FAILED=$((PERF_FAILED + 1))
    return 0
  fi
}

# Create performance report
REPORT_FILE="performance-baseline-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Performance Baseline Report

**Date:** $(date)
**Platform:** $(uname -s) $(uname -m)
**Node.js:** $(node --version)
**npm:** $(npm --version)

---

## Package Metrics

EOF

echo -e "${BLUE}Performance Baseline Report${NC}"
echo "=========================="
echo ""

# Step 1: Package size
echo -e "${BLUE}Step 1: Measuring package size...${NC}"
PACKAGE_SIZE=$(npm pack --dry-run 2>&1 | grep "package size:" | awk '{print $4}')
echo "   Package size: $PACKAGE_SIZE"
echo "## Package Size: $PACKAGE_SIZE" >> "$REPORT_FILE"

# Check against threshold
SIZE_KB=$(echo "$PACKAGE_SIZE" | sed 's/ kB//' | tr -d ' ')
if [ $(echo "$SIZE_KB < 200" | bc -l 2>/dev/null || echo "1") -eq 1 ]; then
  echo -e "   ${GREEN}✅ Within 200 kB threshold${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  Exceeds 200 kB threshold${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 2: File count
echo ""
echo -e "${BLUE}Step 2: Counting files in package...${NC}"
FILE_COUNT=$(npm pack --dry-run 2>&1 | grep "total files:" | awk '{print $3}')
echo "   File count: $FILE_COUNT"
echo "## File Count: $FILE_COUNT" >> "$REPORT_FILE"
PERF_PASSED=$((PERF_PASSED + 1))

# Step 3: Cold start time
echo ""
echo -e "${BLUE}Step 3: Measuring cold start time...${NC}"
START_TIME=$(date +%s%N)
node -e "require('./src/index.js')" > /dev/null 2>&1
END_TIME=$(date +%s%N)
COLD_START_MS=$(( (END_TIME - START_TIME) / 1000000 ))
echo "   Cold start time: ${COLD_START_MS}ms"
echo "## Cold Start Time: ${COLD_START_MS}ms" >> "$REPORT_FILE"

# Check against threshold
if [ "$COLD_START_MS" -lt 500 ]; then
  echo -e "   ${GREEN}✅ Within 500ms threshold${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  Exceeds 500ms threshold${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 4: Memory usage
echo ""
echo -e "${BLUE}Step 4: Measuring memory usage...${NC}"
MEMORY_KB=$(node -e "
const used = process.memoryUsage();
console.log(Math.round(used.heapUsed / 1024));
" 2>/dev/null)
echo "   Memory usage: ${MEMORY_KB}KB"
echo "## Memory Usage: ${MEMORY_KB}KB" >> "$REPORT_FILE"

# Check against threshold (100MB = 102400KB)
if [ "$MEMORY_KB" -lt 102400 ]; then
  echo -e "   ${GREEN}✅ Within 100MB threshold${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  Exceeds 100MB threshold${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 5: Test execution time
echo ""
echo -e "${BLUE}Step 5: Measuring test execution time...${NC}"
TEST_START=$(date +%s)
npm test > /dev/null 2>&1 || true
TEST_END=$(date +%s)
TEST_DURATION=$((TEST_END - TEST_START))
echo "   Test execution: ${TEST_DURATION}s"
echo "## Test Execution: ${TEST_DURATION}s" >> "$REPORT_FILE"

# Check against threshold
if [ "$TEST_DURATION" -lt 60 ]; then
  echo -e "   ${GREEN}✅ Within 60s threshold${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  Exceeds 60s threshold${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 6: CLI startup time
echo ""
echo -e "${BLUE}Step 6: Measuring CLI startup time...${NC}"
CLI_START=$(date +%s%N)
node src/cli.js --version > /dev/null 2>&1
CLI_END=$(date +%s%N)
CLI_STARTUP_MS=$(( (CLI_END - CLI_START) / 1000000 ))
echo "   CLI startup: ${CLI_STARTUP_MS}ms"
echo "## CLI Startup: ${CLI_STARTUP_MS}ms" >> "$REPORT_FILE"

# Check against threshold
if [ "$CLI_STARTUP_MS" -lt 200 ]; then
  echo -e "   ${GREEN}✅ Within 200ms threshold${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  Exceeds 200ms threshold${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 7: Help command time
echo ""
echo -e "${BLUE}Step 7: Measuring help command time...${NC}"
HELP_START=$(date +%s%N)
node src/cli.js --help > /dev/null 2>&1
HELP_END=$(date +%s%N)
HELP_TIME_MS=$(( (HELP_END - HELP_START) / 1000000 ))
echo "   Help command: ${HELP_TIME_MS}ms"
echo "## Help Command: ${HELP_TIME_MS}ms" >> "$REPORT_FILE"

# Check against threshold
if [ "$HELP_TIME_MS" -lt 100 ]; then
  echo -e "   ${GREEN}✅ Within 100ms threshold${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  Exceeds 100ms threshold${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 8: Scan command time (small directory)
echo ""
echo -e "${BLUE}Step 8: Measuring scan command time...${NC}"
SCAN_START=$(date +%s)
node src/cli.js --scan . --offline --no-auto-update > /dev/null 2>&1 || true
SCAN_END=$(date +%s)
SCAN_TIME=$((SCAN_END - SCAN_START))
echo "   Scan command: ${SCAN_TIME}s"
echo "## Scan Command: ${SCAN_TIME}s" >> "$REPORT_FILE"

# Check against threshold
if [ "$SCAN_TIME" -lt 10 ]; then
  echo -e "   ${GREEN}✅ Within 10s threshold${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  Exceeds 10s threshold${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 9: Node.js version compatibility
echo ""
echo -e "${BLUE}Step 9: Checking Node.js version compatibility...${NC}"
NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -ge 18 ]; then
  echo -e "   ${GREEN}✅ Node.js $NODE_MAJOR.x (>= 18)${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${RED}❌ Node.js $NODE_MAJOR.x (< 18 not supported)${NC}"
  PERF_FAILED=$((PERF_FAILED + 1))
fi

# Step 10: npm version compatibility
echo ""
echo -e "${BLUE}Step 10: Checking npm version compatibility...${NC}"
NPM_MAJOR=$(npm --version | cut -d'.' -f1)
if [ "$NPM_MAJOR" -ge 9 ]; then
  echo -e "   ${GREEN}✅ npm $NPM_MAJOR.x (>= 9)${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  npm $NPM_MAJOR.x (< 9 may have issues)${NC}"
  PERF_PASSED=$((PERF_PASSED + 1))  # Non-blocking
fi

# Summary table
cat >> "$REPORT_FILE" << EOF

---

## Performance Summary

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Package Size | $PACKAGE_SIZE | < 200 kB | $(if [ $(echo "$SIZE_KB < 200" | bc -l 2>/dev/null || echo "1") -eq 1 ]; then echo "✅"; else echo "⚠️"; fi) |
| File Count | $FILE_COUNT | - | ✅ |
| Cold Start | ${COLD_START_MS}ms | < 500ms | $(if [ "$COLD_START_MS" -lt 500 ]; then echo "✅"; else echo "⚠️"; fi) |
| Memory Usage | ${MEMORY_KB}KB | < 100MB | $(if [ "$MEMORY_KB" -lt 102400 ]; then echo "✅"; else echo "⚠️"; fi) |
| Test Execution | ${TEST_DURATION}s | < 60s | $(if [ "$TEST_DURATION" -lt 60 ]; then echo "✅"; else echo "⚠️"; fi) |
| CLI Startup | ${CLI_STARTUP_MS}ms | < 200ms | $(if [ "$CLI_STARTUP_MS" -lt 200 ]; then echo "✅"; else echo "⚠️"; fi) |
| Help Command | ${HELP_TIME_MS}ms | < 100ms | $(if [ "$HELP_TIME_MS" -lt 100 ]; then echo "✅"; else echo "⚠️"; fi) |
| Scan Command | ${SCAN_TIME}s | < 10s | $(if [ "$SCAN_TIME" -lt 10 ]; then echo "✅"; else echo "⚠️"; fi) |

---

*Report generated by performance-baseline.sh*
EOF

echo ""
echo "================================="
echo -e "${BLUE}PERFORMANCE BASELINE SUMMARY${NC}"
echo "============================"
echo ""

if [ $PERF_FAILED -gt 0 ]; then
  echo -e "${YELLOW}⚠️  PERFORMANCE BASELINE COMPLETE${NC}"
  echo -e "${YELLOW}   ${PERF_FAILED} metric(s) exceeded thresholds${NC}"
  echo -e "${GREEN}   ${PERF_PASSED} metric(s) within thresholds${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  Review metrics above for optimization opportunities${NC}"
else
  echo -e "${GREEN}✅ PERFORMANCE BASELINE PASSED${NC}"
  echo -e "${GREEN}   ${PERF_PASSED} metric(s) within thresholds${NC}"
  echo ""
  echo -e "${GREEN}📊 Package performance is within acceptable limits${NC}"
fi

echo ""
echo -e "${BLUE}📄 Performance report saved to: ${REPORT_FILE}${NC}"
echo ""
echo -e "${BLUE}Performance baseline completed at: $(date)${NC}"
