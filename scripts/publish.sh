#!/bin/bash

# One-Command Publish Script for shai-scanner
# Usage: ./scripts/publish.sh <version> [--dry-run] [--skip-tests]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRY_RUN=false
SKIP_TESTS=false
VERSION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 <version> [--dry-run] [--skip-tests]"
      echo ""
      echo "Options:"
      echo "  <version>      Version to publish (e.g., 4.6.5)"
      echo "  --dry-run      Test publish without actually publishing"
      echo "  --skip-tests   Skip running tests before publish"
      echo "  --help, -h     Show this help message"
      exit 0
      ;;
    *)
      VERSION="$1"
      shift
      ;;
  esac
done

# Check if version is provided
if [ -z "$VERSION" ]; then
  echo -e "${RED}Error: Version is required${NC}"
  echo "Usage: $0 <version> [--dry-run] [--skip-tests]"
  exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Are you in the project root?${NC}"
  exit 1
fi

# Check for NPM_TOKEN if not dry run
if [ "$DRY_RUN" = false ] && [ -z "$NPM_TOKEN" ]; then
  echo -e "${YELLOW}Warning: NPM_TOKEN not set in environment${NC}"
  echo "Attempting to use GitHub CLI secret..."
  
  # Try to get token from GitHub CLI
  if command -v gh &> /dev/null; then
    NPM_TOKEN=$(gh secret get NPM_TOKEN 2>/dev/null || true)
    if [ -z "$NPM_TOKEN" ]; then
      echo -e "${RED}Error: NPM_TOKEN not found in environment or GitHub secrets${NC}"
      echo "Please set NPM_TOKEN first:"
      echo "  export NPM_TOKEN=your-token-here"
      echo "  or"
      echo "  gh secret set NPM_TOKEN --body your-token-here"
      exit 1
    fi
    echo -e "${GREEN}✅ Found NPM_TOKEN in GitHub secrets${NC}"
  else
    echo -e "${RED}Error: gh CLI not available and NPM_TOKEN not set${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}🚀 SHAI-SCANNER PUBLISH SCRIPT${NC}"
echo "=============================="
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"
echo -e "${BLUE}Target version: ${VERSION}${NC}"
echo ""

# Dry run mode
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
  echo -e "${BLUE}Would perform:${NC}"
  echo "  1. Run tests (unless --skip-tests)"
  echo "  2. Update package.json version to $VERSION"
  echo "  3. Create git commit and tag"
  echo "  4. Push to GitHub"
  echo "  5. Publish to npm"
  echo ""
  
  # Run validation
  echo -e "${BLUE}Running validation...${NC}"
  ./scripts/validate-all.sh
  
  echo -e "${GREEN}Dry run completed. No changes made.${NC}"
  exit 0
fi

# Step 1: Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
  echo -e "${BLUE}Step 1: Running tests...${NC}"
  if npm test; then
    echo -e "${GREEN}✅ Tests passed!${NC}"
  else
    echo -e "${RED}❌ Tests failed! Aborting publish.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⏭️  Skipping tests (--skip-tests flag)${NC}"
fi
echo ""

# Step 2: Update version in package.json
echo -e "${BLUE}Step 2: Updating version to ${VERSION}...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${VERSION}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Version updated to ${VERSION}');
"
echo ""

# Step 3: Create git commit and tag
echo -e "${BLUE}Step 3: Creating git commit and tag...${NC}"
git add package.json
git commit -m "chore: release v${VERSION}"
git tag -a "v${VERSION}" -m "Release v${VERSION}"
echo -e "${GREEN}✅ Git commit and tag created${NC}"
echo ""

# Step 4: Push to GitHub
echo -e "${BLUE}Step 4: Pushing to GitHub...${NC}"
git push origin main --tags
echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""

# Step 5: Publish to npm
echo -e "${BLUE}Step 5: Publishing to npm...${NC}"

# Set up npm authentication
if [ -n "$NPM_TOKEN" ]; then
  npm set //registry.npmjs.org/:_authToken="$NPM_TOKEN"
fi

# Publish
if npm publish; then
  echo -e "${GREEN}✅ Successfully published to npm!${NC}"
else
  echo -e "${RED}❌ Failed to publish to npm${NC}"
  
  # Cleanup
  npm config delete //registry.npmjs.org/:_authToken 2>/dev/null || true
  
  # Revert changes
  echo -e "${YELLOW}Reverting changes...${NC}"
  git reset --hard HEAD~1
  git tag -d "v${VERSION}"
  git push origin :refs/tags/v"${VERSION}"
  
  exit 1
fi

# Cleanup
npm config delete //registry.npmjs.org/:_authToken 2>/dev/null || true
echo ""

# Step 6: Create release summary
echo -e "${BLUE}Step 6: Creating release summary...${NC}"
cat > "RELEASE_v${VERSION}.md" << EOF
# Release v${VERSION}

**Release Date:** $(date)
**Version:** ${VERSION}
**Previous Version:** ${CURRENT_VERSION}

## Changes

$(git log --pretty=format:"- %s (%h)" "v${CURRENT_VERSION}"..HEAD 2>/dev/null || echo "First release")

## Installation

### npm (recommended)
\`\`\`bash
npm install -g shai-scanner@${VERSION}
\`\`\`

### From GitHub Release
1. Download \`shai-scanner-${VERSION}.tar.gz\` or \`.zip\` from [GitHub Releases](https://github.com/asx8678/shai-scanner/releases/tag/v${VERSION})
2. Extract the archive
3. Run: \`node src/cli.js --help\`

## Verification

\`\`\`bash
shai-scanner --version
\`\`\`

## Documentation

- [README](https://github.com/asx8678/shai-scanner#readme)
- [CHANGELOG](https://github.com/asx8678/shai-scanner/blob/main/CHANGELOG.md)
- [Architecture](https://github.com/asx8678/shai-scanner/blob/main/ARCHITECTURE.md)

## Support

- [GitHub Issues](https://github.com/asx8678/shai-scanner/issues)
- [Security Policy](https://github.com/asx8678/shai-scanner/blob/main/SECURITY.md)

---

**Released by:** $(git config user.name) ($(git config user.email))
**Release URL:** https://github.com/asx8678/shai-scanner/releases/tag/v${VERSION}
EOF

echo -e "${GREEN}✅ Release summary created: RELEASE_v${VERSION}.md${NC}"
echo ""

# Final message
echo -e "${GREEN}🎉 PUBLISH COMPLETE!${NC}"
echo -e "${BLUE}Version ${VERSION} is now available.${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Monitor GitHub Actions: https://github.com/asx8678/shai-scanner/actions"
echo "  2. Check npm package: https://www.npmjs.com/package/shai-scanner/v/${VERSION}"
echo "  3. Run verification: ./scripts/verify.sh ${VERSION}"
echo "  4. Update documentation: ./scripts/update-docs-for-npm.sh"
echo ""
echo -e "${GREEN}Woof woof! 🐶${NC}"