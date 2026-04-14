import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Disable code splitting to fix module resolution issues
    rollupOptions: {
      output: {
        // Don't split chunks - bundle into single file
        inlineDynamicImports: true,
      },
    },
    // Target modern browsers
    target: 'ES2020',
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
