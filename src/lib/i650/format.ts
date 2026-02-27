/**
 * I650-specific formatting and normalization functions.
 */

/**
 * Validates a value for I650 word format.
 *
 * @param value - Value to validate
 * @throws {TypeError} If value contains invalid characters, multiple signs, or exceeds 10 digits
 */
export function validateWord(value: string): void {
  if (!/^([+-]?\d{1,10}|\d{1,10}[+-]?)$/.test(value)) {
    throw new TypeError(
      `Value must contain 1-10 digits and an optional sign before or after (got: ${value})`
    );
  }
}

/**
 * Validates that a value is a 4-digit address (0000-9999).
 */
export function validateAddress(value: string): void {
  if (!/^0?\d{1,4}$/.test(value)) {
    throw new TypeError(
      `Address must be 1-4 digits (got: ${value})`
    );
  }
}

/**
 * Normalizes a value to the I650 10-digit word format with sign.
 *
 * Accepts various input formats:
 * - Numbers: -123 → "0000000123-"
 * - Strings with sign at end: "123+" → "0000000123+"
 * - Strings with sign at beginning: "-123" → "0000000123-"
 * - Strings without sign: "123" → "0000000123+"
 * - null/undefined: → "0000000000+"
 *
 * @param value - Value to normalize
 * @returns 10-digit word with sign at end (I650 format)
 * @throws {TypeError} If value contains invalid characters, multiple signs, or exceeds 10 digits
 */
export function normalizeWord(value: string | number): string {
  if (typeof value === 'number') {
    value = String(value);
  }
  validateWord(value);
  let sign = '+';
  let magnitude = '';
  if (value.endsWith('+') || value.endsWith('-')) {
    sign = value[value.length - 1];
    magnitude = value.substring(0, value.length - 1);
  } else if (value.startsWith('+') || value.startsWith('-')) {
    sign = value[0];
    magnitude = value.substring(1);
  } else {
    magnitude = value;
  }
  return magnitude.padStart(10, '0') + sign;
}

/**
 * Normalizes a value to the I650 4-digit address format.
 *
 * Accepts various input formats:
 * - Numbers: 123 → "0123"
 * - Strings: "123" → "0123"
 * - null/undefined: → "0000"
 *
 * @param value - Value to normalize
 * @returns 4-digit address (I650 format)
 */
export function normalizeAddress(value: string | number): string {
  if (typeof value === 'number') {
    value = String(value);
  }
  validateAddress(value);
  return value.slice(-4).padStart(4, '0');
}

/**
 * Normalizes 5-digit addresses in parsed I650 state values.
 * AR (Address Register) is stored as a 16-bit int (5 digits) but the physical register is 4 digits.
 *
 * @param values - Parsed key-value pairs from EXAMINE command
 * @returns Normalized values with 4-digit addresses
 */
export function normalizeAddresses(values: Record<string, string>): Record<string, string> {
  const result = { ...values };
  for (const [key, val] of Object.entries(result)) {
    if (/^\d{5}$/.test(val)) {
      result[key] = normalizeAddress(val);
    }
  }
  return result;
}

/* ── I650 Word Field Extraction ───────────────────────────────── */

/**
 * Extract the operation code from an I650 program register word.
 *
 * I650 word format (10 digits + sign):
 * - Positions 0-1: Operation code (2 digits)
 * - Positions 2-5: Data address (4 digits)
 * - Positions 6-9: Instruction address (4 digits)
 * - Position 10: Sign (+ or -)
 *
 * @param word - Value to extract from (normalized to I650 format)
 * @returns 2-digit operation code (e.g., "00")
 */
export function extractOperationCode(word: string | number): string {
  const normalized = normalizeWord(word);
  return normalized.slice(0, 2);
}

/**
 * Extract the data address from an I650 program register word.
 *
 * The data address occupies positions 2-5 of the 10-digit word.
 *
 * @param word - Value to extract from (normalized to I650 format)
 * @returns 4-digit data address (e.g., "1234")
 */
export function extractDataAddress(word: string | number): string {
  const normalized = normalizeWord(word);
  return normalized.slice(2, 6);
}

/**
 * Extract the instruction address from an I650 program register word.
 *
 * The instruction address occupies positions 6-9 of the 10-digit word.
 *
 * @param word - Value to extract from (normalized to I650 format)
 * @returns 4-digit instruction address (e.g., "0567")
 */
export function extractInstructionAddress(word: string | number): string {
  const normalized = normalizeWord(word);
  return normalized.slice(6, 10);
}

/**
 * Extract the sign from an I650 word.
 *
 * The sign occupies position 10 of the 10-digit word.
 *
 * @param word - Value to extract from (normalized to I650 format)
 * @returns Sign character ('+' or '-')
 */
export function extractSign(word: string | number): '+' | '-' {
  const normalized = normalizeWord(word);
  return normalized.slice(10) === '-' ? '-' : '+';
}
