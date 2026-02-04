import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**', 'playwright.config.ts'],
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
