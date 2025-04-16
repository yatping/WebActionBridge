#!/usr/bin/env node

/**
 * This is a compatibility script for running the server on 
 * older Node.js versions that don't support import.meta.dirname.
 * 
 * Instead of running `yarn dev` directly, use `node dev.js`
 */

const { exec } = require('child_process');
const path = require('path');
const os = require('os');

// Set the necessary environment variables
process.env.NODE_ENV = 'development';

// Use __dirname as a fallback for import.meta.dirname
global.__dirname = path.resolve('.');

// Start the server
const isWindows = os.platform() === 'win32';
const command = isWindows 
  ? 'npx tsx server/index.ts' 
  : 'NODE_ENV=development npx tsx server/index.ts';

console.log('Starting development server with compatibility mode...');
const child = exec(command);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code) => {
  process.exit(code);
});