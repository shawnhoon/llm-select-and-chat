import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This allows the example to import from the src directory of the parent project
      // which is useful for development
      'llm-select-and-chat': path.resolve(__dirname, '../../src')
    }
  },
  // Development server configuration
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  // Ensure proper library resolution
  optimizeDeps: {
    include: ['react', 'react-dom', 'styled-components'],
    // Force Vite to prebundle the library too
    force: true
  },
  // Enable more detailed logs
  logLevel: 'info',
  // Customize the dev server for better debugging
  base: './'
}); 