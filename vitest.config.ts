import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

const testConfig = {
  environment: 'jsdom',
  setupFiles: ['src/test/setup.ts'],
  exclude: [...(configDefaults.exclude ?? []), 'e2e/**', 'playwright.config.ts'],
  coverage: {
    exclude: [
      ...(configDefaults.coverage.exclude ?? []),
      'public/**',
      '**/*.scss',
      'src/lib/simh/__tests__/**',
      'src/lib/simh/index.ts',
      'src/lib/simh/i650/index.ts',
    ],
    thresholds: {
      lines: 70,
      statements: 70,
      functions: 68,
      branches: 55,
    },
  },
  environmentMatchGlobs: [
    // Integration tests run in Node environment
    ['**/*.integration.test.ts', 'node'],
  ],
  testTimeout: 10000,
  hookTimeout: 30000,
} as unknown as { [key: string]: unknown };

export default defineConfig({
  test: testConfig,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
