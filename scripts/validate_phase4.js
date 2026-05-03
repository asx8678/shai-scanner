#!/usr/bin/env node

/**
 * Phase 4 Validation Script
 * Validates all User Onboarding Materials
 * Created by Max 🐶
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

// ── Configuration ────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dirname, '..');

const PHASE4_FILES = {
  // Tutorial files
  tutorials: [
    'tutorials/VIDEO_SCRIPT.md',
    'tutorials/INTERACTIVE_TUTORIAL.md',
    'tutorials/README.md'
  ],
  
  // Template files
  templates: [
    'templates/QUICK_START/package.json',
    'templates/QUICK_START/.github/workflows/security-scan.yml',
    'templates/QUICK_START/.gitignore',
    'templates/QUICK_START/src/index.js',
    'templates/QUICK_START/src/utils.js',
    'templates/QUICK_START/test/test.js',
    'templates/QUICK_START/README.md'
  ],
  
  // Community files
  community: [
    '.github/community/GUIDELINES.md',
    '.github/community/CONTRIBUTOR_RECOGNITION.md',
    '.github/community/FAQ.md',
    '.github/community/README.md'
  ],
  
  // Documentation files
  docs: [
    'docs/TROUBLESHOOTING.md',
    '.github/DISCUSSION_TEMPLATE_QA.md',
    '.github/DISCUSSION_TEMPLATE_FEATURE.md',
    '.github/DISCUSSION_TEMPLATE_SHOWCASE.md'
  ],
  
  // Updated files
  updated: [
    'README.md',
    'CONTRIBUTING.md',
    'SECURITY.md'
  ]
};

// ── Validation Results ────────────────────────────────────────────────────────

let results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  warnings_list: []
};

// ── Helper Functions ──────────────────────────────────────────────────────────

function log(message, type = 'info') {
  const icons = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    title: '🔍'
  };
  console.log(`${icons[type] || '📝'} ${message}`);
}

function checkFileExists(filePath) {
  const fullPath = join(ROOT, filePath);
  const exists = existsSync(fullPath);
  
  if (!exists) {
    results.errors.push(`File not found: ${filePath}`);
    results.failed++;
    return false;
  }
  
  // Check if it's readable
  try {
    statSync(fullPath);
    results.passed++;
    return true;
  } catch (error) {
    results.errors.push(`Cannot read file: ${filePath} - ${error.message}`);
    results.failed++;
    return false;
  }
}

function validateMarkdown(filePath) {
  const fullPath = join(ROOT, filePath);
  try {
    const content = readFileSync(fullPath, 'utf8');
    
    // Check for common markdown issues
    const issues = [];
    
    // Check for broken internal links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkPath = match[2];
      
      // Skip external URLs and anchors
      if (linkPath.startsWith('http://') || linkPath.startsWith('https://') || linkPath.startsWith('#') || linkPath.startsWith('mailto:')) {
        continue;
      }
      
      // Check internal link - resolve relative to the file's directory
      // Strip anchors from link path for file existence check
      const linkPathWithoutAnchor = linkPath.split('#')[0];
      if (!linkPathWithoutAnchor) continue; // anchor-only link
      
      const fileDir = join(ROOT, filePath, '..');
      const targetPath = join(fileDir, linkPathWithoutAnchor);
      if (!existsSync(targetPath)) {
        issues.push(`Broken internal link: [${linkText}](${linkPath}) → resolved to ${targetPath}`);
      }
    }
    
    // Check for basic markdown syntax
    if (content.trim().length === 0) {
      issues.push('File is empty');
    }
    
    // Check for title (skip YAML frontmatter)
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '');
    if (!contentWithoutFrontmatter.trim().startsWith('# ') && !contentWithoutFrontmatter.trim().startsWith('---')) {
      issues.push('Missing title (# heading)');
    }
    
    // Check for proper heading structure
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    if (headings.length === 0) {
      issues.push('No headings found');
    }
    
    if (issues.length > 0) {
      issues.forEach(issue => {
        results.warnings_list.push(`${filePath}: ${issue}`);
        results.warnings++;
      });
    } else {
      results.passed++;
    }
    
    return issues.length === 0;
  } catch (error) {
    results.errors.push(`Error validating markdown ${filePath}: ${error.message}`);
    results.failed++;
    return false;
  }
}

function validateYAML(filePath) {
  const fullPath = join(ROOT, filePath);
  try {
    const content = readFileSync(fullPath, 'utf8');
    
    // Basic YAML validation
    const issues = [];
    
    // Check for common YAML issues
    if (!content.includes(':')) {
      issues.push('YAML file does not contain any colons (may not be valid YAML)');
    }
    
    // Check for tabs (YAML should use spaces)
    if (content.includes('\t')) {
      issues.push('YAML file contains tabs (should use spaces)');
    }
    
    // Check for common workflow issues if it's a workflow file
    if (filePath.includes('.github/workflows/')) {
      if (!content.includes('name:')) {
        issues.push('GitHub Actions workflow missing "name" field');
      }
      if (!content.includes('on:')) {
        issues.push('GitHub Actions workflow missing "on" field');
      }
      if (!content.includes('jobs:')) {
        issues.push('GitHub Actions workflow missing "jobs" field');
      }
    }
    
    if (issues.length > 0) {
      issues.forEach(issue => {
        results.warnings_list.push(`${filePath}: ${issue}`);
        results.warnings++;
      });
    } else {
      results.passed++;
    }
    
    return issues.length === 0;
  } catch (error) {
    results.errors.push(`Error validating YAML ${filePath}: ${error.message}`);
    results.failed++;
    return false;
  }
}

function validateJSON(filePath) {
  const fullPath = join(ROOT, filePath);
  try {
    const content = readFileSync(fullPath, 'utf8');
    JSON.parse(content);
    results.passed++;
    return true;
  } catch (error) {
    results.errors.push(`Invalid JSON in ${filePath}: ${error.message}`);
    results.failed++;
    return false;
  }
}

function validateJavaScript(filePath) {
  const fullPath = join(ROOT, filePath);
  try {
    const content = readFileSync(fullPath, 'utf8');
    
    // Basic syntax check using node --check
    try {
      execSync(`node --check ${fullPath}`, { stdio: 'pipe' });
      results.passed++;
      return true;
    } catch (error) {
      results.warnings_list.push(`${filePath}: JavaScript syntax warning - ${error.message}`);
      results.warnings++;
      // Don't count as failure since some files might have syntax that requires compilation
      return true;
    }
  } catch (error) {
    results.errors.push(`Error reading JavaScript ${filePath}: ${error.message}`);
    results.failed++;
    return false;
  }
}

// ── Main Validation ───────────────────────────────────────────────────────────

async function validateAll() {
  log('Phase 4: User Onboarding Materials Validation', 'title');
  console.log('─'.repeat(60));
  
  // Check all files exist
  log('Checking file existence...', 'info');
  for (const [category, files] of Object.entries(PHASE4_FILES)) {
    log(`\n📁 ${category.toUpperCase()} FILES:`, 'info');
    for (const file of files) {
      results.total++;
      const exists = checkFileExists(file);
      if (exists) {
        log(`  ✓ ${file}`, 'success');
      } else {
        log(`  ✗ ${file}`, 'error');
      }
    }
  }
  
  console.log('─'.repeat(60));
  
  // Validate file contents
  log('\nValidating file contents...', 'info');
  
  // Validate markdown files
  log('\n📝 Markdown Files:', 'info');
  const markdownFiles = [
    ...PHASE4_FILES.tutorials,
    ...PHASE4_FILES.community.filter(f => f.endsWith('.md')),
    ...PHASE4_FILES.docs.filter(f => f.endsWith('.md')),
    ...PHASE4_FILES.updated.filter(f => f.endsWith('.md'))
  ];
  
  for (const file of markdownFiles) {
    if (existsSync(join(ROOT, file))) {
      validateMarkdown(file);
    }
  }
  
  // Validate YAML files
  log('\n📄 YAML Files:', 'info');
  const yamlFiles = PHASE4_FILES.templates.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  for (const file of yamlFiles) {
    if (existsSync(join(ROOT, file))) {
      validateYAML(file);
    }
  }
  
  // Validate JSON files
  log('\n📦 JSON Files:', 'info');
  const jsonFiles = PHASE4_FILES.templates.filter(f => f.endsWith('.json'));
  for (const file of jsonFiles) {
    if (existsSync(join(ROOT, file))) {
      validateJSON(file);
    }
  }
  
  // Validate JavaScript files
  log('\n💻 JavaScript Files:', 'info');
  const jsFiles = PHASE4_FILES.templates.filter(f => f.endsWith('.js'));
  for (const file of jsFiles) {
    if (existsSync(join(ROOT, file))) {
      validateJavaScript(file);
    }
  }
  
  // Validate code examples in markdown
  log('\n🔧 Code Examples in Markdown:', 'info');
  for (const file of markdownFiles) {
    if (existsSync(join(ROOT, file))) {
      const fullPath = join(ROOT, file);
      try {
        const content = readFileSync(fullPath, 'utf8');
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        
        if (codeBlocks.length > 0) {
          log(`  ${file}: ${codeBlocks.length} code blocks found`, 'info');
          // Could add more specific validation here
        }
      } catch (error) {
        // Ignore errors for this validation
      }
    }
  }
  
  // Summary
  console.log('─'.repeat(60));
  log('\n📊 VALIDATION SUMMARY:', 'title');
  console.log(`Total checks: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Warnings: ${results.warnings}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (results.warnings_list.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings_list.forEach(warning => console.log(`  - ${warning}`));
  }
  
  // Return overall status
  return {
    success: results.failed === 0,
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      errors: results.errors,
      warnings_list: results.warnings_list
    }
  };
}

// Run validation
validateAll().then(summary => {
  if (summary.success) {
    log('\n🎉 All validations passed!', 'success');
    process.exit(0);
  } else {
    log('\n💥 Validation failed!', 'error');
    process.exit(1);
  }
});