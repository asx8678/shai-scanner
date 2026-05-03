#!/bin/bash
set -e

echo "🔒 Running Security Audit..."
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
AUDIT_PASSED=0
AUDIT_FAILED=0

# Helper function
run_check() {
  local check_name=$1
  local command=$2
  local critical=${3:-false}
  
  echo -n "${BLUE}Checking: ${check_name}...${NC} "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    AUDIT_PASSED=$((AUDIT_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    AUDIT_FAILED=$((AUDIT_FAILED + 1))
    if [ "$critical" = true ]; then
      echo -e "${RED}Critical audit check failed! Blocking publish.${NC}"
      exit 1
    fi
    return 0
  fi
}

# Step 1: Basic npm audit
echo ""
echo -e "${BLUE}Step 1: Running npm audit (production dependencies)...${NC}"
if npm audit --production 2>&1 | grep -q "found 0 vulnerabilities"; then
  echo -e "${GREEN}✅ No vulnerabilities found in production dependencies${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Vulnerabilities detected:${NC}"
  npm audit --production
  echo ""
  echo -e "${YELLOW}Review and fix before publishing!${NC}"
  AUDIT_FAILED=$((AUDIT_FAILED + 1))
fi

# Step 2: High severity check
echo ""
echo -e "${BLUE}Step 2: Checking high severity vulnerabilities...${NC}"
HIGH_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
if echo "$HIGH_OUTPUT" | grep -q "found 0 vulnerabilities"; then
  echo -e "${GREEN}✅ No high severity vulnerabilities${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
elif echo "$HIGH_OUTPUT" | grep -q "found 0 high"; then
  echo -e "${GREEN}✅ No high severity vulnerabilities${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
else
  echo -e "${RED}❌ High severity vulnerabilities found!${NC}"
  echo "$HIGH_OUTPUT"
  echo ""
  echo -e "${RED}Block publishing until resolved!${NC}"
  AUDIT_FAILED=$((AUDIT_FAILED + 1))
fi

# Step 3: Critical severity check
echo ""
echo -e "${BLUE}Step 3: Checking critical severity vulnerabilities...${NC}"
CRITICAL_OUTPUT=$(npm audit --audit-level=critical 2>&1 || true)
if echo "$CRITICAL_OUTPUT" | grep -q "found 0 vulnerabilities"; then
  echo -e "${GREEN}✅ No critical severity vulnerabilities${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
elif echo "$CRITICAL_OUTPUT" | grep -q "found 0 critical"; then
  echo -e "${GREEN}✅ No critical severity vulnerabilities${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
else
  echo -e "${RED}❌ CRITICAL vulnerabilities found! BLOCKING PUBLISH!${NC}"
  echo "$CRITICAL_OUTPUT"
  exit 1
fi

# Step 4: Generate audit report
echo ""
echo -e "${BLUE}Step 4: Generating audit report...${NC}"
REPORT_FILE="audit-report-$(date +%Y%m%d-%H%M%S).json"
npm audit --json > "$REPORT_FILE" 2>/dev/null || true
echo -e "${GREEN}📄 Report saved to: ${REPORT_FILE}${NC}"
AUDIT_PASSED=$((AUDIT_PASSED + 1))

# Step 5: Check for known CVE references in code
echo ""
echo -e "${BLUE}Step 5: Checking for CVE references in source code...${NC}"
KNOWN_ISSUES=$(grep -r "CVE-" src/ --include="*.js" 2>/dev/null || echo "")
if [ -n "$KNOWN_ISSUES" ]; then
  echo -e "${YELLOW}⚠️  Known CVE references found in code:${NC}"
  echo "$KNOWN_ISSUES" | head -10
  echo ""
  echo -e "${YELLOW}Review these references (may be intentional in security scanner)${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))  # Not blocking, just informational
else
  echo -e "${GREEN}✅ No CVE references found in source code${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
fi

# Step 6: Check for sensitive data patterns
echo ""
echo -e "${BLUE}Step 6: Checking for sensitive data patterns...${NC}"
SENSITIVE_PATTERNS=(
  "password"
  "secret"
  "api_key"
  "apikey"
  "token"
  "private_key"
  "credentials"
)

SENSITIVE_FOUND=false
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  if grep -r "$pattern" src/ --include="*.js" -i 2>/dev/null | grep -v "test\|mock\|example\|README" | head -1 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Potential sensitive pattern '${pattern}' found:${NC}"
    grep -r "$pattern" src/ --include="*.js" -i 2>/dev/null | grep -v "test\|mock\|example\|README" | head -3
    SENSITIVE_FOUND=true
  fi
done

if [ "$SENSITIVE_FOUND" = false ]; then
  echo -e "${GREEN}✅ No sensitive data patterns detected${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
else
  echo -e "${YELLOW}⚠️  Review patterns above (may be false positives)${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
fi

# Step 7: Check for hardcoded URLs
echo ""
echo -e "${BLUE}Step 7: Checking for hardcoded URLs...${NC}"
HARDCODED_URLS=$(grep -r "https\?://" src/ --include="*.js" 2>/dev/null | grep -v "test\|mock\|example\|README\|osv\|github\|npmjs" | head -5 || echo "")
if [ -n "$HARDCODED_URLS" ]; then
  echo -e "${YELLOW}⚠️  Potential hardcoded URLs found:${NC}"
  echo "$HARDCODED_URLS"
  echo ""
  echo -e "${YELLOW}Review URLs (some may be intentional for API endpoints)${NC}"
else
  echo -e "${GREEN}✅ No unexpected hardcoded URLs${NC}"
  AUDIT_PASSED=$((AUDIT_PASSED + 1))
fi

# Summary
echo ""
echo "================================="
echo -e "${BLUE}SECURITY AUDIT SUMMARY${NC}"
echo "======================"
echo ""

if [ $AUDIT_FAILED -gt 0 ]; then
  echo -e "${RED}❌ SECURITY AUDIT FAILED${NC}"
  echo -e "${RED}   ${AUDIT_FAILED} critical check(s) failed${NC}"
  echo -e "${GREEN}   ${AUDIT_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${RED}🚨 BLOCKING PUBLISH - Resolve issues before proceeding${NC}"
  exit 1
else
  echo -e "${GREEN}✅ SECURITY AUDIT PASSED${NC}"
  echo -e "${GREEN}   ${AUDIT_PASSED} check(s) passed${NC}"
  echo ""
  echo -e "${GREEN}🛡️  Safe to proceed with publishing${NC}"
fi

echo ""
echo -e "${BLUE}Audit completed at: $(date)${NC}"
