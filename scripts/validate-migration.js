#!/usr/bin/env node

/**
 * Migration Validation Script
 * Checks if components have been properly migrated to the new architecture.
 *
 * Usage: node scripts/validate-migration.js
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Components to check — each maps a component name to where it currently lives
// and what it should look like after migration.
const COMPONENTS = [
  {
    name: 'Box',
    // After migration the Box class should live in this file.
    migratedFile: 'src/tui/components/box.js',
    // While not yet migrated, it still lives here:
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'static draw\\(',
    ],
  },
  {
    name: 'TextInput',
    migratedFile: 'src/tui/components/input.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'handleKey\\(key\\)',
      'static async run\\(',
    ],
  },
  {
    name: 'confirm',
    migratedFile: 'src/tui/components/input.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'static async run\\(',
    ],
  },
  {
    name: 'Spinner',
    migratedFile: 'src/tui/components/progress.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'mount\\(\\)',
      'unmount\\(\\)',
    ],
  },
  {
    name: 'ProgressBar',
    migratedFile: 'src/tui/components/progress.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'setState\\(',
    ],
  },
  {
    name: 'SelectMenu',
    migratedFile: 'src/tui/components/menu.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'handleKey\\(key\\)',
      'static async run\\(',
    ],
  },
  {
    name: 'CheckboxMenu',
    migratedFile: 'src/tui/components/menu.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'handleKey\\(key\\)',
      'static async run\\(',
    ],
  },
  {
    name: 'FileBrowser',
    migratedFile: 'src/tui/components/browser.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'handleKey\\(key\\)',
      'mount\\(\\)',
    ],
  },
  {
    name: 'LiveProgress',
    migratedFile: 'src/tui/components/progress.js',
    legacyFile: 'src/tui.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'mount\\(\\)',
      'unmount\\(\\)',
    ],
  },
  {
    name: 'FindingsBrowser',
    migratedFile: 'src/tui/components/findings.js',
    legacyFile: 'src/tui-findings.js',
    patterns: [
      'extends Component',
      'render\\(screen, ctx\\)',
      'mount\\(\\)',
      'unmount\\(\\)',
    ],
  },
];

// Anti-patterns to check for
const ANTI_PATTERNS = [
  {
    name: 'Direct stdout writes',
    pattern: /process\.stdout\.write\(/g,
    message: 'Component writes directly to stdout',
  },
  {
    name: 'Direct stderr writes',
    pattern: /process\.stderr\.write\(/g,
    message: 'Component writes directly to stderr',
  },
  {
    name: 'ANSI.moveUp calls',
    pattern: /ANSI\.moveUp\(/g,
    message: 'Component uses ANSI.moveUp (should use VirtualScreen)',
  },
];

// Component lifecycle methods that should be checked for anti-patterns
const LIFECYCLE_METHODS = ['render', 'mount', 'unmount', 'handleKey'];

/**
 * Extract method bodies from all classes in a file.
 * Returns an array of { name, startLine, endLine, body } for ALL lifecycle methods
 * (supports files with multiple classes like menu.js which has SelectMenu + CheckboxMenu)
 */
function extractMethodBodies(content) {
  const methods = [];
  const lines = content.split('\n');
  
  // Simple regex to find method definitions
  const methodRegex = /^\s+(static\s+)?(async\s+)?(\w+)\s*\(/;
  
  let currentMethod = null;
  let braceDepth = 0;
  let methodStartLine = -1;
  let methodBody = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(methodRegex);
    
    if (match && braceDepth === 0) {
      // Found a new method at the top level
      const isStatic = !!match[1];
      const methodName = match[3];
      
      // Skip if it's a static method or not a lifecycle method
      if (!isStatic && LIFECYCLE_METHODS.includes(methodName)) {
        currentMethod = methodName;
        methodStartLine = i;
        methodBody = [];
        braceDepth = 0;
      }
    }
    
    if (currentMethod) {
      // Count braces to find method end
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }
      
      methodBody.push(line);
      
      // Method ends when braces are balanced
      if (braceDepth === 0 && methodBody.length > 1) {
        methods.push({
          name: currentMethod,
          startLine: methodStartLine,
          endLine: i,
          body: methodBody.join('\n'),
        });
        currentMethod = null;
        methodBody = [];
      }
    }
  }
  
  return methods;
}

/**
 * Check if a file has both Component-based and legacy static methods
 */
function hasBackwardCompatiblePatterns(content) {
  const hasStaticRun = /static\s+async\s+(run|browse)\s*\(/.test(content);
  const hasComponentExtension = /extends\s+Component/.test(content);
  const hasLifecycleMethods = LIFECYCLE_METHODS.some(method => {
    // Match method definitions like "  render(screen, ctx)" or "  mount()"
    const methodRegex = new RegExp(`^\\s+(?:static\\s+)?(?:async\\s+)?${method}\\s*\\(`, 'm');
    return methodRegex.test(content);
  });
  
  return hasStaticRun && hasComponentExtension && hasLifecycleMethods;
}

/**
 * Check anti-patterns only in lifecycle methods, excluding static methods
 */
function checkAntiPatternsInLifecycle(content, antiPatterns) {
  const results = [];
  const methodBodies = extractMethodBodies(content);
  
  // Check all lifecycle method occurrences (supports files with multiple classes)
  for (const methodInfo of methodBodies) {
    for (const antiPattern of antiPatterns) {
      const matches = methodInfo.body.match(antiPattern.pattern);
      if (matches) {
        results.push({
          method: methodInfo.name,
          antiPattern: antiPattern.name,
          count: matches.length,
          line: methodInfo.startLine + 1,
        });
      }
    }
  }
  
  return results;
}

class MigrationValidator {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
    this.migratedCount = 0;
    this.legacyCount = 0;
  }

  async validate() {
    console.log('🔍 Migration Validation Script\n');
    console.log('Checking components...\n');

    for (const component of COMPONENTS) {
      await this.checkComponent(component);
    }

    // Run basic tests to ensure components work
    await this.runBasicTests();

    this.printSummary();
    return this.errors.length === 0;
  }

  async checkComponent(component) {
    // Check if the component has been migrated to its new file
    const migratedPath = join(ROOT_DIR, component.migratedFile);
    const legacyPath = join(ROOT_DIR, component.legacyFile);
    
    let migrated = false;
    let content = '';
    let activeFile = '';
    
    try {
      content = await readFile(migratedPath, 'utf8');
      migrated = true;
      activeFile = component.migratedFile;
      this.migratedCount++;
    } catch {
      // Not migrated yet, check legacy file
      try {
        content = await readFile(legacyPath, 'utf8');
        activeFile = component.legacyFile;
        this.legacyCount++;
        this.warnings.push(`${component.name} still in legacy location (${component.legacyFile})`);
      } catch (error) {
        this.results.push({
          component: component.name,
          file: component.migratedFile,
          passed: false,
          error: 'File not found in either location',
        });
        this.errors.push({
          component: component.name,
          issues: [{ name: 'File exists', passed: false }],
        });
        return;
      }
    }
    
    const checks = [];
    
    // Check if migrated to new file
    checks.push({
      name: 'Migrated to new file',
      passed: migrated,
      details: migrated ? component.migratedFile : `Still in ${component.legacyFile}`,
    });
    
    // Check required patterns
    for (const pattern of component.patterns) {
      const regex = new RegExp(pattern);
      checks.push({
        name: `Pattern: ${pattern}`,
        passed: regex.test(content),
      });
    }
    
    // Check anti-patterns (only in migrated files)
    if (migrated) {
      // Check if file has backward-compatible static methods
      const isBackwardCompatible = hasBackwardCompatiblePatterns(content);
      
      if (isBackwardCompatible) {
        // For backward-compatible files, only check lifecycle methods
        const lifecycleIssues = checkAntiPatternsInLifecycle(content, ANTI_PATTERNS);
        
        if (lifecycleIssues.length > 0) {
          for (const issue of lifecycleIssues) {
            checks.push({
              name: `No ${issue.antiPattern} in ${issue.method}()`,
              passed: false,
              details: `${issue.count} occurrences found (line ${issue.line})`,
            });
          }
        } else {
          checks.push({
            name: 'No anti-patterns in lifecycle methods',
            passed: true,
            details: 'Backward-compatible static methods allowed',
          });
        }
      } else {
        // For regular files, check entire content
        for (const antiPattern of ANTI_PATTERNS) {
          const matches = content.match(antiPattern.pattern);
          checks.push({
            name: `No ${antiPattern.name}`,
            passed: !matches,
            details: matches ? `${matches.length} occurrences found` : undefined,
          });
        }
      }
    }
    
    const passed = checks.every(c => c.passed);
    const failedChecks = checks.filter(c => !c.passed);
    
    this.results.push({
      component: component.name,
      file: activeFile,
      migrated,
      passed,
      checks,
      failedChecks,
    });
    
    if (!passed) {
      this.errors.push({
        component: component.name,
        issues: failedChecks,
      });
    }
  }

  async runBasicTests() {
    console.log('\n🧪 Running basic component tests...\n');
    
    const tests = [
      {
        name: 'Import TUI module',
        fn: async () => {
          const { default: tui } = await import('../src/tui/index.js');
          if (!tui) throw new Error('Failed to import TUI module');
        },
      },
      {
        name: 'Import core components',
        fn: async () => {
          const { Component, EventBus, VirtualScreen } = await import('../src/tui/index.js');
          if (!Component) throw new Error('Component not exported');
          if (!EventBus) throw new Error('EventBus not exported');
          if (!VirtualScreen) throw new Error('VirtualScreen not exported');
        },
      },
      {
        name: 'Import legacy components',
        fn: async () => {
          const { Spinner, ProgressBar, SelectMenu, TextInput } = await import('../src/tui/index.js');
          if (!Spinner) throw new Error('Spinner not exported');
          if (!ProgressBar) throw new Error('ProgressBar not exported');
          if (!SelectMenu) throw new Error('SelectMenu not exported');
          if (!TextInput) throw new Error('TextInput not exported');
        },
      },
      {
        name: 'Component base class has required methods',
        fn: async () => {
          const { Component } = await import('../src/tui/index.js');
          const methods = ['mount', 'unmount', 'render', 'handleKey', 'setState'];
          for (const method of methods) {
            if (typeof Component.prototype[method] !== 'function') {
              throw new Error(`Component.${method} is not a function`);
            }
          }
        },
      },
      {
        name: 'Spinner can be instantiated',
        fn: async () => {
          const { Spinner } = await import('../src/tui/index.js');
          const spinner = new Spinner('test');
          if (!spinner) throw new Error('Failed to create Spinner instance');
        },
      },
      {
        name: 'ProgressBar can be instantiated',
        fn: async () => {
          const { ProgressBar } = await import('../src/tui/index.js');
          const progress = new ProgressBar({ total: 100 });
          if (!progress) throw new Error('Failed to create ProgressBar instance');
        },
      },
    ];
    
    for (const test of tests) {
      try {
        await test.fn();
        console.log(`  ✅ ${test.name}`);
        this.results.push({
          component: `Test: ${test.name}`,
          passed: true,
          checks: [],
          failedChecks: [],
          isTest: true,
        });
      } catch (error) {
        console.error(`  ❌ ${test.name}: ${error.message}`);
        this.results.push({
          component: `Test: ${test.name}`,
          passed: false,
          error: error.message,
          checks: [],
          failedChecks: [{ name: 'Test passed', passed: false }],
          isTest: true,
        });
        this.errors.push({
          component: `Test: ${test.name}`,
          issues: [{ name: 'Test passed', passed: false }],
        });
      }
    }
  }

  printSummary() {
    console.log('\n📊 Results:\n');
    
    for (const result of this.results) {
      if (result.isTest) continue; // Tests printed inline
      
      const icon = result.passed ? '✅' : '❌';
      const migratedIcon = result.migrated ? '🆕' : '📦';
      console.log(`${icon} ${migratedIcon} ${result.component}`);
      
      if (result.error) {
        console.log(`   ⚠️  ${result.error}`);
      } else if (result.failedChecks.length > 0) {
        for (const check of result.failedChecks) {
          console.log(`   ❌ ${check.name}`);
          if (check.details) {
            console.log(`      ${check.details}`);
          }
        }
      }
    }
    
    console.log('\n📈 Summary:');
    const componentResults = this.results.filter(r => !r.isTest);
    const passed = componentResults.filter(r => r.passed).length;
    const total = componentResults.length;
    console.log(`   ${passed}/${total} components validated`);
    console.log(`   ${this.migratedCount} migrated, ${this.legacyCount} legacy`);
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      for (const warning of this.warnings) {
        console.log(`   • ${warning}`);
      }
    }
    
    if (this.errors.length > 0) {
      console.log(`\n   ❌ ${this.errors.length} components need attention`);
      process.exit(1);
    } else {
      console.log('\n   ✅ All components properly migrated!');
    }
  }
}

// Run validator
const validator = new MigrationValidator();
validator.validate().then(success => {
  process.exit(success ? 0 : 1);
});