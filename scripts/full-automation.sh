#!/bin/bash
set -e

echo "🤖 Full Automation Pipeline..."
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from argument or package.json
VERSION=${1:-$(node -p "require('./package.json').version")}

echo -e "${BLUE}Version: ${VERSION}${NC}"
echo ""

# Counters
PHASES_PASSED=0
PHASES_FAILED=0

# Helper function
run_phase() {
  local phase_name=$1
  local script=$2
  
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Phase: ${phase_name}${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo ""
  
  if [ -f "./scripts/$script" ]; then
    if ./scripts/$script 2>&1; then
      echo ""
      echo -e "${GREEN}✅ ${phase_name} completed successfully${NC}"
      PHASES_PASSED=$((PHASES_PASSED + 1))
      return 0
    else
      echo ""
      echo -e "${RED}❌ ${phase_name} failed${NC}"
      PHASES_FAILED=$((PHASES_FAILED + 1))
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  Script not found: ./scripts/${script}${NC}"
    echo "   Skipping..."
    return 0
  fi
}

# Start time
START_TIME=$(date +%s)

echo "Pipeline started at: $(date)"
echo ""

# Phase 1: Security Audit
run_phase "Security Audit" "security-audit.sh"
if [ $? -ne 0 ]; then
  echo -e "${RED}🚨 Security audit failed. Aborting pipeline.${NC}"
  exit 1
fi

# Phase 2: Comprehensive Validation
run_phase "Comprehensive Validation" "validate-all.sh"
if [ $? -ne 0 ]; then
  echo -e "${RED}🚨 Validation failed. Aborting pipeline.${NC}"
  exit 1
fi

# Phase 3: Tarball Verification
run_phase "Tarball Verification" "verify-tarball.sh"
if [ $? -ne 0 ]; then
  echo -e "${RED}🚨 Tarball verification failed. Aborting pipeline.${NC}"
  exit 1
fi

# Phase 4: TypeScript Verification (non-blocking)
run_phase "TypeScript Verification" "verify-typescript.sh" || true
# Non-blocking, continue

# Phase 5: Cross-Platform Testing
run_phase "Cross-Platform Testing" "cross-platform-test.sh"
# Non-blocking, continue

# Phase 6: Performance Baseline
run_phase "Performance Baseline" "performance-baseline.sh"
# Non-blocking, continue

# Phase 7: Alerting Thresholds
run_phase "Alerting Thresholds" "alerting-thresholds.sh"
if [ $? -ne 0 ]; then
  echo -e "${RED}🚨 Alerting thresholds check failed. Aborting pipeline.${NC}"
  exit 1
fi

# Phase 8: Rollback Dry-Run
run_phase "Rollback Dry-Run" "rollback-dry-run.sh"
# Non-blocking, continue

# Phase 9: NPM Publish Test
run_phase "NPM Publish Test" "test-npm-publish.sh"
if [ $? -ne 0 ]; then
  echo -e "${RED}🚨 NPM publish test failed. Aborting pipeline.${NC}"
  exit 1
fi

# Phase 10: Script Testing
run_phase "Script Testing" "test-all-scripts.sh"
# Non-blocking, continue

# End time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Summary
echo ""
echo "================================="
echo -e "${BLUE}FULL AUTOMATION PIPELINE SUMMARY${NC}"
echo "==============================="
echo ""

echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Duration: ${DURATION} seconds${NC}"
echo ""

if [ $PHASES_FAILED -gt 0 ]; then
  echo -e "${RED}❌ PIPELINE FAILED${NC}"
  echo -e "${RED}   ${PHASES_FAILED} phase(s) failed${NC}"
  echo -e "${GREEN}   ${PHASES_PASSED} phase(s) passed${NC}"
  echo ""
  echo -e "${RED}🚨 Review failures before publishing${NC}"
  exit 1
else
  echo -e "${GREEN}✅ PIPELINE PASSED${NC}"
  echo -e "${GREEN}   ${PHASES_PASSED} phase(s) passed${NC}"
  echo ""
  echo -e "${GREEN}🚀 Ready to publish version ${VERSION}${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "   1. Set NPM_TOKEN: ./scripts/setup-npm-token.sh YOUR_TOKEN"
  echo "   2. Publish: ./scripts/publish.sh ${VERSION}"
  echo "   3. Verify: ./scripts/verify.sh ${VERSION}"
  echo "   4. Monitor: ./scripts/monitor-launch.sh --continuous"
fi

echo ""
echo -e "${BLUE}Pipeline completed at: $(date)${NC}"
