/**
 * Integration test for the SIMH i650 test suite.
 *
 * Verifies the full emulator stack by running i650_test.ini.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initWasmForNode } from './setup/node-loader';
import { cleanupTests, resetEmulator } from './setup/test-helpers';
import { sendCommand } from '../index';

// Long-running; keep this as the only i650-specific integration test.
describe('i650 SIMH Test Suite', () => {
  beforeAll(async () => {
    await initWasmForNode();
  }, 60000);

  afterAll(() => {
    cleanupTests();
  });

  it(
    'should run i650_test.ini and pass all tests',
    () => {
      resetEmulator();
      const output = sendCommand('DO /tests/i650_test.ini');
      expect(output).toMatch(/All Tests Passed/i);
    },
    60000
  );
});
