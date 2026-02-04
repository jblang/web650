/**
 * Integration tests for SIMH API commands.
 *
 * Tests the sendCommand, examine, and deposit functions
 * through the full WASM stack in a simulator-agnostic way.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initWasmForNode, OutputCapture } from './setup/node-loader';
import { resetEmulator, cleanupTests } from './setup/test-helpers';
import { sendCommand, examine, deposit } from '../index';

describe('API Integration Tests', () => {
  let outputCapture: OutputCapture;

  const isReadOnlyError = (err: unknown) =>
    err instanceof Error && /read only/i.test(err.message);

  const findWritableRegister = (state: Record<string, string>) => {
    for (const [register, value] of Object.entries(state)) {
      try {
        deposit(register, value);
        return { register, value };
      } catch (err) {
        if (isReadOnlyError(err)) {
          continue;
        }
        throw err;
      }
    }
    return null;
  };

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

  describe('sendCommand', () => {
    it('should execute RESET command', () => {
      const output = sendCommand('RESET');
      expect(output).toBeDefined();
    });

    it('should execute EXAMINE STATE command and return output', () => {
      const state = examine('STATE');
      const output = sendCommand('EXAMINE STATE');
      expect(output).toBeDefined();
      const [firstRegister] = Object.keys(state);
      expect(firstRegister).toBeDefined();
      expect(output.toUpperCase()).toContain(firstRegister);
    });

    it('should execute DEPOSIT command', () => {
      const state = examine('STATE');
      const writable = findWritableRegister(state);
      expect(writable).not.toBeNull();
      const output = sendCommand(`DEPOSIT ${writable!.register} ${writable!.value}`);
      expect(output).toBeDefined();
    });

    it('should handle multiple commands in sequence', () => {
      sendCommand('RESET');
      const state = examine('STATE');
      const writable = findWritableRegister(state);
      expect(writable).not.toBeNull();
      sendCommand(`DEPOSIT ${writable!.register} ${writable!.value}`);
      const output = sendCommand(`EXAMINE ${writable!.register}`);
      expect(output).toContain(writable!.register);
    });
  });

  describe('examine', () => {
    it('should read simulator state', () => {
      const state = examine('STATE');
      expect(Object.keys(state).length).toBeGreaterThan(0);
    });
  });

  describe('deposit', () => {
    it('should round-trip register values from state', () => {
      const state = examine('STATE');
      const registers = Object.entries(state);
      expect(registers.length).toBeGreaterThan(0);

      let writableCount = 0;
      for (const [register, value] of registers) {
        try {
          deposit(register, value);
          writableCount += 1;
          const reread = examine(register);
          expect(reread).toHaveProperty(register);
          expect(reread[register]).toBe(value);
        } catch (err) {
          if (isReadOnlyError(err)) {
            continue;
          }
          throw err;
        }
      }
      expect(writableCount).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid commands gracefully', () => {
      expect(() => sendCommand('INVALID_COMMAND')).toThrow();
    });

    it('should handle examining non-existent register', () => {
      expect(() => sendCommand('EXAMINE NONEXISTENT')).toThrow();
    });
  });
});
