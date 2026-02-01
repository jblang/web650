/**
 * Integration test for the full i650 SIMH test suite.
 *
 * Runs the complete i650_test.ini script and verifies all tests pass.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initWasmForNode, OutputCapture } from './setup/node-loader';
import { cleanupTests } from './setup/test-helpers';
import { sendCommand } from '../index';

describe('i650 SIMH Test Suite', () => {
  let outputCapture: OutputCapture;

  beforeAll(async () => {
    outputCapture = new OutputCapture();
    await initWasmForNode(outputCapture);
  }, 30000);

  afterAll(() => {
    cleanupTests();
  });

  it('should run i650_test.ini and pass all tests', () => {
    // Clear any previous output
    outputCapture.clear();

    // Run the full SIMH test suite
    const output = sendCommand('DO /tests/i650_test.ini');

    // Get all output
    const allOutput = outputCapture.getOutput();
    const combinedOutput = output + '\n' + allOutput;

    console.log('Test suite output:', combinedOutput);

    // Verify the test suite completed successfully
    expect(combinedOutput).toContain('!! All Tests Passed !!');
  }, 300000); // 5 minute timeout for the full test suite
});
