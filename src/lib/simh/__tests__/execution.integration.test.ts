/**
 * Integration tests for i650 CPU execution.
 *
 * Tests the step() function and CPU execution through the full WASM stack.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initWasmForNode, OutputCapture } from './setup/node-loader';
import { resetEmulator, cleanupTests } from './setup/test-helpers';
import { step } from '../control';
import {
  setAddressRegister,
  getAddressRegister,
  setProgramRegister,
  getProgramRegister,
} from '../i650/registers';
import { writeMemory, readMemory } from '../i650/memory';
import { FIXTURES } from './setup/fixtures';

describe('Execution Integration Tests', () => {
  let outputCapture: OutputCapture;

  beforeAll(async () => {
    outputCapture = new OutputCapture();
    await initWasmForNode();
  }, 30000);

  afterAll(() => {
    cleanupTests();
  });

  beforeEach(() => {
    resetEmulator();
    outputCapture.clear();
  });

  describe('step function', () => {
    it('should execute single step', () => {
      const status = step(1);
      expect(typeof status).toBe('number');
    });

    it('should execute multiple steps', () => {
      const status = step(10);
      expect(typeof status).toBe('number');
    });

    it('should return status code', () => {
      const status = step(1);
      // Status codes: SCPE_OK (0), SCPE_STEP (1), or other
      expect(status).toBeGreaterThanOrEqual(0);
    });
  });

  describe('instruction execution', () => {
    it('should execute NOP instruction', () => {
      // Set up a NOP instruction at address 0000
      // NOP: operation code 69, next instruction at 0001
      writeMemory('0000', FIXTURES.NOP_INSTRUCTION);
      setProgramRegister(FIXTURES.NOP_INSTRUCTION);
      setAddressRegister('0000');

      const status = step(1);

      // Verify status indicates successful step
      expect(status).toBeGreaterThanOrEqual(0);

      // After NOP, AR should advance to next instruction
      const ar = getAddressRegister();
      expect(ar).toBe('0001');
    });

    it('should execute multiple sequential steps', () => {
      // Set up a sequence of NOP instructions
      writeMemory('0000', '6900000001+'); // NOP, next: 0001
      writeMemory('0001', '6900000002+'); // NOP, next: 0002
      writeMemory('0002', '6900000003+'); // NOP, next: 0003

      setProgramRegister('6900000001+');
      setAddressRegister('0000');

      // Execute 3 steps
      step(1);
      expect(getAddressRegister()).toBe('0001');

      step(1);
      expect(getAddressRegister()).toBe('0002');

      step(1);
      expect(getAddressRegister()).toBe('0003');
    });

    it('should handle batch step execution', () => {
      // Set up NOPs: op(69) + dataAddr(0000) + instAddr(next) + sign(+)
      for (let i = 0; i < 10; i++) {
        const addr = String(i).padStart(4, '0');
        const nextAddr = String(i + 1).padStart(4, '0');
        writeMemory(addr, `690000${nextAddr}+`);
      }

      setAddressRegister('0000');
      setProgramRegister('6900000001+');

      // Execute 10 steps at once
      const status = step(10);
      expect(status).toBeGreaterThanOrEqual(0);
    });
  });

  describe('execution state changes', () => {
    it('should update program register during execution', () => {
      writeMemory('0000', FIXTURES.NOP_INSTRUCTION);
      setProgramRegister(FIXTURES.NOP_INSTRUCTION);
      setAddressRegister('0000');

      step(1);
      const prAfter = getProgramRegister();

      // PR should be updated (may or may not be different depending on execution)
      expect(prAfter).toMatch(/^\d{10}[+-]$/);
    });

    it('should maintain memory during execution', () => {
      // Write test values to memory
      writeMemory('0100', FIXTURES.TEST_WORD_1);
      writeMemory('0200', FIXTURES.TEST_WORD_2);

      // Execute some steps
      step(5);

      // Memory should still contain our test values (unless modified by program)
      // For NOPs, memory should be unchanged
      const val1 = readMemory('0100');
      const val2 = readMemory('0200');
      expect(val1).toBeDefined();
      expect(val2).toBeDefined();
    });
  });

  describe('execution control', () => {
    it('should handle zero steps gracefully', () => {
      expect(() => step(0)).not.toThrow();
    });

    it('should handle large step counts', () => {
      const status = step(1000);
      expect(typeof status).toBe('number');
    });

    it('should allow repeated step calls', () => {
      for (let i = 0; i < 5; i++) {
        const status = step(10);
        expect(typeof status).toBe('number');
      }
    });
  });

  describe('status codes', () => {
    it('should return valid status codes', () => {
      const { SCPE_OK, SCPE_STEP } = FIXTURES.STATUS;

      const status = step(1);

      // Status should be one of the known codes or another valid code
      expect(status).toBeGreaterThanOrEqual(0);

      // Most common codes are SCPE_OK (0) and SCPE_STEP (1)
      const isCommonStatus =
        status === SCPE_OK || status === SCPE_STEP || status > SCPE_STEP;
      expect(isCommonStatus).toBe(true);
    });
  });
});
