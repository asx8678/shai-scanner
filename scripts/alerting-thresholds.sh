#!/bin/bash
set -e

echo "🚨 Automated Alerting Thresholds..."
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ALERTS_CRITICAL=0
ALERTS_WARNING=0
CHECKS_PASSED=0

# Helper functions
alert_critical() {
  echo -e "${RED}❌ CRITICAL: $1${NC}"
  ALERTS_CRITICAL=$((ALERTS_CRITICAL + 1))
}

alert_warning() {
  echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
  ALERTS_WARNING=$((ALERTS_WARNING + 1))
}

check_passed() {
  echo -e "${GREEN}✅ $1${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

# Load previous baseline if exists
echo ""
echo -e "${BLUE}Loading baseline data...${NC}"
BASELINE_FILE=$(ls -t performance-baseline-*.md 2>/dev/null | head -1 || echo "")
if [ -n "$BASELINE_FILE" ]; then
  echo -e "${GREEN}✅ Found baseline: ${BASELINE_FILE}${NC}"
  PREV_SIZE=$(grep "Package Size:" "$BASELINE_FILE" | awk '{print $3}' | sed 's/ kB//')
  PREV_COLD_START=$(grep "Cold Start Time:" "$BASELINE_FILE" | awk '{print $3}' | sed 's/ms//')
  PREV_MEMORY=$(grep "Memory Usage:" "$BASELINE_FILE" | awk '{print $3}' | sed 's/KB//')
else
  echo -e "${YELLOW}⚠️  No previous baseline found${NC}"
  PREV_SIZE="0"
  PREV_COLD_START="0"
  PREV_MEMORY="0"
fi

# Step 1: Package size alerting
echo ""
echo -e "${BLUE}Step 1: Package size threshold check...${NC}"
CURRENT_SIZE=$(npm pack --dry-run 2>&1 | grep "package size:" | awk '{print $4}' | sed 's/ kB//')

if [ -n "$CURRENT_SIZE" ]; then
  echo "   Current size: ${CURRENT_SIZE} kB"
  echo "   Threshold: 200 kB"
  
  # Check absolute threshold
  if [ $(echo "$CURRENT_SIZE > 200" | bc -l 2>/dev/null || echo "0") -eq 1 ]; then
    alert_critical "Package size ${CURRENT_SIZE} kB exceeds 200 kB limit"
  else
    check_passed "Package size ${CURRENT_SIZE} kB within limit"
  fi
  
  # Check relative threshold (20% increase)
  if [ "$PREV_SIZE" != "0" ] && [ -n "$PREV_SIZE" ]; then
    THRESHOLD=$(echo "$PREV_SIZE * 1.2" | bc -l 2>/dev/null || echo "0")
    if [ $(echo "$CURRENT_SIZE > $THRESHOLD" | bc -l 2>/dev/null || echo "0") -eq 1 ]; then
      alert_warning "Package size increased by more than 20% (was ${PREV_SIZE} kB)"
    fi
  fi
else
  alert_warning "Could not determine package size"
fi

# Step 2: Test failure alerting
echo ""
echo -e "${BLUE}Step 2: Test failure threshold...${NC}"
TEST_OUTPUT=$(npm test 2>&1)
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ] || echo "$TEST_OUTPUT" | grep -q "FAIL\|Error\|error"; then
  alert_critical "Test failures detected - BLOCKING PUBLISH"
  echo "   Test output (last 10 lines):"
  echo "$TEST_OUTPUT" | tail -10 | sed 's/^/   /'
else
  check_passed "All tests passing"
fi

# Step 3: Security vulnerability alerting
echo ""
echo -e "${BLUE}Step 3: Security vulnerability threshold...${NC}"
AUDIT_JSON=$(npm audit --json 2>/dev/null || echo '{}')

# Count vulnerabilities by severity
CRITICAL_VULNS=$(echo "$AUDIT_JSON" | grep -o '"critical":[0-9]*' | cut -d: -f2 || echo "0")
HIGH_VULNS=$(echo "$AUDIT_JSON" | grep -o '"high":[0-9]*' | cut -d: -f2 || echo "0")
MODERATE_VULNS=$(echo "$AUDIT_JSON" | grep -o '"moderate":[0-9]*' | cut -d: -f2 || echo "0")
LOW_VULNS=$(echo "$AUDIT_JSON" | grep -o '"low":[0-9]*' | cut -d: -f2 || echo "0")

echo "   Critical: ${CRITICAL_VULNS:-0}"
echo "   High: ${HIGH_VULNS:-0}"
echo "   Moderate: ${MODERATE_VULNS:-0}"
echo "   Low: ${LOW_VULNS:-0}"

if [ "${CRITICAL_VULNS:-0}" -gt 0 ]; then
  alert_critical "Critical vulnerabilities found - BLOCKING PUBLISH"
fi

if [ "${HIGH_VULNS:-0}" -gt 0 ]; then
  alert_critical "High severity vulnerabilities found - BLOCKING PUBLISH"
fi

if [ "${MODERATE_VULNS:-0}" -gt 0 ]; then
  alert_warning "Moderate vulnerabilities found - review recommended"
fi

if [ "${CRITICAL_VULNS:-0}" -eq 0 ] && [ "${HIGH_VULNS:-0}" -eq 0 ]; then
  check_passed "No critical or high severity vulnerabilities"
fi

# Step 4: Cold start time alerting
echo ""
echo -e "${BLUE}Step 4: Cold start time threshold...${NC}"
START_TIME=$(date +%s%N)
node -e "require('./src/index.js')" > /dev/null 2>&1
END_TIME=$(date +%s%N)
COLD_START_MS=$(( (END_TIME - START_TIME) / 1000000 ))

echo "   Current: ${COLD_START_MS}ms"
echo "   Threshold: 1000ms"

if [ "$COLD_START_MS" -gt 1000 ]; then
  alert_warning "Cold start time ${COLD_START_MS}ms exceeds 1000ms threshold"
elif [ "$COLD_START_MS" -gt 500 ]; then
  echo -e "${YELLOW}⚠️  INFO: Cold start time ${COLD_START_MS}ms is above optimal (500ms)${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  check_passed "Cold start time ${COLD_START_MS}ms within threshold"
fi

# Step 5: Memory usage alerting
echo ""
echo -e "${BLUE}Step 5: Memory usage threshold...${NC}"
MEMORY_KB=$(node -e "
const used = process.memoryUsage();
console.log(Math.round(used.heapUsed / 1024));
" 2>/dev/null)

echo "   Current: ${MEMORY_KB}KB"
echo "   Threshold: 204800KB (200MB)"

if [ "$MEMORY_KB" -gt 204800 ]; then
  alert_warning "Memory usage ${MEMORY_KB}KB exceeds 200MB threshold"
elif [ "$MEMORY_KB" -gt 102400 ]; then
  echo -e "${YELLOW}⚠️  INFO: Memory usage ${MEMORY_KB}KB is above optimal (100MB)${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  check_passed "Memory usage ${MEMORY_KB}KB within threshold"
fi

# Step 6: Test execution time alerting
echo ""
echo -e "${BLUE}Step 6: Test execution time threshold...${NC}"
TEST_START=$(date +%s)
npm test > /dev/null 2>&1 || true
TEST_END=$(date +%s)
TEST_DURATION=$((TEST_END - TEST_START))

echo "   Current: ${TEST_DURATION}s"
echo "   Threshold: 120s"

if [ "$TEST_DURATION" -gt 120 ]; then
  alert_warning "Test execution time ${TEST_DURATION}s exceeds 120s threshold"
elif [ "$TEST_DURATION" -gt 60 ]; then
  echo -e "${YELLOW}⚠️  INFO: Test execution time ${TEST_DURATION}s is above optimal (60s)${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  check_passed "Test execution time ${TEST_DURATION}s within threshold"
fi

# Step 7: File count alerting
echo ""
echo -e "${BLUE}Step 7: File count threshold...${NC}"
FILE_COUNT=$(npm pack --dry-run 2>&1 | grep "total files:" | awk '{print $3}')

echo "   Current: ${FILE_COUNT}"
echo "   Threshold: 100 files"

if [ "${FILE_COUNT:-0}" -gt 100 ]; then
  alert_warning "File count ${FILE_COUNT} exceeds 100 files - consider optimization"
else
  check_passed "File count ${FILE_COUNT} within threshold"
fi

# Step 8: Dependency count alerting
echo ""
echo -e "${BLUE}Step 8: Dependency count threshold...${NC}"
DEP_COUNT=$(node -p "Object.keys(require('./package.json').dependencies || {}).length" 2>/dev/null || echo "0")
DEV_DEP_COUNT=$(node -p "Object.keys(require('./package.json').devDependencies || {}).length" 2>/dev/null || echo "0")

echo "   Runtime dependencies: ${DEP_COUNT}"
echo "   Dev dependencies: ${DEV_DEP_COUNT}"
echo "   Runtime threshold: 0 (zero-dependency goal)"

if [ "${DEP_COUNT:-0}" -gt 0 ]; then
  alert_warning "Runtime dependencies detected (${DEP_COUNT}) - zero-dependency goal"
else
  check_passed "Zero runtime dependencies (goal achieved)"
fi

# Step 9: Version consistency alerting
echo ""
echo -e "${BLUE}Step 9: Version consistency threshold...${NC}"
LOCAL_VERSION=$(node -p "require('./package.json').version")
NPM_VERSION=$(npm view shai-scanner version 2>/dev/null || echo "not published")

echo "   Local version: ${LOCAL_VERSION}"
echo "   npm version: ${NPM_VERSION}"

if [ "$LOCAL_VERSION" = "$NPM_VERSION" ]; then
  alert_warning "Version ${LOCAL_VERSION} already published - bump version"
else
  check_passed "Version ${LOCAL_VERSION} available for publishing"
fi

# Step 10: Git status alerting
echo ""
echo -e "${BLUE}Step 10: Git status threshold...${NC}"
GIT_STATUS=$(git status --porcelain 2>/dev/null | wc -l)

echo "   Uncommitted changes: ${GIT_STATUS}"
echo "   Threshold: 0 (clean working directory)"

if [ "${GIT_STATUS:-0}" -gt 0 ]; then
  alert_warning "Git has ${GIT_STATUS} uncommitted changes - commit before publishing"
else
  check_passed "Git working directory clean"
fi

# Summary
echo ""
echo "================================="
echo -e "${BLUE}ALERTING THRESHOLDS SUMMARY${NC}"
echo "============================"
echo ""

if [ $ALERTS_CRITICAL -gt 0 ]; then
  echo -e "${RED}🚨 CRITICAL ALERTS: ${ALERTS_CRITICAL}${NC}"
  echo -e "${RED}   BLOCKING PUBLISH - Resolve critical issues first${NC}"
  echo ""
  echo -e "${RED}🚨 PUBLISH BLOCKED${NC}"
  exit 1
elif [ $ALERTS_WARNING -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNINGS: ${ALERTS_WARNING}${NC}"
  echo -e "${YELLOW}   Review warnings before publishing${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  PROCEED WITH CAUTION${NC}"
else
  echo -e "${GREEN}✅ ALL THRESHOLDS WITHIN LIMITS${NC}"
  echo -e "${GREEN}   ${CHECKS_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${GREEN}🛡️  Safe to proceed with publishing${NC}"
fi

echo ""
echo -e "${BLUE}Alerting check completed at: $(date)${NC}"
