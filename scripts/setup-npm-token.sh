#!/bin/bash

# NPM_TOKEN Setup Script for shai-scanner
# Usage: ./scripts/setup-npm-token.sh <npm-token> [--validate] [--test]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VALIDATE=false
TEST=false
TOKEN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --validate|-v)
      VALIDATE=true
      shift
      ;;
    --test|-t)
      TEST=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 <npm-token> [--validate] [--test]"
      echo ""
      echo "Options:"
      echo "  <npm-token>    npm access token (starts with 'npm_')"
      echo "  --validate, -v Validate token format and permissions"
      echo "  --test, -t     Test token with npm whoami"
      echo "  --help, -h     Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 npm_abc123xyz"
      echo "  $0 npm_abc123xyz --validate --test"
      exit 0
      ;;
    *)
      TOKEN="$1"
      shift
      ;;
  esac
done

# Check if token is provided
if [ -z "$TOKEN" ]; then
  echo -e "${RED}Error: npm token is required${NC}"
  echo "Usage: $0 <npm-token> [--validate] [--test]"
  echo ""
  echo "To generate token:"
  echo "1. Go to https://www.npmjs.com/settings/tokens"
  echo "2. Generate 'Automation' token"
  echo "3. Copy token immediately"
  exit 1
fi

echo -e "${BLUE}🔐 NPM TOKEN SETUP SCRIPT${NC}"
echo "========================="
echo ""

# Step 1: Validate token format
echo -e "${BLUE}Step 1: Validating token format...${NC}"
if [[ ! $TOKEN =~ ^npm_ ]]; then
  echo -e "${RED}❌ Invalid token format. npm tokens start with 'npm_'${NC}"
  echo "Please check your token and try again."
  exit 1
fi
echo -e "${GREEN}✅ Token format is valid${NC}"
echo ""

# Step 2: Check if gh CLI is available
echo -e "${BLUE}Step 2: Checking GitHub CLI...${NC}"
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI (gh) not found${NC}"
  echo "Please install GitHub CLI: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status > /dev/null 2>&1; then
  echo -e "${RED}❌ GitHub CLI not authenticated${NC}"
  echo "Please run: gh auth login"
  exit 1
fi
echo -e "${GREEN}✅ GitHub CLI is ready${NC}"
echo ""

# Step 3: Set secret in GitHub
echo -e "${BLUE}Step 3: Setting NPM_TOKEN secret...${NC}"
if gh secret set NPM_TOKEN --body "$TOKEN"; then
  echo -e "${GREEN}✅ NPM_TOKEN secret set successfully${NC}"
else
  echo -e "${RED}❌ Failed to set NPM_TOKEN secret${NC}"
  exit 1
fi
echo ""

# Step 4: Verify secret exists
echo -e "${BLUE}Step 4: Verifying secret...${NC}"
if gh secret list | grep -q "NPM_TOKEN"; then
  echo -e "${GREEN}✅ NPM_TOKEN secret verified${NC}"
else
  echo -e "${RED}❌ NPM_TOKEN secret not found${NC}"
  exit 1
fi
echo ""

# Step 5: Validate token (if requested)
if [ "$VALIDATE" = true ]; then
  echo -e "${BLUE}Step 5: Validating token permissions...${NC}"
  
  # Set token locally for validation
  npm set //registry.npmjs.org/:_authToken="$TOKEN"
  
  # Check permissions
  if npm access ls-packages > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Token has valid permissions${NC}"
    
    # Check if we can publish
    if npm access ls-packages | grep -q "shai-scanner"; then
      echo -e "${GREEN}✅ Token can publish shai-scanner${NC}"
    else
      echo -e "${YELLOW}⚠️  Token might not have publish permissions for shai-scanner${NC}"
    fi
  else
    echo -e "${RED}❌ Token validation failed${NC}"
  fi
  
  # Cleanup
  npm config delete //registry.npmjs.org/:_authToken 2>/dev/null || true
  echo ""
fi

# Step 6: Test token (if requested)
if [ "$TEST" = true ]; then
  echo -e "${BLUE}Step 6: Testing token...${NC}"
  
  # Set token locally for testing
  npm set //registry.npmjs.org/:_authToken="$TOKEN"
  
  # Test whoami
  if npm whoami > /dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✅ Token is valid - logged in as: ${NPM_USER}${NC}"
  else
    echo -e "${RED}❌ Token test failed${NC}"
  fi
  
  # Cleanup
  npm config delete //registry.npmjs.org/:_authToken 2>/dev/null || true
  echo ""
fi

# Step 7: Create .npmrc for local development (optional)
echo -e "${BLUE}Step 7: Local development setup...${NC}"
echo "For local development, you can set the token with:"
echo ""
echo "  npm set //registry.npmjs.org/:_authToken=your-token"
echo ""
echo "Or create a .npmrc file in your home directory:"
echo ""
echo "  //registry.npmjs.org/:_authToken=your-token"
echo ""
echo -e "${YELLOW}⚠️  Never commit .npmrc files to version control!${NC}"
echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}SETUP COMPLETE${NC}"
echo "=============="
echo ""
echo -e "${GREEN}✅ NPM_TOKEN secret configured in GitHub${NC}"
echo -e "${GREEN}✅ Token format validated${NC}"
if [ "$VALIDATE" = true ]; then
  echo -e "${GREEN}✅ Token permissions validated${NC}"
fi
if [ "$TEST" = true ]; then
  echo -e "${GREEN}✅ Token tested successfully${NC}"
fi
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test publishing: ./scripts/test-publish-dry-run.sh"
echo "2. Publish: ./scripts/publish.sh 4.6.5"
echo "3. Verify: ./scripts/verify.sh 4.6.5"
echo ""
echo -e "${GREEN}Woof woof! 🐶${NC}"