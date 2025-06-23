#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDocker = fs.existsSync('/.dockerenv');
const hasDevDependencies = fs.existsSync('./node_modules/nodemon'); // Development indicator

// Skip check in production builds or when no dev dependencies are installed
if (isProduction || (isDocker && !hasDevDependencies)) {
  console.log('🔇 Skipping package manager check in production environment');
  process.exit(0);
}

console.log('🔍 Checking package manager compatibility...\n');

// Check lock files in current directory
const projectRoot = process.cwd();
const packageLockExists = fs.existsSync(path.join(projectRoot, 'package-lock.json'));
const yarnLockExists = fs.existsSync(path.join(projectRoot, 'yarn.lock'));
const pnpmLockExists = fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'));

console.log('📁 Detected lock files:');
console.log(`  - package-lock.json: ${packageLockExists ? '✅' : '❌'}`);
console.log(`  - yarn.lock: ${yarnLockExists ? '⚠️' : '❌'}`);
console.log(`  - pnpm-lock.yaml: ${pnpmLockExists ? '⚠️' : '❌'}`);

console.log('\n💡 Recommendations:');

if (packageLockExists && !yarnLockExists && !pnpmLockExists) {
  console.log('✅ Project configuration is correct! Using npm as intended.');
} else if (packageLockExists && (yarnLockExists || pnpmLockExists)) {
  console.log('⚠️  Multiple lock files detected! This may cause version conflicts.');
  console.log('   Recommend removing lock files other than package-lock.json.');
  
  // Show specific removal commands
  if (yarnLockExists) {
    console.log('   To remove: rm yarn.lock');
  }
  if (pnpmLockExists) {
    console.log('   To remove: rm pnpm-lock.yaml');
  }
} else if (!packageLockExists && (yarnLockExists || pnpmLockExists)) {
  console.log('❌ Non-npm package manager detected!');
  console.log('   This project is optimized for npm. Please use: npm install');
} else {
  console.log('❌ No lock files detected. Please run: npm install');
}

console.log('\n📖 For more information, see package manager compatibility section in README.md.');

// Exit with warning code if issues detected in development environment
if (yarnLockExists || pnpmLockExists) {
  console.log('\n⚠️  Package manager compatibility issues detected.');
  process.exit(1);
}
