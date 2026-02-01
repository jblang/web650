/**
 * Integration tests for SIMH API commands.
 *
 * Tests the sendCommand, examineState, and depositState functions
 * through the full WASM stack.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initWasmForNode, OutputCapture } from './setup/node-loader';
import { resetEmulator, cleanupTests } from './setup/test-helpers';
import { sendCommand, examineState, depositState } from '../index';
import { FIXTURES } from './setup/fixtures';

describe('API Integration Tests', () => {
  let outputCapture: OutputCapture;

  beforeAll(async () => {
    outputCapture = new OutputCapture();
    await initWasmForNode(outputCapture);
  }, 30000);

  afterAll(() => {
    cleanupTests();
  });

  beforeEach(() => {
    resetEmulator();
    outputCapture.clear();
  });

  describe('sendCommand', () => {
    it('should execute RESET command', () => {
      const output = sendCommand('RESET');
      expect(output).toBeDefined();
    });

    it('should execute EXAMINE command and return output', () => {
      const output = sendCommand('EXAMINE AR');
      expect(output).toBeDefined();
      expect(output).toContain('AR');
    });

    it('should execute DEPOSIT command', () => {
      const output = sendCommand('DEPOSIT AR 1234');
      expect(output).toBeDefined();
    });

    it('should handle multiple commands in sequence', () => {
      sendCommand('RESET');
      sendCommand('DEPOSIT AR 1234');
      const output = sendCommand('EXAMINE AR');
      expect(output).toContain('1234');
    });
  });

  describe('examineState', () => {
    it('should read address register', () => {
      const state = examineState('AR');
      expect(state).toHaveProperty('AR');
      // SIMH returns AR as 5-digit value; i650 wrapper normalizes to 4
      expect(state.AR).toMatch(/^\d{5}$/);
    });

    it('should read program register', () => {
      const state = examineState('PR');
      expect(state).toHaveProperty('PR');
      expect(state.PR).toMatch(/^\d{10}[+-]$/);
    });

    it('should read distributor', () => {
      const state = examineState('DIST');
      expect(state).toHaveProperty('DIST');
      expect(state.DIST).toMatch(/^\d{10}[+-]$/);
    });

    it('should read accumulator registers', () => {
      const stateAccLo = examineState('ACCLO');
      const stateAccUp = examineState('ACCUP');

      expect(stateAccLo).toHaveProperty('ACCLO');
      expect(stateAccUp).toHaveProperty('ACCUP');
      expect(stateAccLo.ACCLO).toMatch(/^\d{10}[+-]$/);
      expect(stateAccUp.ACCUP).toMatch(/^\d{10}[+-]$/);
    });

    it('should read memory address', () => {
      const state = examineState('0100');
      // SIMH returns memory keys without leading zeros (100, not 0100)
      expect(state).toHaveProperty('100');
      expect(state['100']).toMatch(/^\d{10}[+-]$/);
    });
  });

  describe('depositState', () => {
    it('should set address register', () => {
      depositState('AR', '5678');
      const state = examineState('AR');
      expect(state.AR).toBe('05678');
    });

    it('should set program register', () => {
      depositState('PR', FIXTURES.TEST_WORD_1);
      const state = examineState('PR');
      expect(state.PR).toBe(FIXTURES.TEST_WORD_1);
    });

    it('should set distributor', () => {
      depositState('DIST', FIXTURES.TEST_WORD_2);
      const state = examineState('DIST');
      expect(state.DIST).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should set memory address', () => {
      depositState('0100', FIXTURES.TEST_WORD_1);
      const state = examineState('0100');
      // SIMH returns memory keys without leading zeros
      expect(state['100']).toBe(FIXTURES.TEST_WORD_1);
    });

    it('should persist values across multiple operations', () => {
      depositState('AR', '1234');
      depositState('PR', FIXTURES.TEST_WORD_1);
      depositState('0100', FIXTURES.TEST_WORD_2);

      const ar = examineState('AR');
      const pr = examineState('PR');
      const mem = examineState('0100');

      expect(ar.AR).toBe('01234');
      expect(pr.PR).toBe(FIXTURES.TEST_WORD_1);
      expect(mem['100']).toBe(FIXTURES.TEST_WORD_2);
    });
  });

  describe('error handling', () => {
    it('should handle invalid commands gracefully', () => {
      const output = sendCommand('INVALID_COMMAND');
      expect(output).toBeDefined();
    });

    it('should handle examining non-existent register', () => {
      const output = sendCommand('EXAMINE NONEXISTENT');
      expect(output).toBeDefined();
    });
  });
});
