#!/bin/bash

# Version Bump Script for shai-scanner
# Usage: ./scripts/bump-version.sh [major|minor|patch] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRY_RUN=false
VERSION_TYPE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    major|minor|patch)
      VERSION_TYPE="$1"
      shift
      ;;
    *)
      echo -e "${RED}Error: Unknown argument $1${NC}"
      echo "Usage: $0 [major|minor|patch] [--dry-run]"
      exit 1
      ;;
  esac
done

# Check if version type is provided
if [ -z "$VERSION_TYPE" ]; then
  echo -e "${RED}Error: Version type (major, minor, patch) is required${NC}"
  echo "Usage: $0 [major|minor|patch] [--dry-run]"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: $CURRENT_VERSION${NC}"

# Parse version parts
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Calculate new version
case $VERSION_TYPE in
  major)
    NEW_MAJOR=$((MAJOR + 1))
    NEW_VERSION="$NEW_MAJOR.0.0"
    ;;
  minor)
    NEW_MINOR=$((MINOR + 1))
    NEW_VERSION="$MAJOR.$NEW_MINOR.0"
    ;;
  patch)
    NEW_PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
    ;;
esac

echo -e "${GREEN}New version: $NEW_VERSION${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
  git status --short
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted by user${NC}"
    exit 1
  fi
fi

# Dry run mode
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
  echo -e "${BLUE}Would update:${NC}"
  echo "  - package.json: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - src/cli.js: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - src/reporters.js: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - src/database.js: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - src/scanner.js: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - src/live-sources.js: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - src/tui/components/app.js: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - docs/CROSS_PLATFORM_TESTING.md: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - ARCHITECTURE.md: $CURRENT_VERSION → $NEW_VERSION"
  echo "  - README.md: $CURRENT_VERSION → $NEW_VERSION"
  echo ""
  echo -e "${BLUE}Would create:${NC}"
  echo "  - Git tag: v$NEW_VERSION"
  echo "  - Git commit: 'chore: bump version to $NEW_VERSION'"
  echo ""
  echo -e "${GREEN}Dry run completed. No changes made.${NC}"
  exit 0
fi

# Update package.json
echo -e "${BLUE}Updating package.json...${NC}"
npm version "$NEW_VERSION" --no-git-tag-version

# Update version in other files
echo -e "${BLUE}Updating version in other files...${NC}"

# Update src/cli.js
if [ -f "src/cli.js" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" src/cli.js
fi

# Update src/reporters.js
if [ -f "src/reporters.js" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" src/reporters.js
fi

# Update src/database.js
if [ -f "src/database.js" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" src/database.js
fi

# Update src/scanner.js
if [ -f "src/scanner.js" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" src/scanner.js
fi

# Update src/live-sources.js
if [ -f "src/live-sources.js" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" src/live-sources.js
fi

# Update src/tui/components/app.js
if [ -f "src/tui/components/app.js" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" src/tui/components/app.js
fi

# Update docs/CROSS_PLATFORM_TESTING.md
if [ -f "docs/CROSS_PLATFORM_TESTING.md" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" docs/CROSS_PLATFORM_TESTING.md
fi

# Update ARCHITECTURE.md
if [ -f "ARCHITECTURE.md" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" ARCHITECTURE.md
fi

# Update README.md
if [ -f "README.md" ]; then
  sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" README.md
fi

# Run tests to verify changes
echo -e "${BLUE}Running tests to verify changes...${NC}"
if npm test; then
  echo -e "${GREEN}Tests passed!${NC}"
else
  echo -e "${RED}Tests failed! Rolling back changes...${NC}"
  git checkout -- .
  npm version "$CURRENT_VERSION" --no-git-tag-version
  exit 1
fi

# Create git commit
echo -e "${BLUE}Creating git commit...${NC}"
git add .
git commit -m "chore: bump version to $NEW_VERSION"

# Create git tag
echo -e "${BLUE}Creating git tag...${NC}"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo ""
echo -e "${GREEN}✅ Version bumped successfully!${NC}"
echo -e "${BLUE}New version: $NEW_VERSION${NC}"
echo -e "${BLUE}Git tag: v$NEW_VERSION${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: git log --oneline -5"
echo "  2. Push to GitHub: git push origin main --tags"
echo "  3. Create GitHub release: https://github.com/$GITHUB_REPOSITORY/releases/new?tag=v$NEW_VERSION"
echo "  4. npm publish will trigger automatically from the release"