#!/usr/bin/env node

/**
 * Cross-platform script runner
 * Runs bash scripts on Linux/macOS and PowerShell scripts on Windows
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const scriptName = process.argv[2];
const args = process.argv.slice(3);

if (!scriptName) {
  console.error('Usage: node run-script.js <script-name> [args...]');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const scriptsDir = path.join(__dirname);

let scriptPath;
let command;

if (isWindows) {
  scriptPath = path.join(scriptsDir, `${scriptName}.ps1`);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    process.exit(1);
  }
  // Use absolute path and ensure UTF-8 encoding
  const absPath = path.resolve(scriptPath);
  command = `powershell -ExecutionPolicy Bypass -NoProfile -File "${absPath.replace(/"/g, '`"')}" ${args.join(' ')}`;
} else {
  scriptPath = path.join(scriptsDir, `${scriptName}.sh`);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    process.exit(1);
  }
  // Make script executable
  try {
    fs.chmodSync(scriptPath, '755');
  } catch (e) {
    // Ignore if chmod fails
  }
  command = `bash "${scriptPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
}

try {
  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  process.exit(error.status || 1);
}

