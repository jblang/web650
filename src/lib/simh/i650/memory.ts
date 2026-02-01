/**
 * I650-specific memory operations and validation helpers.
 */

import { examineState, depositState } from '../core';
import { ZERO_DATA } from './constants';
import { normalizeAddress } from './format';

/* ── I650 Validation Helpers ──────────────────────────────────── */

/**
 * Validates that a value matches the expected I650 word format:
 * 10 digits followed by a sign (+ or -).
 */
export function validateWord(value: string, fieldName: string): void {
  if (!/^\d{10}[+-]$/.test(value)) {
    throw new TypeError(
      `${fieldName} must be 10 digits followed by + or - (got: ${value})`
    );
  }
}

/**
 * Validates that a value is a 4-digit address (0000-9999).
 */
export function validateAddress(value: string, fieldName: string): void {
  if (!/^\d{4}$/.test(value)) {
    throw new TypeError(
      `${fieldName} must be 4 digits (got: ${value})`
    );
  }
  const num = parseInt(value, 10);
  if (num < 0 || num > 9999) {
    throw new RangeError(
      `${fieldName} must be between 0000 and 9999 (got: ${value})`
    );
  }
}

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
  const raw = examineState(ref);
  return postProcessI650Values(raw);
}

/* ── I650 Memory Operations ───────────────────────────────────── */

/**
 * Read a word from drum memory at the specified address.
 * @param address - Drum address (0000-9999)
 * @returns 10-digit word with sign
 */
export function readMemory(address: string): string {
  validateAddress(address, 'Memory address');
  const result = examineI650State(address);
  // Try different formats that SIMH might return
  const numeric = String(parseInt(address, 10));
  return (
    result[address] ??
    result[numeric] ??
    result[numeric.padStart(4, '0')] ??
    ZERO_DATA
  );
}

/**
 * Write a word to drum memory at the specified address.
 * @param address - Drum address (0000-9999)
 * @param value - 10-digit word with sign
 */
export function writeMemory(address: string, value: string): void {
  validateAddress(address, 'Memory address');
  validateWord(value, 'Memory value');
  depositState(address, value);
}
