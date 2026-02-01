/**
 * Test data fixtures and constants for integration tests.
 */

/**
 * i650 data format constants
 */
export const FIXTURES = {
  // Zero values
  ZERO_WORD: '0000000000+',
  ZERO_ADDR: '0000',
  ZERO_OP: '00',

  // Test words (10 digits + sign)
  TEST_WORD_1: '1234567890+',
  TEST_WORD_2: '9876543210-',
  TEST_WORD_3: '5555555555+',
  TEST_WORD_4: '1111111111-',

  // Test addresses (4 digits)
  TEST_ADDR_1: '0100',
  TEST_ADDR_2: '0200',
  TEST_ADDR_3: '1234',
  TEST_ADDR_4: '9999',

  // NOP instruction (operation code 69, no operation)
  // Format: OpCode(69) + DataAddr(0000) + InstAddr(0001) + Sign(+)
  NOP_INSTRUCTION: '6900000001+',

  // Simple arithmetic instruction examples
  // Load accumulator from address 0050
  LOAD_FROM_0050: '6900500000+',

  // Store accumulator to address 0100
  STORE_TO_0100: '2401000000+',

  // SIMH status codes
  STATUS: {
    SCPE_OK: 0,
    SCPE_STEP: 1,
    SCPE_STOP: 2,
  },

  // Expected outputs from FDS example (from i650_test.ini)
  FDS_EXPECTED: {
    AR: '9999',
    MEM_0977: '0000000009+',
    MEM_0978: '5090000000+',
    MEM_0979: '5030000000+',
  },
};

/**
 * Invalid test data for validation tests
 */
export const INVALID = {
  // Invalid words (wrong length, missing sign, etc.)
  TOO_SHORT: '123+',
  TOO_LONG: '123456789012+',
  NO_SIGN: '1234567890',
  INVALID_SIGN: '1234567890*',
  LETTERS: 'abcdefghij+',

  // Invalid addresses (wrong length, non-numeric)
  ADDR_TOO_SHORT: '12',
  ADDR_TOO_LONG: '12345',
  ADDR_LETTERS: 'abcd',
  ADDR_OUT_OF_RANGE: '99999',
};
