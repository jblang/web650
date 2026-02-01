/**
 * Integration tests for i650 memory configurations.
 *
 * Tests memory access across different drum sizes (1K, 2K, 4K) and
 * verifies special register-mapped memory locations.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initWasmForNode, OutputCapture } from './setup/node-loader';
import { resetEmulator, cleanupTests } from './setup/test-helpers';
import { readMemory, writeMemory } from '../i650/memory';
import {
  setMemorySize,
  getConsoleSwitches,
  setConsoleSwitches,
  getDistributor,
  setDistributor,
  getLowerAccumulator,
  setLowerAccumulator,
  getUpperAccumulator,
  setUpperAccumulator,
} from '../i650/registers';
import { FIXTURES } from './setup/fixtures';

describe('Memory Configuration Integration Tests', () => {
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

  describe('1K memory configuration', () => {
    beforeEach(() => {
      setMemorySize('1K');
    });

    it('should access memory in range 0000-0999', () => {
      writeMemory('0000', FIXTURES.TEST_WORD_1);
      writeMemory('0500', FIXTURES.TEST_WORD_2);
      writeMemory('0999', FIXTURES.TEST_WORD_3);

      expect(readMemory('0000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('0500')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('0999')).toBe(FIXTURES.TEST_WORD_3);
    });

    it('should handle out-of-range addresses gracefully', () => {
      // SIMH returns empty for out-of-range addresses
      const result = readMemory('1000');
      expect(result).toBeUndefined();
    });
  });

  describe('2K memory configuration', () => {
    beforeEach(() => {
      setMemorySize('2K');
    });

    it('should access memory in range 0000-1999', () => {
      writeMemory('0000', FIXTURES.TEST_WORD_1);
      writeMemory('1000', FIXTURES.TEST_WORD_2);
      writeMemory('1999', FIXTURES.TEST_WORD_3);

      expect(readMemory('0000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('1000')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('1999')).toBe(FIXTURES.TEST_WORD_3);
    });

    it('should handle out-of-range addresses gracefully', () => {
      const result = readMemory('2000');
      expect(result).toBeUndefined();
    });
  });

  describe('4K memory configuration', () => {
    beforeEach(() => {
      setMemorySize('4K');
    });

    it('should access memory in range 0000-3999', () => {
      writeMemory('0000', FIXTURES.TEST_WORD_1);
      writeMemory('2000', FIXTURES.TEST_WORD_2);
      writeMemory('3999', FIXTURES.TEST_WORD_3);

      expect(readMemory('0000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('2000')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('3999')).toBe(FIXTURES.TEST_WORD_3);
    });

    it('should handle out-of-range addresses gracefully', () => {
      const result = readMemory('4000');
      expect(result).toBeUndefined();
    });
  });

  describe('special register-mapped addresses (read-only)', () => {
    it('should read console switches at 8000', () => {
      setConsoleSwitches(FIXTURES.TEST_WORD_1);

      // Read via memory address 8000
      const memValue = readMemory('8000');
      expect(memValue).toBe(FIXTURES.TEST_WORD_1);

      // Verify consistency with register accessor
      expect(getConsoleSwitches()).toBe(FIXTURES.TEST_WORD_1);

      // Modify register and verify memory address reflects it
      setConsoleSwitches(FIXTURES.TEST_WORD_2);
      expect(readMemory('8000')).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should read distributor at 8001', () => {
      setDistributor(FIXTURES.TEST_WORD_1);

      // Read via memory address 8001
      const memValue = readMemory('8001');
      expect(memValue).toBe(FIXTURES.TEST_WORD_1);

      // Verify consistency with register accessor
      expect(getDistributor()).toBe(FIXTURES.TEST_WORD_1);

      // Modify register and verify memory address reflects it
      setDistributor(FIXTURES.TEST_WORD_2);
      expect(readMemory('8001')).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should read lower accumulator at 8002', () => {
      setLowerAccumulator(FIXTURES.TEST_WORD_1);

      // Read via memory address 8002
      const memValue = readMemory('8002');
      expect(memValue).toBe(FIXTURES.TEST_WORD_1);

      // Verify consistency with register accessor
      expect(getLowerAccumulator()).toBe(FIXTURES.TEST_WORD_1);

      // Modify register and verify memory address reflects it
      setLowerAccumulator(FIXTURES.TEST_WORD_2);
      expect(readMemory('8002')).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should read upper accumulator at 8003', () => {
      setUpperAccumulator(FIXTURES.TEST_WORD_1);

      // Read via memory address 8003
      const memValue = readMemory('8003');
      expect(memValue).toBe(FIXTURES.TEST_WORD_1);

      // Verify consistency with register accessor
      expect(getUpperAccumulator()).toBe(FIXTURES.TEST_WORD_1);

      // Modify register and verify memory address reflects it
      setUpperAccumulator(FIXTURES.TEST_WORD_2);
      expect(readMemory('8003')).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should access all special addresses regardless of memory config', () => {
      // Set register values
      setConsoleSwitches(FIXTURES.TEST_WORD_1);
      setDistributor(FIXTURES.TEST_WORD_2);
      setLowerAccumulator(FIXTURES.TEST_WORD_3);
      setUpperAccumulator(FIXTURES.TEST_WORD_4);

      // Test with 1K configuration
      setMemorySize('1K');
      expect(readMemory('8000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('8001')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('8002')).toBe(FIXTURES.TEST_WORD_3);
      expect(readMemory('8003')).toBe(FIXTURES.TEST_WORD_4);

      // Test with 2K configuration
      setMemorySize('2K');
      expect(readMemory('8000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('8001')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('8002')).toBe(FIXTURES.TEST_WORD_3);
      expect(readMemory('8003')).toBe(FIXTURES.TEST_WORD_4);

      // Test with 4K configuration
      setMemorySize('4K');
      expect(readMemory('8000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('8001')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('8002')).toBe(FIXTURES.TEST_WORD_3);
      expect(readMemory('8003')).toBe(FIXTURES.TEST_WORD_4);
    });

    it('should maintain independence between registers and drum memory', () => {
      setMemorySize('1K');

      // Set register values
      setConsoleSwitches(FIXTURES.TEST_WORD_1);
      setDistributor(FIXTURES.TEST_WORD_2);
      setLowerAccumulator(FIXTURES.TEST_WORD_3);
      setUpperAccumulator(FIXTURES.TEST_WORD_4);

      // Set drum memory (should not affect registers mapped at 8000-8003)
      writeMemory('0100', '1111111111+');
      writeMemory('0200', '2222222222+');

      // Verify registers unchanged
      expect(getConsoleSwitches()).toBe(FIXTURES.TEST_WORD_1);
      expect(getDistributor()).toBe(FIXTURES.TEST_WORD_2);
      expect(getLowerAccumulator()).toBe(FIXTURES.TEST_WORD_3);
      expect(getUpperAccumulator()).toBe(FIXTURES.TEST_WORD_4);

      // Verify drum memory unchanged
      expect(readMemory('0100')).toBe('1111111111+');
      expect(readMemory('0200')).toBe('2222222222+');

      // Verify special addresses still work
      expect(readMemory('8000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('8001')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('8002')).toBe(FIXTURES.TEST_WORD_3);
      expect(readMemory('8003')).toBe(FIXTURES.TEST_WORD_4);
    });
  });

  describe('memory reconfiguration', () => {
    it('should preserve values when expanding memory', () => {
      setMemorySize('1K');
      writeMemory('0100', FIXTURES.TEST_WORD_1);
      writeMemory('0500', FIXTURES.TEST_WORD_2);

      // Expand to 2K
      setMemorySize('2K');

      // Original values should persist
      expect(readMemory('0100')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('0500')).toBe(FIXTURES.TEST_WORD_2);

      // New range should be accessible
      writeMemory('1500', FIXTURES.TEST_WORD_3);
      expect(readMemory('1500')).toBe(FIXTURES.TEST_WORD_3);
    });

    it('should preserve values when shrinking memory', () => {
      setMemorySize('4K');
      writeMemory('0100', FIXTURES.TEST_WORD_1);
      writeMemory('0500', FIXTURES.TEST_WORD_2);
      writeMemory('3000', FIXTURES.TEST_WORD_3);

      // Shrink to 1K
      setMemorySize('1K');

      // Values in range should persist
      expect(readMemory('0100')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('0500')).toBe(FIXTURES.TEST_WORD_2);

      // Out of range returns undefined
      expect(readMemory('3000')).toBeUndefined();
    });
  });

  describe('boundary conditions', () => {
    it('should handle exact boundary addresses for 1K', () => {
      setMemorySize('1K');
      writeMemory('0000', FIXTURES.TEST_WORD_1); // First address
      writeMemory('0999', FIXTURES.TEST_WORD_2); // Last valid address

      expect(readMemory('0000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('0999')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('1000')).toBeUndefined(); // Just beyond range
    });

    it('should handle exact boundary addresses for 2K', () => {
      setMemorySize('2K');
      writeMemory('0000', FIXTURES.TEST_WORD_1);
      writeMemory('1999', FIXTURES.TEST_WORD_2);

      expect(readMemory('0000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('1999')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('2000')).toBeUndefined();
    });

    it('should handle exact boundary addresses for 4K', () => {
      setMemorySize('4K');
      writeMemory('0000', FIXTURES.TEST_WORD_1);
      writeMemory('3999', FIXTURES.TEST_WORD_2);

      expect(readMemory('0000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('3999')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('4000')).toBeUndefined();
    });
  });
});
