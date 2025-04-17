#!/usr/bin/env node
const path = require('path');
const { exec } = require('child_process');

// Compile the TypeScript files first
console.log('Compiling TypeScript files...');
exec('npx tsc --project tsconfig.json', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error compiling TypeScript: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`TypeScript compilation warnings/errors: ${stderr}`);
  }
  
  // Run the test
  console.log('Running LLM adapter tests...');
  const { testLLMAdapters } = require('../dist/tests/testLLMAdapter');
  
  // Execute the test function
  testLLMAdapters()
    .then(() => {
      console.log('Test execution completed.');
    })
    .catch((err) => {
      console.error('Error during test execution:', err);
      process.exit(1);
    });
}); 