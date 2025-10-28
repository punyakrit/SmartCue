#!/usr/bin/env node

/**
 * System Requirements Checker
 * Verifies that the system meets the requirements for Meeting Notes App
 */

const os = require('os');

console.log('🔍 Checking system requirements for Meeting Notes App...\n');

// Check platform
const platform = process.platform;
console.log(`Platform: ${platform}`);

if (platform !== 'darwin') {
  console.log('❌ FAILED: This app requires macOS');
  console.log('   Please run this app on a Mac computer.\n');
  process.exit(1);
}

// Check architecture
const arch = process.arch;
console.log(`Architecture: ${arch}`);

const isAppleSilicon = arch === 'arm64';
if (!isAppleSilicon) {
  console.log('❌ FAILED: This app requires Apple Silicon (M1, M2, M3, or newer)');
  console.log('   Your Mac appears to be using an Intel processor, which is not supported.');
  console.log('   Please run this app on an Apple Silicon Mac.\n');
  process.exit(1);
}

// Check macOS version
const release = os.release();
const majorVersion = parseInt(release.split('.')[0]);
const minorVersion = parseInt(release.split('.')[1]);

console.log(`macOS Version: ${majorVersion}.${minorVersion}`);

// macOS 11.0+ (Big Sur) is required for Apple Silicon
if (majorVersion < 20) { // macOS 11.0 = Darwin 20.x
  console.log('❌ FAILED: This app requires macOS 11.0 (Big Sur) or later');
  console.log('   Your macOS version is too old for Apple Silicon support.');
  console.log('   Please update your Mac to macOS 11.0 or later.\n');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
console.log(`Node.js Version: ${nodeVersion}`);

// Check available memory
const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
console.log(`Total Memory: ${totalMem} GB`);

if (totalMem < 8) {
  console.log('⚠️  WARNING: Less than 8GB RAM detected');
  console.log('   The app may run slowly on systems with less than 8GB RAM.');
}

console.log('\n✅ All system requirements met!');
console.log('   ✓ macOS platform');
console.log('   ✓ Apple Silicon architecture');
console.log('   ✓ Compatible macOS version');
console.log('\n🚀 Ready to run: npm start');
