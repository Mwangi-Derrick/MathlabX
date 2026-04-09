/**
 * Vite Configuration for MathlabX
 * 
 * Key considerations:
 *   - WASM files must be served with correct MIME type (application/wasm)
 *   - The Emscripten-generated engine.mjs must not be pre-bundled by Vite
 *   - .wasm files are included as assets so import.meta.url resolves correctly
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/MathlabX/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']  // This ensures single React instance
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      strict: false // Allow loading WASM from the workspace root
    },
    // Serve .wasm files with the correct MIME type
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Include .wasm in the asset pipeline
    assetsInlineLimit: 0, // Never inline WASM as base64
  },

  // Tell Vite to treat .wasm files as assets (importable via URL)
  assetsInclude: ['**/*.wasm'],

  optimizeDeps: {
    // Don't pre-bundle the Emscripten-generated JS glue code.
    // It has special module patterns that Vite's optimizer can't handle.
    exclude: ['../../../wasm/mathlab_x.mjs'],
  },
})
