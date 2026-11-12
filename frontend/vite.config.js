import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Target modern browsers for smaller output
    target: 'es2020',

    // Inline small assets directly into CSS/JS
    assetsInlineLimit: 4096,

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Minify with esbuild (faster than terser, nearly same output)
    minify: 'esbuild',

    // Raise warning threshold (recharts is large but cached after first load)
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps vendor libs separate for long-term caching
        manualChunks: {
          'react-vendor':   ['react', 'react-dom'],
          'router':         ['react-router-dom'],
          'charts':         ['recharts'],
          'http':           ['axios'],
        },
        // Content-hash filenames for optimal cache busting
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
  },

  // Pre-bundle deps for faster cold starts in dev
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'recharts'],
  },
});
