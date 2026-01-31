/**
 * Memory operations and validation helpers.
 */

import { examineState, depositState } from './core';
import { ZERO_DATA } from './constants';

/* ── Validation helpers ───────────────────────────────────────── */

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

/* ── Extraction helpers ───────────────────────────────────────── */

/**
 * Extract the operation code from a program register word.
 * The operation code is the first 2 digits of the 10-digit word.
 * @param word - 10-digit word with sign (e.g., "0000000000+")
 * @returns 2-digit operation code (e.g., "00")
 */
export function extractOperationCode(word: string): string {
  return word.slice(0, 2);
}

/* ── Memory operations ────────────────────────────────────────── */

/**
 * Read a word from drum memory at the specified address.
 * @param address - Drum address (0000-9999)
 * @returns 10-digit word with sign
 */
export function readMemory(address: string): string {
  validateAddress(address, 'Memory address');
  const result = examineState(address);
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
