import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      // Integration tests run in Node environment
      ['**/*.integration.test.ts', 'node'],
    ],
    testTimeout: 10000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
