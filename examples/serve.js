#!/usr/bin/env node

/**
 * Simple HTTP server to serve the examples
 */

const http = require('http');
const handler = require('serve-handler');
const path = require('path');

const port = process.env.PORT || 3000;

// Configuration for serve-handler
const config = {
  public: path.resolve(__dirname, '..'),
  cleanUrls: false,
  directoryListing: true,
  rewrites: [
    { source: '/examples', destination: '/examples/index.html' }
  ]
};

const server = http.createServer((request, response) => {
  console.log(`${new Date().toISOString()} - ${request.method} ${request.url}`);
  
  return handler(request, response, config)
    .catch(err => {
      console.error('Error serving request:', err);
      response.statusCode = 500;
      response.end('Internal Server Error');
    });
});

server.listen(port, () => {
  console.log('\n🚀 LLM Select and Chat Examples Server\n');
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Main examples page: http://localhost:${port}/examples/`);
  console.log(`Basic example: http://localhost:${port}/examples/basic/`);
  console.log(`Simple example: http://localhost:${port}/examples/simple/`);
  console.log(`React example: http://localhost:${port}/examples/react/`);
  console.log('\nPress Ctrl+C to stop\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
}); 