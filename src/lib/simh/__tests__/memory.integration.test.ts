/**
 * Integration tests for i650 memory operations.
 *
 * Tests readMemory and writeMemory functions through the full WASM stack.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initWasmForNode, OutputCapture } from './setup/node-loader';
import { resetEmulator, cleanupTests } from './setup/test-helpers';
import { readMemory, writeMemory } from '../i650/memory';
import { FIXTURES, INVALID } from './setup/fixtures';

describe('Memory Integration Tests', () => {
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

  describe('readMemory', () => {
    it('should read from memory address', () => {
      const value = readMemory(FIXTURES.TEST_ADDR_1);
      expect(value).toMatch(/^\d{10}[+-]$/);
    });

    it('should return zeros for uninitialized memory', () => {
      const value = readMemory('5555');
      expect(value).toBe(FIXTURES.ZERO_WORD);
    });

    it('should read from different addresses', () => {
      const val1 = readMemory(FIXTURES.TEST_ADDR_1);
      const val2 = readMemory(FIXTURES.TEST_ADDR_2);
      expect(val1).toBeDefined();
      expect(val2).toBeDefined();
    });

    it('should throw on invalid address format', () => {
      expect(() => readMemory(INVALID.ADDR_TOO_SHORT)).toThrow();
      expect(() => readMemory(INVALID.ADDR_TOO_LONG)).toThrow();
      expect(() => readMemory(INVALID.ADDR_LETTERS)).toThrow();
    });
  });

  describe('writeMemory', () => {
    it('should write and read back value', () => {
      writeMemory(FIXTURES.TEST_ADDR_1, FIXTURES.TEST_WORD_1);
      const value = readMemory(FIXTURES.TEST_ADDR_1);
      expect(value).toBe(FIXTURES.TEST_WORD_1);
    });

    it('should write negative values', () => {
      writeMemory(FIXTURES.TEST_ADDR_2, FIXTURES.TEST_WORD_2);
      const value = readMemory(FIXTURES.TEST_ADDR_2);
      expect(value).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should persist multiple writes', () => {
      writeMemory('0100', FIXTURES.TEST_WORD_1);
      writeMemory('0200', FIXTURES.TEST_WORD_2);
      writeMemory('0300', FIXTURES.TEST_WORD_3);

      expect(readMemory('0100')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('0200')).toBe(FIXTURES.TEST_WORD_2);
      expect(readMemory('0300')).toBe(FIXTURES.TEST_WORD_3);
    });

    it('should overwrite previous value', () => {
      writeMemory(FIXTURES.TEST_ADDR_1, FIXTURES.TEST_WORD_1);
      writeMemory(FIXTURES.TEST_ADDR_1, FIXTURES.TEST_WORD_2);
      const value = readMemory(FIXTURES.TEST_ADDR_1);
      expect(value).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should write to boundary addresses', () => {
      writeMemory('0000', FIXTURES.TEST_WORD_1);
      // 1K memory: addresses 0000-0999
      writeMemory('0999', FIXTURES.TEST_WORD_2);

      expect(readMemory('0000')).toBe(FIXTURES.TEST_WORD_1);
      expect(readMemory('0999')).toBe(FIXTURES.TEST_WORD_2);
    });

    it('should throw on invalid address', () => {
      expect(() => writeMemory(INVALID.ADDR_TOO_SHORT, FIXTURES.TEST_WORD_1)).toThrow();
      expect(() => writeMemory(INVALID.ADDR_TOO_LONG, FIXTURES.TEST_WORD_1)).toThrow();
      expect(() => writeMemory(INVALID.ADDR_LETTERS, FIXTURES.TEST_WORD_1)).toThrow();
    });

    it('should throw on invalid word format', () => {
      expect(() => writeMemory(FIXTURES.TEST_ADDR_1, INVALID.TOO_SHORT)).toThrow();
      expect(() => writeMemory(FIXTURES.TEST_ADDR_1, INVALID.TOO_LONG)).toThrow();
      expect(() => writeMemory(FIXTURES.TEST_ADDR_1, INVALID.NO_SIGN)).toThrow();
      expect(() => writeMemory(FIXTURES.TEST_ADDR_1, INVALID.INVALID_SIGN)).toThrow();
    });
  });

  describe('memory persistence', () => {
    it('should maintain values across multiple operations', () => {
      // Write a pattern to memory
      writeMemory('0100', '1111111111+');
      writeMemory('0101', '2222222222+');
      writeMemory('0102', '3333333333+');
      writeMemory('0103', '4444444444+');

      // Verify pattern persists
      expect(readMemory('0100')).toBe('1111111111+');
      expect(readMemory('0101')).toBe('2222222222+');
      expect(readMemory('0102')).toBe('3333333333+');
      expect(readMemory('0103')).toBe('4444444444+');
    });

    it('should handle sequential memory writes', () => {
      for (let i = 0; i < 10; i++) {
        const addr = `010${i}`;
        const value = `${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}+`;
        writeMemory(addr, value);
      }

      for (let i = 0; i < 10; i++) {
        const addr = `010${i}`;
        const expected = `${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}+`;
        expect(readMemory(addr)).toBe(expected);
      }
    });
  });
});
