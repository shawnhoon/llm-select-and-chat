#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const EXAMPLES_DIR = __dirname;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// Create server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Normalize URL to prevent path traversal
  let normalizedUrl = req.url.split('?')[0]; // Remove query params
  
  // Convert repeated slashes to a single slash and remove trailing slash
  normalizedUrl = normalizedUrl.replace(/\/+/g, '/');
  if (normalizedUrl !== '/' && normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }
  
  // Get file path based on normalized URL
  let filePath = path.join(EXAMPLES_DIR, normalizedUrl === '/' ? '/index.html' : normalizedUrl);
  
  // If path is a directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Get file extension
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Special case for accessing the dist directory (one level up)
  if (normalizedUrl.startsWith('/dist/')) {
    filePath = path.join(__dirname, '..', normalizedUrl);
  }

  // Check if file exists
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        const indexPath = path.join(EXAMPLES_DIR, 'index.html');
        
        // Try to serve the examples index
        if (fs.existsSync(indexPath)) {
          fs.readFile(indexPath, (err, content) => {
            if (err) {
              console.error(err);
              res.writeHead(500);
              res.end('Server Error');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          });
        } else {
          // Show examples list if no index.html
          fs.readdir(EXAMPLES_DIR, (err, files) => {
            if (err) {
              console.error(err);
              res.writeHead(500);
              res.end('Server Error');
              return;
            }
            
            const examples = files.filter(file => {
              const filePath = path.join(EXAMPLES_DIR, file);
              return fs.statSync(filePath).isDirectory() && file !== 'node_modules';
            });
            
            const html = `
              <!DOCTYPE html>
              <html>
              <head>
                <title>SelectChat Examples</title>
                <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                  }
                  h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
                  ul { list-style-type: none; padding: 0; }
                  li { margin-bottom: 10px; }
                  a { 
                    display: block;
                    padding: 10px 15px;
                    background-color: #f5f5f5;
                    border-radius: 4px;
                    text-decoration: none;
                    color: #333;
                    transition: background-color 0.2s;
                  }
                  a:hover { background-color: #e0e0e0; }
                </style>
              </head>
              <body>
                <h1>SelectChat Examples</h1>
                <ul>
                  ${examples.map(example => `
                    <li><a href="/${example}">${example}</a></li>
                  `).join('')}
                </ul>
              </body>
              </html>
            `;
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html, 'utf-8');
          });
        }
      } else {
        // Server error
        console.error(err);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Available examples:`);
  
  // List available examples
  fs.readdir(EXAMPLES_DIR, (err, files) => {
    if (err) {
      console.error('Error reading examples directory:', err);
      return;
    }
    
    const examples = files.filter(file => {
      const filePath = path.join(EXAMPLES_DIR, file);
      return fs.statSync(filePath).isDirectory() && file !== 'node_modules';
    });
    
    examples.forEach(example => {
      console.log(`- http://localhost:${PORT}/${example}`);
    });
  });
}); 