import react from '@vitejs/plugin-react';
import { defineConfig, resolve } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Enables automatic TSConfig path mapping
    tsconfigPaths: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  },
});