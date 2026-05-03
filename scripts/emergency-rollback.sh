#!/bin/bash

# Emergency Rollback Script for shai-scanner
# Usage: ./scripts/emergency-rollback.sh <version> [--deprecate] [--force]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPRECATE=false
FORCE=false
VERSION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --deprecate|-d)
      DEPRECATE=true
      shift
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 <version> [--deprecate] [--force]"
      echo ""
      echo "Options:"
      echo "  <version>      Version to rollback/deprecate"
      echo "  --deprecate, -d Deprecate the version instead of unpublishing"
      echo "  --force, -f    Skip confirmation prompts"
      echo "  --help, -h     Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 4.6.5 --deprecate"
      echo "  $0 4.6.5 --force"
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
  echo "Usage: $0 <version> [--deprecate] [--force]"
  exit 1
fi

echo -e "${RED}🚨 EMERGENCY ROLLBACK SCRIPT${NC}"
echo "============================="
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will affect the published package!${NC}"
echo ""
echo -e "${BLUE}Version to rollback:${NC} ${VERSION}"
echo -e "${BLUE}Action:${NC} $([ "$DEPRECATE" = true ] && echo "Deprecate" || echo "Unpublish")"
echo ""

# Confirmation prompt
if [ "$FORCE" = false ]; then
  read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Aborted by user.${NC}"
    exit 0
  fi
  echo ""
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found${NC}"
  exit 1
fi

# Check npm authentication
echo -e "${BLUE}Step 1: Checking npm authentication...${NC}"
if ! npm whoami > /dev/null 2>&1; then
  echo -e "${RED}❌ Not logged into npm${NC}"
  echo "Please run: npm login"
  exit 1
fi
echo -e "${GREEN}✅ Logged into npm${NC}"
echo ""

# Check if version exists
echo -e "${BLUE}Step 2: Checking if version exists...${NC}"
if npm view "shai-scanner@${VERSION}" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Version ${VERSION} exists on npm${NC}"
else
  echo -e "${RED}❌ Version ${VERSION} not found on npm${NC}"
  exit 1
fi
echo ""

# Get current latest version
echo -e "${BLUE}Step 3: Checking current latest version...${NC}"
CURRENT_LATEST=$(npm view shai-scanner dist-tags.latest 2>/dev/null || echo "none")
echo -e "${BLUE}Current latest version:${NC} ${CURRENT_LATEST}"
echo ""

# Perform the action
if [ "$DEPRECATE" = true ]; then
  echo -e "${BLUE}Step 4: Deprecating version ${VERSION}...${NC}"
  npm deprecate "shai-scanner@${VERSION}" "Deprecated due to critical issues - use version ${CURRENT_LATEST}"
  echo -e "${GREEN}✅ Version ${VERSION} deprecated${NC}"
else
  echo -e "${BLUE}Step 4: Unpublishing version ${VERSION}...${NC}"
  
  # Check if it's the only version
  VERSION_COUNT=$(npm view shai-scanner versions --json | jq 'length')
  if [ "$VERSION_COUNT" -eq 1 ]; then
    echo -e "${RED}⚠️  This is the only published version!${NC}"
    echo "Unpublishing will remove the package completely."
    
    if [ "$FORCE" = false ]; then
      read -p "Are you absolutely sure? (yes/no): " CONFIRM2
      if [ "$CONFIRM2" != "yes" ]; then
        echo -e "${YELLOW}Aborted by user.${NC}"
        exit 0
      fi
    fi
  fi
  
  npm unpublish "shai-scanner@${VERSION}"
  echo -e "${GREEN}✅ Version ${VERSION} unpublished${NC}"
fi
echo ""

# Verify the action
echo -e "${BLUE}Step 5: Verifying action...${NC}"
if [ "$DEPRECATE" = true ]; then
  # Check if version is deprecated
  if npm view "shai-scanner@${VERSION}" deprecated 2>/dev/null | grep -q "Deprecated"; then
    echo -e "${GREEN}✅ Version ${VERSION} is now deprecated${NC}"
  else
    echo -e "${YELLOW}⚠️  Could not verify deprecation status${NC}"
  fi
else
  # Check if version still exists
  if npm view "shai-scanner@${VERSION}" > /dev/null 2>&1; then
    echo -e "${RED}❌ Version ${VERSION} still exists on npm${NC}"
  else
    echo -e "${GREEN}✅ Version ${VERSION} removed from npm${NC}"
  fi
fi
echo ""

# Git rollback (if needed)
echo -e "${BLUE}Step 6: Git rollback options...${NC}"
echo "If you need to rollback git changes, you can:"
echo ""
echo "  # Revert the last commit"
echo "  git revert HEAD"
echo ""
echo "  # Or reset to a specific commit"
echo "  git reset --hard <commit-hash>"
echo ""
echo "  # Force push (use with caution)"
echo "  git push origin main --force"
echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}ROLLBACK COMPLETE${NC}"
echo "================"
echo ""
echo -e "${GREEN}✅ Version ${VERSION} has been $([ "$DEPRECATE" = true ] && echo "deprecated" || echo "unpublished")${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Check npm package: https://www.npmjs.com/package/shai-scanner"
echo "2. Update documentation if needed"
echo "3. Notify team and users"
echo "4. Consider publishing a fixed version"
echo ""
echo -e "${YELLOW}⚠️  Remember to update any references to version ${VERSION} in documentation!${NC}"
echo ""
echo -e "${GREEN}Emergency rollback completed at: $(date)${NC}"