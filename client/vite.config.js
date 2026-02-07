// =============================================================================
// client/vite.config.js — Vite Build Configuration
// =============================================================================
//
// Vite is the build tool for the React frontend. This config:
//   1. Enables React (JSX transform via @vitejs/plugin-react)
//   2. Proxies /api and /socket.io requests to the Express backend
//      This avoids CORS issues in development.
//
// In development:
//   - Vite dev server runs on port 5173
//   - API calls to /api/* are forwarded to Express on port 3001
//   - Socket.IO connections are also forwarded
//
// In production:
//   - `npm run build` outputs to client/dist/
//   - Express serves the built files directly (no Vite needed)
//
// =============================================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    // Proxy API and Socket.IO requests to the Express backend during development.
    // The React app calls "/api/conversation" and Vite forwards it to Express.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // Express server
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',  // Socket.IO on Express
        ws: true,                          // Enable WebSocket proxying
        changeOrigin: true,
      },
    },
  },
});
