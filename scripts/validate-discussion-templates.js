#!/usr/bin/env node

/**
 * Validate GitHub Discussion Templates
 * Checks YAML front matter and markdown structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', '.github');

const REQUIRED_TEMPLATES = [
  'DISCUSSION_TEMPLATE_QA.md',
  'DISCUSSION_TEMPLATE_FEATURE.md',
  'DISCUSSION_TEMPLATE_SHOWCASE.md'
];

const REQUIRED_FRONTMATTER_FIELDS = ['title', 'labels'];

function validateYAML(content) {
  const lines = content.split('\n');
  
  if (lines[0] !== '---') {
    return { valid: false, error: 'File must start with ---' };
  }
  
  const endIdx = lines.indexOf('---', 1);
  if (endIdx === -1) {
    return { valid: false, error: 'Missing closing ---' };
  }
  
  const yamlContent = lines.slice(1, endIdx).join('\n');
  
  // Basic validation - check for required fields
  const missingFields = [];
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (!yamlContent.includes(`${field}:`)) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  // Check for labels array format
  if (!yamlContent.includes('labels: [') && !yamlContent.includes('labels:\n  -')) {
    return { valid: false, error: 'Labels should be in array format' };
  }
  
  return { valid: true };
}

function validateMarkdown(content) {
  const issues = [];
  
  // Check for required sections
  if (!content.includes('## ')) {
    issues.push('No markdown sections found (## )');
  }
  
  // Check for helpful comments
  if (!content.includes('<!-- ')) {
    issues.push('No helpful comments found (<!-- -->)');
  }
  
  // Check for checklists
  if (!content.includes('- [ ]')) {
    issues.push('No checklists found (- [ ])');
  }
  
  return { valid: issues.length === 0, issues };
}

function validateTemplate(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n📄 Validating ${filename}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Validate YAML front matter
    const yamlResult = validateYAML(content);
    if (!yamlResult.valid) {
      console.log(`  ❌ YAML Error: ${yamlResult.error}`);
      return false;
    }
    console.log('  ✅ YAML front matter valid');
    
    // Validate markdown structure
    const mdResult = validateMarkdown(content);
    if (!mdResult.valid) {
      console.log('  ⚠️  Markdown warnings:');
      mdResult.issues.forEach(issue => console.log(`    - ${issue}`));
    } else {
      console.log('  ✅ Markdown structure valid');
    }
    
    // Check file size
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    if (sizeKB > 5) {
      console.log(`  ⚠️  File size: ${sizeKB.toFixed(1)} KB (consider keeping under 5KB)`);
    } else {
      console.log(`  ✅ File size: ${sizeKB.toFixed(1)} KB`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`  ❌ Error reading file: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 GitHub Discussion Template Validator');
  console.log('=====================================');
  
  let allValid = true;
  
  // Check each template
  for (const template of REQUIRED_TEMPLATES) {
    const filePath = path.join(TEMPLATES_DIR, template);
    
    if (!fs.existsSync(filePath)) {
      console.log(`\n❌ Missing template: ${template}`);
      allValid = false;
      continue;
    }
    
    const valid = validateTemplate(filePath);
    if (!valid) {
      allValid = false;
    }
  }
  
  console.log('\n=====================================');
  if (allValid) {
    console.log('✅ All templates valid!');
  } else {
    console.log('❌ Some templates have issues');
    process.exit(1);
  }
}

main();

export { validateYAML, validateMarkdown };