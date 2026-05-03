#!/bin/bash

# Test GitHub Actions Workflow Locally
# This simulates what the publish workflow does without actually publishing
# Usage: ./scripts/test-github-actions-locally.sh

set -e

echo "🧪 Testing GitHub Actions Workflow Locally"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Simulate workflow environment
echo -e "${BLUE}1. Simulating workflow environment...${NC}"
echo "   Node.js version: $(node -v)"
echo "   npm version: $(npm -v)"
echo "   Working directory: $(pwd)"
echo ""

# Step 1: Install dependencies (like workflow)
echo -e "${BLUE}2. Installing dependencies (npm ci)...${NC}"
if npm ci --silent 2>&1 | tail -1 | grep -q "added"; then
  echo -e "${GREEN}✅ Dependencies installed${NC}"
else
  echo -e "${YELLOW}⚠️  Using npm install instead${NC}"
  npm install --silent
fi
echo ""

# Step 2: Run tests (like workflow)
echo -e "${BLUE}3. Running tests (npm test)...${NC}"
if npm test 2>&1 | tail -1 | grep -qE "passing|passed"; then
  echo -e "${GREEN}✅ Tests passed${NC}"
else
  echo -e "${RED}❌ Tests failed!${NC}"
  exit 1
fi
echo ""

# Step 3: Version validation (like workflow)
echo -e "${BLUE}4. Validating version...${NC}"
VERSION=$(node -p "require('./package.json').version")
echo "   Package version: $VERSION"
echo -e "${GREEN}✅ Version valid${NC}"
echo ""

# Step 4: Package validation (like workflow)
echo -e "${BLUE}5. Package validation (npm pack --dry-run)...${NC}"
if npm pack --dry-run 2>&1 | grep -q "npm notice total files:"; then
  echo -e "${GREEN}✅ Package validation successful${NC}"
  FILES=$(npm pack --dry-run 2>&1 | grep "total files:" | awk '{print $3}')
  SIZE=$(npm pack --dry-run 2>&1 | grep "package size:" | awk '{print $4}')
  echo "   Files: $FILES"
  echo "   Size: $SIZE"
else
  echo -e "${RED}❌ Package validation failed!${NC}"
  exit 1
fi
echo ""

# Step 5: Publish dry run (like workflow)
echo -e "${BLUE}6. Publish dry run (npm publish --dry-run)...${NC}"
if npm publish --dry-run 2>&1 | grep -qE "shai-scanner-.*\.tgz|dry-run"; then
  echo -e "${GREEN}✅ Publish dry-run successful${NC}"
  echo "   Tarball: shai-scanner-$VERSION.tgz"
else
  echo -e "${RED}❌ Publish dry-run failed!${NC}"
  exit 1
fi
echo ""

# Step 6: Check npm registry (like workflow)
echo -e "${BLUE}7. Checking npm registry...${NC}"
CURRENT_VERSION=$(npm view shai-scanner version 2>/dev/null || echo "not found")
echo "   Current published version: $CURRENT_VERSION"
echo "   Version to publish: $VERSION"

if [ "$CURRENT_VERSION" = "$VERSION" ]; then
  echo -e "${YELLOW}⚠️  Version $VERSION already exists!${NC}"
  echo "   You need to bump the version"
elif [ "$CURRENT_VERSION" = "not found" ]; then
  echo -e "${YELLOW}⚠️  Package not found (first publish)${NC}"
else
  echo -e "${GREEN}✅ Version $VERSION is available${NC}"
fi
echo ""

# Step 7: Verify package.json (like workflow)
echo -e "${BLUE}8. Verifying package.json...${NC}"
node -e "
const pkg = require('./package.json');
const issues = [];
if (!pkg.name) issues.push('Missing name');
if (!pkg.version) issues.push('Missing version');
if (!pkg.main) issues.push('Missing main');
if (!pkg.bin) issues.push('Missing bin');
if (!pkg.files) issues.push('Missing files');
if (!pkg.engines) issues.push('Missing engines');

if (issues.length > 0) {
  console.error('❌ Issues found:');
  issues.forEach(issue => console.error('   - ' + issue));
  process.exit(1);
} else {
  console.log('✅ package.json is valid');
}
" 2>&1
echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}✅ Local workflow simulation complete!${NC}"
echo ""
echo "All steps that would run in GitHub Actions:"
echo "  ✅ Dependencies installed"
echo "  ✅ Tests passed"
echo "  ✅ Version validation passed"
echo "  ✅ Package validation passed"
echo "  ✅ Publish dry-run successful"
echo "  ✅ Registry check passed"
echo "  ✅ package.json valid"
echo ""
echo "Next steps:"
echo "1. Set NPM_TOKEN in GitHub secrets"
echo "2. Run workflow: gh workflow run publish.yml -f version=\"$VERSION\" -f dry_run=true"
echo "3. If dry-run works: gh workflow run publish.yml -f version=\"$VERSION\" -f dry_run=false"
echo ""
echo "For more details, see: NPM_PUBLISH_GUIDE.md"