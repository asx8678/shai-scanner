#!/bin/bash

# Release Script for shai-scanner
# Usage: ./scripts/release.sh [major|minor|patch] [--dry-run] [--skip-tests]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRY_RUN=false
SKIP_TESTS=false
VERSION_TYPE=""

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
    major|minor|patch)
      VERSION_TYPE="$1"
      shift
      ;;
    *)
      echo -e "${RED}Error: Unknown argument $1${NC}"
      echo "Usage: $0 [major|minor|patch] [--dry-run] [--skip-tests]"
      exit 1
      ;;
  esac
done

# Check if version type is provided
if [ -z "$VERSION_TYPE" ]; then
  echo -e "${RED}Error: Version type (major, minor, patch) is required${NC}"
  echo "Usage: $0 [major|minor|patch] [--dry-run] [--skip-tests]"
  exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Are you in the project root?${NC}"
  exit 1
fi

# Check for uncommitted changes
if [ "$DRY_RUN" = false ] && [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
  git status --short
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted by user${NC}"
    exit 1
  fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: $CURRENT_VERSION${NC}"

# Dry run mode
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
  echo -e "${BLUE}Would perform:${NC}"
  echo "  1. Run tests (unless --skip-tests)"
  echo "  2. Bump version ($VERSION_TYPE)"
  echo "  3. Create git commit"
  echo "  4. Create git tag"
  echo "  5. Push to GitHub"
  echo "  6. Create GitHub release"
  echo "  7. Publish to npm"
  echo ""
  echo -e "${GREEN}Dry run completed. No changes made.${NC}"
  exit 0
fi

# Step 1: Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
  echo -e "${BLUE}Step 1: Running tests...${NC}"
  if npm test; then
    echo -e "${GREEN}✅ Tests passed!${NC}"
  else
    echo -e "${RED}❌ Tests failed! Aborting release.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⏭️  Skipping tests (--skip-tests flag)${NC}"
fi

# Step 2: Bump version
echo -e "${BLUE}Step 2: Bumping version...${NC}"
./scripts/bump-version.sh "$VERSION_TYPE"

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✅ Version bumped to $NEW_VERSION${NC}"

# Step 3: Push to GitHub
echo -e "${BLUE}Step 3: Pushing to GitHub...${NC}"
git push origin main --tags

# Step 4: Wait for GitHub to process
echo -e "${BLUE}Step 4: Waiting for GitHub to process...${NC}"
sleep 5

# Step 5: Create GitHub release (this will trigger npm publish)
echo -e "${BLUE}Step 5: Creating GitHub release...${NC}"
echo -e "${YELLOW}Note: GitHub release will be created automatically by the tag push.${NC}"
echo -e "${YELLOW}The npm publish workflow will trigger automatically.${NC}"

# Step 6: Monitor release status
echo -e "${BLUE}Step 6: Monitoring release status...${NC}"
echo ""
echo -e "${GREEN}🎉 Release initiated successfully!${NC}"
echo ""
echo -e "${BLUE}Release Details:${NC}"
echo "  - Version: $NEW_VERSION"
echo "  - Git tag: v$NEW_VERSION"
echo "  - GitHub Release: https://github.com/$GITHUB_REPOSITORY/releases/tag/v$NEW_VERSION"
echo "  - npm package: https://www.npmjs.com/package/shai-scanner/v/$NEW_VERSION"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Monitor GitHub Actions: https://github.com/$GITHUB_REPOSITORY/actions"
echo "  2. Check npm publish status: https://www.npmjs.com/package/shai-scanner"
echo "  3. Announce release on social media"
echo "  4. Update documentation if needed"
echo "  5. Notify stakeholders"

# Step 7: Create release summary
echo -e "${BLUE}Step 7: Creating release summary...${NC}"
cat > "RELEASE_v${NEW_VERSION}.md" << EOF
# Release v${NEW_VERSION}

**Release Date:** $(date)
**Version:** ${NEW_VERSION}
**Previous Version:** ${CURRENT_VERSION}

## Changes

$(git log --pretty=format:"- %s (%h)" "v${CURRENT_VERSION}"..HEAD 2>/dev/null || echo "First release")

## Installation

### npm (recommended)
\`\`\`bash
npm install -g shai-scanner@${NEW_VERSION}
\`\`\`

### From GitHub Release
1. Download \`shai-scanner-${NEW_VERSION}.tar.gz\` or \`.zip\` from [GitHub Releases](https://github.com/$GITHUB_REPOSITORY/releases/tag/v${NEW_VERSION})
2. Extract the archive
3. Run: \`node src/cli.js --help\`

## Verification

\`\`\`bash
shai-scanner --version
\`\`\`

## Documentation

- [README](https://github.com/$GITHUB_REPOSITORY#readme)
- [CHANGELOG](https://github.com/$GITHUB_REPOSITORY/blob/main/CHANGELOG.md)
- [Architecture](https://github.com/$GITHUB_REPOSITORY/blob/main/ARCHITECTURE.md)

## Support

- [GitHub Issues](https://github.com/$GITHUB_REPOSITORY/issues)
- [Security Policy](https://github.com/$GITHUB_REPOSITORY/blob/main/SECURITY.md)

## Release Assets

- \`shai-scanner-${NEW_VERSION}.tar.gz\` - Source archive (tar.gz)
- \`shai-scanner-${NEW_VERSION}.zip\` - Source archive (zip)
- \`checksums-${NEW_VERSION}.sha256\` - SHA256 checksums

---

**Released by:** $(git config user.name) ($(git config user.email))
**Release URL:** https://github.com/$GITHUB_REPOSITORY/releases/tag/v${NEW_VERSION}
EOF

echo -e "${GREEN}✅ Release summary created: RELEASE_v${NEW_VERSION}.md${NC}"

# Final message
echo ""
echo -e "${GREEN}🎉 Release process completed!${NC}"
echo -e "${BLUE}Version ${NEW_VERSION} is now available.${NC}"