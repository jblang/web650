/**
 * I650-specific formatting and normalization functions.
 */

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
export function normalizeValue(value: string | number | null | undefined): string {
  let sign = '+';
  let numericPart = '';

  if (value === null || value === undefined) {
    numericPart = '0';
  } else if (typeof value === 'number') {
    if (value < 0) {
      sign = '-';
    }
    numericPart = String(Math.abs(value));

    // Validate length for numbers
    if (numericPart.length > 10) {
      throw new TypeError(
        `Value must be at most 10 digits (got ${numericPart.length} digits)`
      );
    }
  } else { // typeof value === 'string'
    // Empty string is valid (becomes 0)
    if (value === '') {
      numericPart = '0';
    } else {
      // Check for multiple signs
      const signCount = (value.match(/[+-]/g) || []).length;
      if (signCount > 1) {
        throw new TypeError(
          `Value can have at most one sign character (got: ${value})`
        );
      }

      // Check for sign at the end (emulator format: 0000000000+)
      if (value.endsWith('+') || value.endsWith('-')) {
        sign = value[value.length - 1];
        numericPart = value.substring(0, value.length - 1);
      // Also accept sign at the beginning for backwards compatibility
      } else if (value.startsWith('+') || value.startsWith('-')) {
        sign = value[0];
        numericPart = value.substring(1);
      } else {
        numericPart = value;
      }

      // Validate numeric part contains only digits (allow empty for lone sign)
      if (numericPart !== '' && !/^\d+$/.test(numericPart)) {
        throw new TypeError(
          `Value must contain only digits and an optional sign (got: ${value})`
        );
      }

      // Empty numeric part (lone sign) becomes 0
      if (numericPart === '') {
        numericPart = '0';
      }

      // Validate length
      if (numericPart.length > 10) {
        throw new TypeError(
          `Value must be at most 10 digits (got ${numericPart.length} digits)`
        );
      }
    }
  }

  // Pad the numeric part to 10 digits from the left
  // If numericPart is '123', it becomes '0000000123'
  const paddedNumericPart = numericPart.padStart(10, '0');

  // Return with sign at end (emulator format)
  return paddedNumericPart + sign;
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
export function normalizeAddress(value: string | number | null | undefined): string {
  let numericPart = '';

  if (value === null || value === undefined) {
    numericPart = '0';
  } else if (typeof value === 'number') {
    numericPart = String(Math.abs(value));
  } else { // typeof value === 'string'
    // Remove any non-numeric characters
    numericPart = value.replace(/\D/g, '');
  }

  // Pad the numeric part to 4 digits from the left
  // If numericPart is '123', it becomes '0123'
  const paddedNumericPart = numericPart.padStart(4, '0');

  // Take only the last 4 digits in case of overflow
  return paddedNumericPart.slice(-4);
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
 * @param word - 10-digit word with sign (e.g., "0000000000+")
 * @returns 2-digit operation code (e.g., "00")
 */
export function extractOperationCode(word: string): string {
  return word.slice(0, 2);
}

/**
 * Extract the data address from an I650 program register word.
 *
 * The data address occupies positions 2-5 of the 10-digit word.
 *
 * @param word - 10-digit word with sign (e.g., "6912340567+")
 * @returns 4-digit data address (e.g., "1234")
 */
export function extractDataAddress(word: string): string {
  return word.slice(2, 6);
}

/**
 * Extract the instruction address from an I650 program register word.
 *
 * The instruction address occupies positions 6-9 of the 10-digit word.
 *
 * @param word - 10-digit word with sign (e.g., "6912340567+")
 * @returns 4-digit instruction address (e.g., "0567")
 */
export function extractInstructionAddress(word: string): string {
  return word.slice(6, 10);
}
