# Installation/Setup Issue Response Templates

**Category:** Installation/Setup Issues  
**Last Updated:** 2026-05-02  
**Maintainer:** Max 🐶 (code-puppy-df9bb5)

---

## Table of Contents

1. [System Requirements Check Template](#61-system-requirements-check-template)
2. [Step-by-Step Installation Guide Template](#62-step-by-step-installation-guide-template)
3. [Environment Troubleshooting Template](#63-environment-troubleshooting-template)
4. [Alternative Installation Methods Template](#64-alternative-installation-methods-template)

---

## 6.1 System Requirements Check Template

**Template Name:** `install_requirements`  
**Description:** Help user verify system requirements  
**When to use:** For installation failures due to system issues

**Template Content:**
```markdown
Hi [User/Team Name],

It looks like you're having trouble installing Shai-Scanner. Let's check your system requirements.

**System Requirements:**
- ✅ Node.js 18.0.0 or higher
- ✅ npm 8.0.0 or higher
- ✅ Operating System: Linux, macOS, or Windows 10+

**Please Run These Checks:**
```bash
# Check Node.js version
node --version
# Should be: v18.0.0 or higher

# Check npm version  
npm --version
# Should be: 8.0.0 or higher

# Check available disk space
df -h .
# Need at least: 100MB free

# Check permissions
ls -la /usr/local/lib/node_modules/
# Should have write permissions
```

**Common Issues & Fixes:**

1. **Node.js too old:**
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   
   # Using direct install
   # Download from https://nodejs.org/
   ```

2. **Permission errors:**
   ```bash
   # Fix npm permissions
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   ```

3. **Disk space issues:**
   - Clean npm cache: `npm cache clean --force`
   - Remove old versions: `npm uninstall -g shai-scanner`

**Alternative Installation:**
```bash
# Install globally without sudo
npm install -g shai-scanner --user

# Or use npx for temporary use
npx shai-scanner@latest
```

Let me know what you find!

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

It looks like you're having trouble installing Shai-Scanner. Let's check your system requirements.

**System Requirements:**
- ✅ Node.js 18.0.0 or higher
- ✅ npm 8.0.0 or higher
- ✅ Operating System: Linux, macOS, or Windows 10+

**Please Run These Checks:**
```bash
# Check Node.js version
node --version
# Should be: v18.0.0 or higher

# Check npm version  
npm --version
# Should be: 8.0.0 or higher

# Check available disk space
df -h .
# Need at least: 100MB free

# Check permissions
ls -la /usr/local/lib/node_modules/
# Should have write permissions
```

**Common Issues & Fixes:**

1. **Node.js too old:**
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   
   # Using direct install
   # Download from https://nodejs.org/
   ```

2. **Permission errors:**
   ```bash
   # Fix npm permissions
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   ```

3. **Disk space issues:**
   - Clean npm cache: `npm cache clean --force`
   - Remove old versions: `npm uninstall -g shai-scanner`

**Alternative Installation:**
```bash
# Install globally without sudo
npm install -g shai-scanner --user

# Or use npx for temporary use
npx shai-scanner@latest
```

Let me know what you find!

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Installation Guide](../../README.md#installation)
- [System Requirements](../../TROUBLESHOOTING.md#1-installation-issues)

---

## 6.2 Step-by-Step Installation Guide Template

**Template Name:** `install_step_by_step`  
**Description:** Provide detailed installation guidance  
**When to use:** For users needing detailed setup help

**Template Content:**
```markdown
Hi [User/Team Name],

Let's get Shai-Scanner installed step by step.

**Step 1: Verify Prerequisites**
```bash
# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check npm
npm --version
# Expected: 8.x.x or higher
```

**Step 2: Install Shai-Scanner**
```bash
# Global installation (recommended)
npm install -g shai-scanner

# If you get permission errors:
sudo npm install -g shai-scanner

# Or install locally in your project:
npm install --save-dev shai-scanner
```

**Step 3: Verify Installation**
```bash
# Check version
shai-scanner --version
# Expected: v4.6.0

# Test basic functionality
shai-scanner --help
```

**Step 4: Initial Configuration**
```bash
# Create config file
shai-scanner --init

# This creates .shai-scanner.config.js
# Edit with your preferences
```

**Step 5: Test Run**
```bash
# Run in your project directory
cd /path/to/your/project
shai-scanner

# Or specify project path
shai-scanner --project /path/to/project
```

**Troubleshooting:**
- If `shai-scanner` command not found, check your PATH
- If installation fails, try with `--verbose` flag: `npm install -g shai-scanner --verbose`
- For Windows users, use PowerShell as administrator

**Next Steps:**
- [Quick Start Guide](../../TUI_USAGE_GUIDE.md#quick-start)
- [Configuration Options](../../TUI_USAGE_GUIDE.md#configuration)
- [Tutorials](../../tutorials/)

Let me know which step you're stuck on!

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

Let's get Shai-Scanner installed step by step.

**Step 1: Verify Prerequisites**
```bash
# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check npm
npm --version
# Expected: 8.x.x or higher
```

**Step 2: Install Shai-Scanner**
```bash
# Global installation (recommended)
npm install -g shai-scanner

# If you get permission errors:
sudo npm install -g shai-scanner

# Or install locally in your project:
npm install --save-dev shai-scanner
```

**Step 3: Verify Installation**
```bash
# Check version
shai-scanner --version
# Expected: v4.6.0

# Test basic functionality
shai-scanner --help
```

**Step 4: Initial Configuration**
```bash
# Create config file
shai-scanner --init

# This creates .shai-scanner.config.js
# Edit with your preferences
```

**Step 5: Test Run**
```bash
# Run in your project directory
cd /path/to/your/project
shai-scanner

# Or specify project path
shai-scanner --project /path/to/project
```

**Troubleshooting:**
- If `shai-scanner` command not found, check your PATH
- If installation fails, try with `--verbose` flag: `npm install -g shai-scanner --verbose`
- For Windows users, use PowerShell as administrator

**Next Steps:**
- [Quick Start Guide](../../TUI_USAGE_GUIDE.md#quick-start)
- [Configuration Options](../../TUI_USAGE_GUIDE.md#configuration)
- [Tutorials](../../tutorials/)

Let me know which step you're stuck on!

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Installation Guide](../../README.md#installation)
- [Quick Start](../../TUI_USAGE_GUIDE.md#quick-start)

---

## 6.3 Environment Troubleshooting Template

**Template Name:** `install_environment`  
**Description:** Troubleshoot environment-specific issues  
**When to use:** For environment configuration problems

**Template Content:**
```markdown
Hi [User/Team Name],

Let's troubleshoot your environment setup.

**Common Environment Issues:**

**1. PATH Issues:**
```bash
# Check if shai-scanner is in PATH
which shai-scanner

# If not found, add npm global bin to PATH
export PATH="$(npm bin -g):$PATH"

# Make permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**2. Version Conflicts:**
```bash
# Check for multiple Node.js installations
which -a node
which -a npm

# Use nvm to manage versions
nvm ls
nvm use 18
```

**3. Permission Problems:**
```bash
# Fix npm permissions (Linux/macOS)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npm install -g shai-scanner
```

**4. Corporate Proxy Issues:**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

**5. Container/Docker Issues:**
```dockerfile
# In Dockerfile
FROM node:18-alpine
RUN npm install -g shai-scanner
# Or install locally
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
```

**Diagnostic Commands:**
```bash
# Full environment dump
npm config list
npm config list -g
env | grep -i node
env | grep -i npm
env | grep -i path
```

Please run these and share the results. This will help us pinpoint the exact issue.

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

Let's troubleshoot your environment setup.

**Common Environment Issues:**

**1. PATH Issues:**
```bash
# Check if shai-scanner is in PATH
which shai-scanner

# If not found, add npm global bin to PATH
export PATH="$(npm bin -g):$PATH"

# Make permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**2. Version Conflicts:**
```bash
# Check for multiple Node.js installations
which -a node
which -a npm

# Use nvm to manage versions
nvm ls
nvm use 18
```

**3. Permission Problems:**
```bash
# Fix npm permissions (Linux/macOS)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npm install -g shai-scanner
```

**4. Corporate Proxy Issues:**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

**5. Container/Docker Issues:**
```dockerfile
# In Dockerfile
FROM node:18-alpine
RUN npm install -g shai-scanner
# Or install locally
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
```

**Diagnostic Commands:**
```bash
# Full environment dump
npm config list
npm config list -g
env | grep -i node
env | grep -i npm
env | grep -i path
```

Please run these and share the results. This will help us pinpoint the exact issue.

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Environment Setup](../../TROUBLESHOOTING.md#environment)
- [Docker Usage](../../examples/docker/)

---

## 6.4 Alternative Installation Methods Template

**Template Name:** `install_alternatives`  
**Description:** Provide alternative installation methods  
**When to use:** When standard installation fails

**Template Content:**
```markdown
Hi [User/Team Name],

If the standard installation isn't working, here are alternative methods:

**Method 1: Direct Download**
```bash
# Download latest release
curl -L https://github.com/shai-scanner/shai-scanner/releases/latest/download/shai-scanner-linux-x64 -o shai-scanner
chmod +x shai-scanner
sudo mv shai-scanner /usr/local/bin/

# Or for macOS
curl -L https://github.com/shai-scanner/shai-scanner/releases/latest/download/shai-scanner-darwin-x64 -o shai-scanner
chmod +x shai-scanner
sudo mv shai-scanner /usr/local/bin/
```

**Method 2: Local Installation**
```bash
# Install in your project only
npm install shai-scanner

# Run with npx
npx shai-scanner

# Or create npm script
npm pkg set scripts.scan="shai-scanner"
npm run scan
```

**Method 3: Docker**
```bash
# Run directly
docker run --rm -v $(pwd):/app shai-scanner/shai-scanner

# Or in Dockerfile
FROM node:18-alpine
RUN npm install -g shai-scanner
CMD ["shai-scanner"]
```

**Method 4: From Source**
```bash
# Clone repository
git clone https://github.com/shai-scanner/shai-scanner.git
cd shai-scanner

# Install dependencies
npm install

# Link globally
npm link

# Or run directly
node src/cli.js
```

**Method 5: Package Managers**
```bash
# Homebrew (macOS/Linux)
brew install shai-scanner

# Snap (Linux)
sudo snap install shai-scanner

# WinGet (Windows)
winget install ShaiScanner
```

**Which Method to Choose?**
- **Standard users:** Method 1 (Direct Download)
- **Developers:** Method 2 (Local) or Method 4 (Source)
- **Enterprise/CI:** Method 3 (Docker)
- **Power users:** Method 5 (Package Manager)

Let me know which method works for you!

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi Alex,

If the standard installation isn't working, here are alternative methods:

**Method 1: Direct Download**
```bash
# Download latest release
curl -L https://github.com/shai-scanner/shai-scanner/releases/latest/download/shai-scanner-linux-x64 -o shai-scanner
chmod +x shai-scanner
sudo mv shai-scanner /usr/local/bin/

# Or for macOS
curl -L https://github.com/shai-scanner/shai-scanner/releases/latest/download/shai-scanner-darwin-x64 -o shai-scanner
chmod +x shai-scanner
sudo mv shai-scanner /usr/local/bin/
```

**Method 2: Local Installation**
```bash
# Install in your project only
npm install shai-scanner

# Run with npx
npx shai-scanner

# Or create npm script
npm pkg set scripts.scan="shai-scanner"
npm run scan
```

**Method 3: Docker**
```bash
# Run directly
docker run --rm -v $(pwd):/app shai-scanner/shai-scanner

# Or in Dockerfile
FROM node:18-alpine
RUN npm install -g shai-scanner
CMD ["shai-scanner"]
```

**Method 4: From Source**
```bash
# Clone repository
git clone https://github.com/shai-scanner/shai-scanner.git
cd shai-scanner

# Install dependencies
npm install

# Link globally
npm link

# Or run directly
node src/cli.js
```

**Method 5: Package Managers**
```bash
# Homebrew (macOS/Linux)
brew install shai-scanner

# Snap (Linux)
sudo snap install shai-scanner

# WinGet (Windows)
winget install ShaiScanner
```

**Which Method to Choose?**
- **Standard users:** Method 1 (Direct Download)
- **Developers:** Method 2 (Local) or Method 4 (Source)
- **Enterprise/CI:** Method 3 (Docker)
- **Power users:** Method 5 (Package Manager)

Let me know which method works for you!

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Installation Options](../../README.md#installation)
- [Docker Guide](../../examples/docker/)

---

**[← Back to Main Index](../RESPONSE_TEMPLATES.md)**