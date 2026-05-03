#!/usr/bin/env node

/**
 * Check GitHub setup and templates
 * Validates that all required GitHub files are present and properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const GITHUB_DIR = path.join(ROOT_DIR, '.github');

const REQUIRED_DISCUSSION_TEMPLATES = [
  'DISCUSSION_TEMPLATE_QA.md',
  'DISCUSSION_TEMPLATE_FEATURE.md',
  'DISCUSSION_TEMPLATE_SHOWCASE.md'
];

const REQUIRED_ISSUE_TEMPLATES = [
  'bug_report.md',
  'feature_request.md'
];

const REQUIRED_COMMUNITY_FILES = [
  'README.md',
  'GUIDELINES.md',
  'CONTRIBUTOR_RECOGNITION.md',
  'FAQ.md'
];

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${exists ? 'Found' : 'Missing'}`);
  return exists;
}

function checkDirectoryStructure() {
  console.log('🔍 Checking GitHub directory structure\n');
  
  let allGood = true;
  
  // Check main directories
  const dirs = [
    { path: GITHUB_DIR, name: '.github' },
    { path: path.join(GITHUB_DIR, 'community'), name: '.github/community' },
    { path: path.join(GITHUB_DIR, 'workflows'), name: '.github/workflows' },
    { path: path.join(GITHUB_DIR, 'ISSUE_TEMPLATE'), name: '.github/ISSUE_TEMPLATE' }
  ];
  
  for (const dir of dirs) {
    const exists = fs.existsSync(dir.path);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${dir.name} directory: ${exists ? 'Found' : 'Missing'}`);
    if (!exists) allGood = false;
  }
  
  return allGood;
}

function checkDiscussionTemplates() {
  console.log('\n📋 Checking Discussion Templates\n');
  
  let allGood = true;
  
  for (const template of REQUIRED_DISCUSSION_TEMPLATES) {
    const filePath = path.join(GITHUB_DIR, template);
    const exists = checkFileExists(filePath, template);
    if (!exists) allGood = false;
  }
  
  return allGood;
}

function checkIssueTemplates() {
  console.log('\n🐛 Checking Issue Templates\n');
  
  let allGood = true;
  
  for (const template of REQUIRED_ISSUE_TEMPLATES) {
    const filePath = path.join(GITHUB_DIR, 'ISSUE_TEMPLATE', template);
    const exists = checkFileExists(filePath, template);
    if (!exists) allGood = false;
  }
  
  return allGood;
}

function checkCommunityFiles() {
  console.log('\n👥 Checking Community Files\n');
  
  let allGood = true;
  
  for (const file of REQUIRED_COMMUNITY_FILES) {
    const filePath = path.join(GITHUB_DIR, 'community', file);
    const exists = checkFileExists(filePath, file);
    if (!exists) allGood = false;
  }
  
  return allGood;
}

function checkWorkflows() {
  console.log('\n⚙️  Checking Workflows\n');
  
  const workflowDir = path.join(GITHUB_DIR, 'workflows');
  if (!fs.existsSync(workflowDir)) {
    console.log('❌ Workflows directory missing');
    return false;
  }
  
  const workflowFiles = fs.readdirSync(workflowDir).filter(file => file.endsWith('.yml'));
  
  if (workflowFiles.length === 0) {
    console.log('❌ No workflow files found');
    return false;
  }
  
  console.log(`✅ Found ${workflowFiles.length} workflow(s):`);
  workflowFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  return true;
}

function main() {
  console.log('🚀 GitHub Setup Checker for shai-scanner\n');
  console.log('==========================================\n');
  
  const results = {
    directoryStructure: checkDirectoryStructure(),
    discussionTemplates: checkDiscussionTemplates(),
    issueTemplates: checkIssueTemplates(),
    communityFiles: checkCommunityFiles(),
    workflows: checkWorkflows()
  };
  
  console.log('\n==========================================');
  console.log('📊 Summary\n');
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('✅ All GitHub setup checks passed!');
    console.log('\nYour GitHub configuration is ready for community engagement.');
  } else {
    console.log('❌ Some checks failed');
    console.log('\nPlease review the missing items above.');
  }
  
  console.log('\n==========================================');
  
  if (!allPassed) {
    process.exit(1);
  }
}

main();