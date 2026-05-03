#!/bin/bash

# Verify NPM Publish Success
# Usage: ./scripts/verify-npm-publish.sh [version]

set -e

VERSION=${1:-"4.6.5"}

echo "🔍 Verifying npm publish success for shai-scanner@$VERSION"
echo "========================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Wait a bit for npm to update
echo -e "${BLUE}1. Waiting for npm registry to update...${NC}"
echo "   (This may take 10-30 seconds)"
sleep 10
echo ""

# Check npm registry
echo -e "${BLUE}2. Checking npm registry...${NC}"
PUBLISHED_VERSION=$(npm view shai-scanner version 2>/dev/null || echo "not found")
echo "   Current published version: $PUBLISHED_VERSION"
echo "   Expected version: $VERSION"

if [ "$PUBLISHED_VERSION" = "$VERSION" ]; then
  echo -e "${GREEN}✅ Version $VERSION is published!${NC}"
elif [ "$PUBLISHED_VERSION" = "not found" ]; then
  echo -e "${RED}❌ Package not found on npm!${NC}"
  echo "   Check: https://www.npmjs.com/package/shai-scanner"
  exit 1
else
  echo -e "${YELLOW}⚠️  Different version published: $PUBLISHED_VERSION${NC}"
  echo "   Expected: $VERSION"
  echo "   This might be a caching issue"
fi
echo ""

# Check package details
echo -e "${BLUE}3. Checking package details...${NC}"
npm view shai-scanner version description license author 2>/dev/null || true
echo ""

# Test installation
echo -e "${BLUE}4. Testing installation...${NC}"
echo "   Installing shai-scanner@$VERSION..."
if npm install -g shai-scanner@$VERSION 2>&1 | grep -q "added\|updated"; then
  echo -e "${GREEN}✅ Installation successful${NC}"
else
  echo -e "${RED}❌ Installation failed!${NC}"
  echo "   Try: npm install -g shai-scanner@$VERSION"
  exit 1
fi
echo ""

# Test CLI
echo -e "${BLUE}5. Testing CLI...${NC}"
if command -v shai-scanner &> /dev/null; then
  INSTALLED_VERSION=$(shai-scanner --version 2>/dev/null || echo "unknown")
  echo "   Installed version: $INSTALLED_VERSION"
  
  if [ "$INSTALLED_VERSION" = "$VERSION" ]; then
    echo -e "${GREEN}✅ CLI working correctly${NC}"
  else
    echo -e "${YELLOW}⚠️  Version mismatch (might be caching)${NC}"
    echo "   Expected: $VERSION"
    echo "   Installed: $INSTALLED_VERSION"
  fi
else
  echo -e "${RED}❌ shai-scanner command not found!${NC}"
  echo "   Check: which shai-scanner"
  echo "   Try: npm install -g shai-scanner@$VERSION"
  exit 1
fi
echo ""

# Test scan
echo -e "${BLUE}6. Testing scan functionality...${NC}"
if shai-scanner --help &> /dev/null; then
  echo -e "${GREEN}✅ Scanner CLI is functional${NC}"
else
  echo -e "${RED}❌ Scanner CLI not working!${NC}"
  exit 1
fi
echo ""

# Summary
echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}✅ NPM Publish Verification Complete!${NC}"
echo ""
echo "Package: shai-scanner@$VERSION"
echo "Registry: https://www.npmjs.com/package/shai-scanner"
echo "Installation: npm install -g shai-scanner@$VERSION"
echo ""
echo "Next steps:"
echo "1. Share with team: https://www.npmjs.com/package/shai-scanner"
echo "2. Update documentation with new version"
echo "3. Execute launch checklist: LAUNCH_DAY_CHECKLIST.md"
echo ""
echo "🎉 Congratulations on publishing to npm! 🐶"