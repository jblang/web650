/**
 * Integration tests for i650 register operations.
 *
 * Tests all register get/set functions through the full WASM stack.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initWasmForNode, OutputCapture } from './setup/node-loader';
import { resetEmulator, cleanupTests } from './setup/test-helpers';
import {
  getAddressRegister,
  setAddressRegister,
  getProgramRegister,
  setProgramRegister,
  getDistributor,
  setDistributor,
  getLowerAccumulator,
  setLowerAccumulator,
  getUpperAccumulator,
  setUpperAccumulator,
  getConsoleSwitches,
  setConsoleSwitches,
  getProgrammedStop,
  setProgrammedStop,
  getOverflowStop,
  setOverflowStop,
  getHalfCycle,
  getOverflow,
  resetAccumulator,
  reset,
  setMemorySize,
} from '../i650/registers';
import { FIXTURES } from './setup/fixtures';

describe('Register Integration Tests', () => {
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

  describe('Address Register (AR)', () => {
    it('should get address register', () => {
      const ar = getAddressRegister();
      expect(ar).toMatch(/^\d{4}$/);
    });

    it('should set and get address register', () => {
      setAddressRegister('1234');
      const ar = getAddressRegister();
      expect(ar).toBe('1234');
    });

    it('should handle zero address', () => {
      setAddressRegister('0000');
      expect(getAddressRegister()).toBe('0000');
    });

    it('should handle max address', () => {
      setAddressRegister('9999');
      expect(getAddressRegister()).toBe('9999');
    });
  });

  describe('Program Register (PR)', () => {
    it('should get program register', () => {
      const pr = getProgramRegister();
      expect(pr).toMatch(/^\d{10}[+-]$/);
    });

    it('should set and get program register', () => {
      setProgramRegister(FIXTURES.TEST_WORD_1);
      const pr = getProgramRegister();
      expect(pr).toBe(FIXTURES.TEST_WORD_1);
    });

    it('should handle negative values', () => {
      setProgramRegister(FIXTURES.TEST_WORD_2);
      expect(getProgramRegister()).toBe(FIXTURES.TEST_WORD_2);
    });
  });

  describe('Distributor (DIST)', () => {
    it('should get distributor', () => {
      const dist = getDistributor();
      expect(dist).toMatch(/^\d{10}[+-]$/);
    });

    it('should set and get distributor', () => {
      setDistributor(FIXTURES.TEST_WORD_1);
      const dist = getDistributor();
      expect(dist).toBe(FIXTURES.TEST_WORD_1);
    });
  });

  describe('Accumulator Registers', () => {
    it('should get lower accumulator', () => {
      const accLo = getLowerAccumulator();
      expect(accLo).toMatch(/^\d{10}[+-]$/);
    });

    it('should set and get lower accumulator', () => {
      setLowerAccumulator(FIXTURES.TEST_WORD_1);
      const accLo = getLowerAccumulator();
      expect(accLo).toBe(FIXTURES.TEST_WORD_1);
    });

    it('should get upper accumulator', () => {
      const accUp = getUpperAccumulator();
      expect(accUp).toMatch(/^\d{10}[+-]$/);
    });

    it('should set and get upper accumulator', () => {
      setUpperAccumulator(FIXTURES.TEST_WORD_2);
      const accUp = getUpperAccumulator();
      expect(accUp).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should set both accumulators independently', () => {
      setLowerAccumulator(FIXTURES.TEST_WORD_1);
      setUpperAccumulator(FIXTURES.TEST_WORD_2);

      expect(getLowerAccumulator()).toBe(FIXTURES.TEST_WORD_1);
      expect(getUpperAccumulator()).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should reset accumulator to zero', () => {
      setLowerAccumulator(FIXTURES.TEST_WORD_1);
      setUpperAccumulator(FIXTURES.TEST_WORD_2);

      resetAccumulator();

      expect(getLowerAccumulator()).toBe(FIXTURES.ZERO_WORD);
      expect(getUpperAccumulator()).toBe(FIXTURES.ZERO_WORD);
    });
  });

  describe('Console Switches (CSW)', () => {
    it('should get console switches', () => {
      const csw = getConsoleSwitches();
      expect(csw).toMatch(/^\d{10}[+-]$/);
    });

    it('should set and get console switches', () => {
      setConsoleSwitches(FIXTURES.TEST_WORD_3);
      const csw = getConsoleSwitches();
      expect(csw).toBe(FIXTURES.TEST_WORD_3);
    });
  });

  describe('Control Flags', () => {
    it('should get programmed stop flag', () => {
      const flag = getProgrammedStop();
      expect(typeof flag).toBe('boolean');
    });

    it('should set and get programmed stop', () => {
      setProgrammedStop(true);
      expect(getProgrammedStop()).toBe(true);

      setProgrammedStop(false);
      expect(getProgrammedStop()).toBe(false);
    });

    it('should get overflow stop flag', () => {
      const flag = getOverflowStop();
      expect(typeof flag).toBe('boolean');
    });

    it('should set and get overflow stop', () => {
      setOverflowStop(true);
      expect(getOverflowStop()).toBe(true);

      setOverflowStop(false);
      expect(getOverflowStop()).toBe(false);
    });

    it('should get half cycle flag', () => {
      const flag = getHalfCycle();
      expect(typeof flag).toBe('boolean');
    });

    it('should get overflow flag', () => {
      const flag = getOverflow();
      expect(typeof flag).toBe('boolean');
    });
  });

  describe('System Operations', () => {
    it('should reset all registers', () => {
      // Set some values
      setAddressRegister('1234');
      setProgramRegister(FIXTURES.TEST_WORD_1);
      setLowerAccumulator(FIXTURES.TEST_WORD_2);

      // Reset
      reset();

      // Verify reset (AR and PR should be zero, accumulators should be zero)
      expect(getAddressRegister()).toBe('0000');
      expect(getProgramRegister()).toBe(FIXTURES.ZERO_WORD);
      expect(getLowerAccumulator()).toBe(FIXTURES.ZERO_WORD);
      expect(getUpperAccumulator()).toBe(FIXTURES.ZERO_WORD);
    });

    it('should set memory size', () => {
      // Test that setMemorySize doesn't throw
      expect(() => setMemorySize('1K')).not.toThrow();
      expect(() => setMemorySize('2K')).not.toThrow();
      expect(() => setMemorySize('4K')).not.toThrow();
    });
  });

  describe('Register Persistence', () => {
    it('should maintain values across multiple operations', () => {
      setAddressRegister('5678');
      setProgramRegister(FIXTURES.TEST_WORD_1);
      setDistributor(FIXTURES.TEST_WORD_2);
      setLowerAccumulator(FIXTURES.TEST_WORD_3);
      setUpperAccumulator(FIXTURES.TEST_WORD_4);
      setConsoleSwitches(FIXTURES.TEST_WORD_1);

      expect(getAddressRegister()).toBe('5678');
      expect(getProgramRegister()).toBe(FIXTURES.TEST_WORD_1);
      expect(getDistributor()).toBe(FIXTURES.TEST_WORD_2);
      expect(getLowerAccumulator()).toBe(FIXTURES.TEST_WORD_3);
      expect(getUpperAccumulator()).toBe(FIXTURES.TEST_WORD_4);
      expect(getConsoleSwitches()).toBe(FIXTURES.TEST_WORD_1);
    });
  });
});
