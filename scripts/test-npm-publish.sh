#!/bin/bash

# Test NPM Publish Configuration
# Usage: ./scripts/test-npm-publish.sh

set -e

echo "🧪 Testing NPM Publish Configuration"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Check package.json
echo -e "${BLUE}1. Checking package.json configuration...${NC}"
if node -e "
const pkg = require('./package.json');
const required = ['name', 'version', 'main', 'bin', 'files'];
const missing = required.filter(field => !pkg[field]);
if (missing.length > 0) {
  console.error('❌ Missing required fields:', missing.join(', '));
  process.exit(1);
}
console.log('✅ All required fields present');
console.log('   Name:', pkg.name);
console.log('   Version:', pkg.version);
console.log('   Main:', pkg.main);
console.log('   Bin:', Object.keys(pkg.bin).join(', '));
console.log('   Files:', pkg.files.length, 'items');
" 2>&1; then
  echo -e "${GREEN}✅ package.json looks good${NC}"
else
  echo -e "${RED}❌ package.json has issues${NC}"
  exit 1
fi
echo ""

# Test 2: Check npm pack dry run
echo -e "${BLUE}2. Testing npm pack --dry-run...${NC}"
if npm pack --dry-run 2>&1 | grep -q "npm notice total files:"; then
  echo -e "${GREEN}✅ npm pack dry-run successful${NC}"
  echo "   Package size: $(npm pack --dry-run 2>&1 | grep "package size:" | awk '{print $4}')"
  echo "   Total files: $(npm pack --dry-run 2>&1 | grep "total files:" | awk '{print $3}')"
else
  echo -e "${RED}❌ npm pack dry-run failed${NC}"
  exit 1
fi
echo ""

# Test 3: Check npm publish dry run
echo -e "${BLUE}3. Testing npm publish --dry-run...${NC}"
if npm publish --dry-run 2>&1 | grep -q "shai-scanner-4.6.5.tgz"; then
  echo -e "${GREEN}✅ npm publish dry-run successful${NC}"
  echo "   Tarball: shai-scanner-4.6.5.tgz"
else
  echo -e "${RED}❌ npm publish dry-run failed${NC}"
  exit 1
fi
echo ""

# Test 4: Check npm registry
echo -e "${BLUE}4. Checking npm registry...${NC}"
CURRENT_VERSION=$(npm view shai-scanner version 2>/dev/null || echo "not found")
echo "   Current published version: $CURRENT_VERSION"
echo "   Package version in package.json: 4.6.5"

if [ "$CURRENT_VERSION" = "4.6.5" ]; then
  echo -e "${YELLOW}⚠️  Version 4.6.5 is already published!${NC}"
  echo "   You may need to bump the version"
elif [ "$CURRENT_VERSION" = "not found" ]; then
  echo -e "${YELLOW}⚠️  Package not found on npm (first publish)${NC}"
else
  echo -e "${GREEN}✅ Version 4.6.5 is available for publishing${NC}"
fi
echo ""

# Test 5: Check npm authentication
echo -e "${BLUE}5. Checking npm authentication...${NC}"
if npm whoami 2>&1 | grep -q "error"; then
  echo -e "${YELLOW}⚠️  Not logged into npm locally${NC}"
  echo "   (This is OK for CI/CD - authentication happens via NPM_TOKEN)"
  echo "   To login locally: npm login"
else
  NPM_USER=$(npm whoami 2>/dev/null)
  echo -e "${GREEN}✅ Logged into npm as: $NPM_USER${NC}"
fi
echo ""

# Test 6: Check .npmignore
echo -e "${BLUE}6. Checking .npmignore configuration...${NC}"
if [ -f ".npmignore" ]; then
  echo -e "${GREEN}✅ .npmignore exists${NC}"
  echo "   Exclusions:"
  head -10 .npmignore | grep -v "^#" | grep -v "^$" | sed 's/^/     /'
else
  echo -e "${YELLOW}⚠️  .npmignore not found (npm will use .gitignore)${NC}"
fi
echo ""

# Test 7: Check GitHub Actions workflow
echo -e "${BLUE}7. Checking GitHub Actions workflow...${NC}"
if [ -f ".github/workflows/publish.yml" ]; then
  echo -e "${GREEN}✅ publish.yml workflow exists${NC}"
  
  # Check if it uses NPM_TOKEN
  if grep -q "NPM_TOKEN" .github/workflows/publish.yml; then
    echo -e "${GREEN}✅ Workflow uses NPM_TOKEN secret${NC}"
  else
    echo -e "${RED}❌ Workflow missing NPM_TOKEN configuration${NC}"
  fi
else
  echo -e "${RED}❌ publish.yml workflow not found${NC}"
  exit 1
fi
echo ""

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ NPM publish configuration looks good!${NC}"
echo ""
echo "Next steps:"
echo "1. Generate npm token: https://www.npmjs.com/settings/tokens"
echo "2. Add to GitHub secrets: Settings → Secrets → Actions"
echo "3. Test with dry run: gh workflow run publish.yml -f version=\"4.6.5\" -f dry_run=true"
echo "4. Publish: gh workflow run publish.yml -f version=\"4.6.5\" -f dry_run=false"
echo ""
echo "For more details, see: NPM_PUBLISH_GUIDE.md"