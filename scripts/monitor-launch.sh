#!/bin/bash

# Launch Monitoring Script for shai-scanner
# Usage: ./scripts/monitor-launch.sh [--continuous] [--interval <minutes>]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CONTINUOUS=false
INTERVAL=60  # minutes
VERSION=$(node -p "require('./package.json').version")

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --continuous|-c)
      CONTINUOUS=true
      shift
      ;;
    --interval|-i)
      INTERVAL=$2
      shift 2
      ;;
    --version|-v)
      VERSION=$2
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--continuous] [--interval <minutes>] [--version <version>]"
      echo ""
      echo "Options:"
      echo "  --continuous, -c    Run continuously"
      echo "  --interval, -i      Check interval in minutes (default: 60)"
      echo "  --version, -v       Version to monitor (default: from package.json)"
      echo "  --help, -h          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Function to display timestamp
timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

# Function to monitor npm package
monitor_npm() {
  echo -e "${BLUE}[$(timestamp)] 🔍 npm Package Monitoring${NC}"
  echo "--------------------------------------"
  
  # Check if package exists
  if npm view "shai-scanner@${VERSION}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Package shai-scanner@${VERSION} exists on npm${NC}"
    
    # Get package info
    echo -e "${BLUE}Package Info:${NC}"
    npm view "shai-scanner@${VERSION}" version dist-tags.latest dist.unpackedSize time | head -10
    
    # Check dist-tags
    LATEST=$(npm view shai-scanner dist-tags.latest 2>/dev/null)
    if [ "$LATEST" = "$VERSION" ]; then
      echo -e "${GREEN}✅ Latest tag points to v${VERSION}${NC}"
    else
      echo -e "${YELLOW}⚠️  Latest tag points to v${LATEST}, expected v${VERSION}${NC}"
    fi
  else
    echo -e "${RED}❌ Package shai-scanner@${VERSION} not found on npm${NC}"
  fi
  
  echo ""
}

# Function to monitor GitHub
monitor_github() {
  echo -e "${BLUE}[$(timestamp)] 🐙 GitHub Monitoring${NC}"
  echo "----------------------------------"
  
  # Check GitHub release
  if gh release view "v${VERSION}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ GitHub release v${VERSION} exists${NC}"
    
    # Get release info
    echo -e "${BLUE}Release Info:${NC}"
    gh release view "v${VERSION}" --json tagName,publishedAt,assets | head -10
  else
    echo -e "${YELLOW}⚠️  GitHub release v${VERSION} not found${NC}"
  fi
  
  # Check recent issues
  echo -e "${BLUE}Recent Issues:${NC}"
  gh issue list --limit 5 --state open
  
  # Check recent workflows
  echo -e "${BLUE}Recent Workflows:${NC}"
  gh run list --workflow=publish.yml --limit 3
  
  echo ""
}

# Function to monitor community
monitor_community() {
  echo -e "${BLUE}[$(timestamp)] 👥 Community Monitoring${NC}"
  echo "------------------------------------"
  
  # Check GitHub stars (approximate)
  echo -e "${BLUE}Repository Stats:${NC}"
  gh repo view asx8678/shai-scanner --json stargazerCount,forkCount,issues | \
    jq '{stars: .stargazerCount, forks: .forkCount, openIssues: .issues | length}'
  
  # Check recent commits
  echo -e "${BLUE}Recent Commits:${NC}"
  git log --oneline -5
  
  echo ""
}

# Function to display monitoring summary
display_summary() {
  echo -e "${BLUE}[$(timestamp)] 📊 Monitoring Summary${NC}"
  echo "=================================="
  echo ""
  echo -e "${BLUE}Version:${NC} ${VERSION}"
  echo -e "${BLUE}Time:${NC} $(timestamp)"
  echo ""
  
  # npm status
  if npm view "shai-scanner@${VERSION}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ npm: Published${NC}"
  else
    echo -e "${RED}❌ npm: Not published${NC}"
  fi
  
  # GitHub status
  if gh release view "v${VERSION}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ GitHub: Release created${NC}"
  else
    echo -e "${YELLOW}⚠️  GitHub: Release pending${NC}"
  fi
  
  echo ""
  echo -e "${BLUE}Next check in ${INTERVAL} minutes...${NC}"
  echo "Press Ctrl+C to stop monitoring"
  echo ""
}

# Main monitoring loop
main() {
  echo -e "${BLUE}🚀 SHAI-SCANNER LAUNCH MONITORING${NC}"
  echo "=================================="
  echo -e "${BLUE}Monitoring version: ${VERSION}${NC}"
  echo -e "${BLUE}Mode: $([ "$CONTINUOUS" = true ] && echo "Continuous" || echo "One-time")${NC}"
  echo -e "${BLUE}Interval: ${INTERVAL} minutes${NC}"
  echo ""
  
  if [ "$CONTINUOUS" = true ]; then
    echo -e "${YELLOW}Starting continuous monitoring...${NC}"
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
      monitor_npm
      monitor_github
      monitor_community
      display_summary
      
      echo -e "${YELLOW}Sleeping for ${INTERVAL} minutes...${NC}"
      sleep $((INTERVAL * 60))
      echo ""
    done
  else
    # One-time monitoring
    monitor_npm
    monitor_github
    monitor_community
    display_summary
  fi
}

# Run main function
main