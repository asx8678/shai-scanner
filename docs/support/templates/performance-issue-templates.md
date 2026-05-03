# Performance Issue Response Templates

**Category:** Performance Issues  
**Last Updated:** 2026-05-02  
**Maintainer:** Max 🐶 (code-puppy-df9bb5)

---

## Table of Contents

1. [Initial Response Template](#51-initial-response-template)
2. [Diagnostic Information Request Template](#52-diagnostic-information-request-template)
3. [Workaround Template](#53-workaround-template)
4. [Resolution Template](#54-resolution-template)

---

## 5.1 Initial Response Template

**Template Name:** `performance_initial`  
**Description:** Acknowledge performance issue and start investigation  
**When to use:** Immediately after receiving performance report

**Template Content:**
```markdown
Hi [User/Team Name],

Thanks for reporting this performance issue. We take performance seriously!

**Issue Reference:** [PERF-YYYY-XXX]  
**Status:** Under Investigation  
**Priority:** [Based on impact]

**Initial Assessment:**
- [Brief initial observation if any]
- [What we're checking first]

**What We Need From You:**
1. **Environment Details:**
   - Node.js version
   - Project size (number of dependencies)
   - Hardware specs (CPU, RAM)

2. **Command Used:**
   ```bash
   [exact command they ran]
   ```

3. **Expected vs Actual:**
   - Expected runtime: [if they had expectation]
   - Actual runtime: [measured time]

**Performance Baseline:**
- Small projects (<100 deps): ~2-5 seconds
- Medium projects (100-1000 deps): ~10-30 seconds
- Large projects (1000+ deps): ~1-3 minutes

We'll investigate and get back to you with findings or optimization suggestions.

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi DevOps Team,

Thanks for reporting this performance issue. We take performance seriously!

**Issue Reference:** PERF-2026-008  
**Status:** Under Investigation  
**Priority:** High (affecting CI/CD pipelines)

**Initial Assessment:**
- Scanning appears to hang on projects with circular dependencies
- We're checking symlink traversal logic first

**What We Need From You:**
1. **Environment Details:**
   - Node.js version
   - Project size (number of dependencies)
   - Hardware specs (CPU, RAM)

2. **Command Used:**
   ```bash
   shai-scanner --mode offline --project ./large-project
   ```

3. **Expected vs Actual:**
   - Expected runtime: ~2 minutes
   - Actual runtime: 15+ minutes (seems stuck)

**Performance Baseline:**
- Small projects (<100 deps): ~2-5 seconds
- Medium projects (100-1000 deps): ~10-30 seconds
- Large projects (1000+ deps): ~1-3 minutes

We'll investigate and get back to you with findings or optimization suggestions.

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Performance Guide](../../TROUBLESHOOTING.md#5-performance-issues)
- [Benchmarking](../../examples/benchmarking/)

---

## 5.2 Diagnostic Information Request Template

**Template Name:** `performance_diagnostics`  
**Description:** Request detailed diagnostic information  
**When to use:** When initial info is insufficient

**Template Content:**
```markdown
Hi [User/Team Name],

Thanks for the additional details on [PERF-YYYY-XXX]. To help us pinpoint the issue, could you provide:

**1. Performance Metrics:**
```bash
# Run with built-in profiler
shai-scanner --profile --output json > profile.json

# Or use Node.js profiler
node --prof src/cli.js [your-arguments]
```

**2. System Information:**
```bash
# System info
uname -a
node --version
npm --version
shai-scanner --version

# Resource usage during scan
top -b -n 1 | head -20
free -h
```

**3. Project Metrics:**
```bash
# Dependency count
npm ls --all | wc -l

# Package size
du -sh node_modules/

# Circular dependencies (if any)
npx madge --circular src/
```

**4. Network Conditions (if using live mode):**
```bash
# Test connectivity
curl -I https://osv.dev
curl -I https://api.github.com
```

**5. Logs:**
```bash
# Run with debug logging
DEBUG=* shai-scanner [your-arguments] 2>&1 | tee debug.log
```

Please run these and share the results. This will help us identify exactly where the bottleneck is.

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi DevOps Team,

Thanks for the additional details on PERF-2026-008. To help us pinpoint the issue, could you provide:

**1. Performance Metrics:**
```bash
# Run with built-in profiler
shai-scanner --profile --output json > profile.json

# Or use Node.js profiler
node --prof src/cli.js --mode offline --project ./large-project
```

**2. System Information:**
```bash
# System info
uname -a
node --version
npm --version
shai-scanner --version

# Resource usage during scan
top -b -n 1 | head -20
free -h
```

**3. Project Metrics:**
```bash
# Dependency count
npm ls --all | wc -l

# Package size
du -sh node_modules/

# Circular dependencies (if any)
npx madge --circular src/
```

**4. Network Conditions (if using live mode):**
```bash
# Test connectivity
curl -I https://osv.dev
curl -I https://api.github.com
```

**5. Logs:**
```bash
# Run with debug logging
DEBUG=* shai-scanner --mode offline --project ./large-project 2>&1 | tee debug.log
```

Please run these and share the results. This will help us identify exactly where the bottleneck is.

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Profiling Guide](../../TROUBLESHOOTING.md#profiling)
- [Debug Mode](../../TUI_USAGE_GUIDE.md#debug-options)

---

## 5.3 Workaround Template

**Template Name:** `performance_workaround`  
**Description:** Provide immediate workaround for performance issue  
**When to use:** When fix will take time but workaround is available

**Template Content:**
```markdown
Hi [User/Team Name],

Thanks for your patience on [PERF-YYYY-XXX]. While we work on a permanent fix, here are some workarounds:

**Immediate Workarounds:**

1. **Optimize Scanning Scope:**
   ```bash
   # Scan only production dependencies
   shai-scanner --production
   
   # Exclude large directories
   shai-scanner --ignore node_modules/lib --ignore node_modules/vendor
   ```

2. **Adjust Resource Usage:**
   ```bash
   # Limit concurrent operations
   shai-scanner --concurrency 2
   
   # Reduce memory usage
   NODE_OPTIONS="--max-old-space-size=4096" shai-scanner
   ```

3. **Alternative Approaches:**
   ```bash
   # Use incremental scanning
   shai-scanner --incremental --cache ./scan-cache
   
   # Split large projects
   shai-scanner --project ./project-a --project ./project-b
   ```

4. **Hardware Considerations:**
   - Increase available RAM if possible
   - Use faster storage (SSD vs HDD)
   - Run during off-peak hours

**Timeline for Permanent Fix:**
- Investigation: [Date]
- Fix ready: [Date]

**Monitoring Progress:**
We'll update you every [timeframe] on our progress.

Let me know if these workarounds help!

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi DevOps Team,

Thanks for your patience on PERF-2026-008. While we work on a permanent fix, here are some workarounds:

**Immediate Workarounds:**

1. **Optimize Scanning Scope:**
   ```bash
   # Scan only production dependencies
   shai-scanner --production
   
   # Exclude large directories
   shai-scanner --ignore node_modules/lib --ignore node_modules/vendor
   ```

2. **Adjust Resource Usage:**
   ```bash
   # Limit concurrent operations
   shai-scanner --concurrency 2
   
   # Reduce memory usage
   NODE_OPTIONS="--max-old-space-size=4096" shai-scanner
   ```

3. **Alternative Approaches:**
   ```bash
   # Use incremental scanning
   shai-scanner --incremental --cache ./scan-cache
   
   # Split large projects
   shai-scanner --project ./project-a --project ./project-b
   ```

4. **Hardware Considerations:**
   - Increase available RAM if possible
   - Use faster storage (SSD vs HDD)
   - Run during off-peak hours

**Timeline for Permanent Fix:**
- Investigation: May 3, 2026
- Fix ready: May 10, 2026

**Monitoring Progress:**
We'll update you every 24 hours on our progress.

Let me know if these workarounds help!

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Performance Optimization](../../TROUBLESHOOTING.md#optimization)
- [Configuration Options](../../TUI_USAGE_GUIDE.md#options)

---

## 5.4 Resolution Template

**Template Name:** `performance_resolution`  
**Description:** Confirm performance issue has been resolved  
**When to use:** When performance fix is released

**Template Content:**
```markdown
Hi [User/Team Name],

Great news! 🎉 We've resolved the performance issue [PERF-YYYY-XXX].

**Fix Details:**
- **Root Cause:** [Brief explanation]
- **Optimization:** [What was improved]
- **Performance Gain:** [X times faster / Y% improvement]

**Update Instructions:**
```bash
npm install -g shai-scanner@[version]
```

**Verification:**
```bash
# Run your original command
shai-scanner [original-arguments]

# Check performance metrics
shai-scanner --profile --output json > profile.json
```

**Expected Results:**
- Before: [Previous performance]
- After: [New performance]

**Additional Improvements:**
- [Related performance enhancements]
- [New profiling tools added]
- [Configuration options for tuning]

**Please Test:**
Run your usual scanning workflow and let us know if the performance is now acceptable.

**Thanks for Your Patience:**
We appreciate you working with us to identify and resolve this issue. Your feedback helps us make Shai-Scanner better for everyone.

Best regards,  
[Your Name]  
Shai-Scanner Support Team
```

**Example Usage:**
```markdown
Hi DevOps Team,

Great news! 🎉 We've resolved the performance issue PERF-2026-008.

**Fix Details:**
- **Root Cause:** Circular dependency detection was causing infinite loops
- **Optimization:** Added cycle detection and memoization
- **Performance Gain:** 10x faster for projects with circular dependencies

**Update Instructions:**
```bash
npm install -g shai-scanner@4.6.2
```

**Verification:**
```bash
# Run your original command
shai-scanner --mode offline --project ./large-project

# Check performance metrics
shai-scanner --profile --output json > profile.json
```

**Expected Results:**
- Before: 15+ minutes (seemed stuck)
- After: ~2 minutes (normal performance)

**Additional Improvements:**
- Added `--max-depth` flag for circular dependency limits
- New performance profiling tools
- Better memory management for large projects

**Please Test:**
Run your usual scanning workflow and let us know if the performance is now acceptable.

**Thanks for Your Patience:**
We appreciate you working with us to identify and resolve this issue. Your feedback helps us make Shai-Scanner better for everyone.

Best regards,  
Max  
Shai-Scanner Support Team
```

**Related Documentation:**
- [Performance Changelog](../../CHANGELOG.md#performance)
- [Profiling Tools](../../TUI_USAGE_GUIDE.md#profiling)

---

**[← Back to Main Index](../RESPONSE_TEMPLATES.md)**