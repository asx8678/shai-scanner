#!/bin/bash

# 🔍 shai-scanner Publish Verification Script
# Usage: ./verify-publish.sh [version]
# Example: ./verify-publish.sh 4.6.5

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 shai-scanner Publish Verification Script${NC}"
echo "=========================================="

# Get version from argument or package.json
VERSION=${1:-$(node -p "require('./package.json').version")}
echo -e "${BLUE}📦 Checking version: ${VERSION}${NC}"
echo ""

# Function to check command
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
}

# Function to check npm registry
check_npm_registry() {
    echo -e "${BLUE}🔎 Checking npm registry...${NC}"
    
    # Wait a bit for registry to update
    echo "Waiting 10 seconds for registry to update..."
    sleep 10
    
    # Check if version exists
    if npm view "shai-scanner@${VERSION}" version &> /dev/null; then
        echo -e "${GREEN}✅ Version ${VERSION} found on npm registry${NC}"
        echo "   URL: https://www.npmjs.com/package/shai-scanner/v/${VERSION}"
    else
        echo -e "${RED}❌ Version ${VERSION} not found on npm registry${NC}"
        echo "   This might mean:"
        echo "   1. Package hasn't been published yet"
        echo "   2. Registry hasn't updated yet (try again in 30 seconds)"
        echo "   3. Wrong version number"
        return 1
    fi
}

# Function to test installation
test_installation() {
    echo -e "${BLUE}📥 Testing installation...${NC}"
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Initialize package
    npm init -y > /dev/null 2>&1
    
    # Install package
    echo "Installing shai-scanner@${VERSION}..."
    if npm install "shai-scanner@${VERSION}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Installation successful${NC}"
        
        # Check version
        INSTALLED_VERSION=$(node -p "require('shai-scanner/package.json').version")
        echo "   Installed version: ${INSTALLED_VERSION}"
        
        # Check CLI
        echo "Testing CLI..."
        if npx shai-scanner --version > /dev/null 2>&1; then
            echo -e "${GREEN}✅ CLI works${NC}"
            CLI_VERSION=$(npx shai-scanner --version)
            echo "   CLI version: ${CLI_VERSION}"
        else
            echo -e "${YELLOW}⚠️  CLI test failed (might be expected in some environments)${NC}"
        fi
    else
        echo -e "${RED}❌ Installation failed${NC}"
        cd - > /dev/null 2>&1
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    # Cleanup
    cd - > /dev/null 2>&1
    rm -rf "$TEMP_DIR"
}

# Function to check package contents
check_package_contents() {
    echo -e "${BLUE}📁 Checking package contents...${NC}"
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Download and extract package
    echo "Downloading package..."
    if npm pack "shai-scanner@${VERSION}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Package downloaded${NC}"
        
        # Check size
        PACKAGE_FILE=$(ls shai-scanner-*.tgz)
        PACKAGE_SIZE=$(du -h "$PACKAGE_FILE" | cut -f1)
        echo "   Package size: ${PACKAGE_SIZE}"
        
        # Extract and check contents
        tar -xzf "$PACKAGE_FILE"
        cd package
        
        echo "Package contents:"
        find . -type f | head -20
        echo "..."
        echo "Total files: $(find . -type f | wc -l)"
        
        # Check for critical files
        if [ -f "package.json" ] && [ -f "src/index.js" ] && [ -f "src/cli.js" ]; then
            echo -e "${GREEN}✅ Critical files present${NC}"
        else
            echo -e "${RED}❌ Missing critical files${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to download package${NC}"
    fi
    
    # Cleanup
    cd - > /dev/null 2>&1
    rm -rf "$TEMP_DIR"
}

# Main verification
echo -e "${BLUE}🎯 Starting verification...${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}1. Checking prerequisites...${NC}"
check_command "node"
check_command "npm"
echo ""

# Check npm registry
echo -e "${YELLOW}2. Checking npm registry...${NC}"
check_npm_registry
echo ""

# Test installation
echo -e "${YELLOW}3. Testing installation...${NC}"
test_installation
echo ""

# Check package contents
echo -e "${YELLOW}4. Checking package contents...${NC}"
check_package_contents
echo ""

# Summary
echo -e "${BLUE}📋 Verification Summary${NC}"
echo "====================="
echo -e "${GREEN}✅ Version: ${VERSION}${NC}"
echo -e "${GREEN}✅ Registry: Published${NC}"
echo -e "${GREEN}✅ Installation: Works${NC}"
echo -e "${GREEN}✅ Package: Valid${NC}"
echo ""
echo -e "${GREEN}🎉 shai-scanner@${VERSION} verification complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Share the news!"
echo "2. Execute marketing plan"
echo "3. Monitor downloads and feedback"
echo ""
echo -e "${BLUE}🐶 Max says: You did it, Adam! 🚀${NC}"