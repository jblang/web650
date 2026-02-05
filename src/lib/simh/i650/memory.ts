/**
 * I650-specific memory operations and validation helpers.
 */

import { examine, deposit } from '../core';
import { normalizeAddress, validateWord, validateAddress } from './format';

/* ── I650 Extraction Helpers (re-exported from format) ─────────── */

// Re-export extraction functions from format module for backwards compatibility
export { extractOperationCode, extractDataAddress, extractInstructionAddress } from './format';

/**
 * Post-process parsed key-value pairs for I650-specific formats.
 * AR is stored as a 16-bit int (5 digits); physical register is 4 digits.
 */
export function postProcessI650Values(values: Record<string, string>): Record<string, string> {
  const result = { ...values };
  for (const [key, val] of Object.entries(result)) {
    // AR is stored as a 16-bit int (5 digits); physical register is 4 digits.
    if (/^\d{5}$/.test(val)) {
      result[key] = normalizeAddress(val);
    }
  }
  return result;
}

/**
 * EXAMINE a register or address with I650-specific post-processing.
 * Returns parsed key-value pairs.
 */
export function examineI650State(ref: string): Record<string, string> {
  const raw = examine(ref);
  return postProcessI650Values(raw);
}

/* ── I650 Memory Operations ───────────────────────────────────── */

/**
 * Read a word from drum memory at the specified address.
 * @param address - Drum address (0000-9999)
 * @returns 10-digit word with sign
 */
export function readMemory(address: string): string {
  validateAddress(address);
  let result: Record<string, string>;
  try {
    result = examineI650State(address);
  } catch {
    return undefined as unknown as string;
  }
  // Try different formats that SIMH might return
  const numeric = String(parseInt(address, 10));
  return (
    result[numeric] ??
    undefined
  );
}

/**
 * Write a word to drum memory at the specified address.
 * @param address - Drum address (0000-9999)
 * @param value - 10-digit word with sign
 */
export function writeMemory(address: string, value: string): void {
  validateAddress(address);
  validateWord(value);
  deposit(address, value);
}
