#!/usr/bin/env node

/**
 * This script checks that all the expected exports are available in the built package.
 * Run this after building the package and before publishing to ensure all exports work.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;

// Path to the built dist/index.esm.js file
const builtEsmPath = path.resolve(__dirname, '../dist/index.esm.js');

// Check if the file exists
if (!fs.existsSync(builtEsmPath)) {
  console.error('Error: Built ESM file not found. Run npm run build first.');
  process.exit(1);
}

// Read the file content
const fileContent = fs.readFileSync(builtEsmPath, 'utf8');

// Expected exports - add or remove as needed
const expectedExports = [
  'SelectChat',
  'ChatInterface',
  'AbstractLLMAdapter',
  'LLMAdapterFactory',
  'OpenAIAdapter',
  'GeminiAdapter',
  'createTheme',
  'lightTheme',
  'darkTheme',
  'ThemeProvider',
  'useSelectionCapture'
];

// Check each expected export
let allExportsFound = true;
for (const exportName of expectedExports) {
  // Use a more flexible regex pattern to detect exports
  const exportPattern = new RegExp(`export\\s+{\\s*(?:[^{}]*,\\s*)?${exportName}(?:\\s*,|\\s*})`);
  if (!exportPattern.test(fileContent)) {
    console.error(`Error: Expected export "${exportName}" not found in the built package.`);
    allExportsFound = false;
  }
}

if (allExportsFound) {
  console.log('✅ All expected exports found in the built package.');
} else {
  console.error('❌ Some exports are missing. Check src/index.ts to ensure all exports are properly declared.');
  process.exit(1);
}

// Check that the vanilla JS build is created
const vanillaBuildPath = path.resolve(__dirname, '../dist/index.umd.js');
if (!fs.existsSync(vanillaBuildPath)) {
  console.error('Error: UMD build not found. Check the build configuration.');
  process.exit(1);
} else {
  console.log('✅ UMD build found.');
}

console.log('Export check completed successfully.'); 