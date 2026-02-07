import { describe, it, expect } from 'vitest';
import {
  validateWord,
  validateAddress,
  normalizeWord,
  normalizeAddress,
  normalizeAddresses,
  extractOperationCode,
  extractDataAddress,
  extractInstructionAddress,
  extractSign,
} from './format';
import { ZERO_DATA } from './constants';

describe('validateWord', () => {
  it('does not throw for valid values', () => {
    expect(() => validateWord('123')).not.toThrow();
    expect(() => validateWord('123+')).not.toThrow();
    expect(() => validateWord('-123')).not.toThrow();
    expect(() => validateWord('1234567890')).not.toThrow();
  });

  it('accepts exactly 10 digits with sign', () => {
    expect(() => validateWord('1234567890+')).not.toThrow();
    expect(() => validateWord('1234567890-')).not.toThrow();
    expect(() => validateWord('+1234567890')).not.toThrow();
    expect(() => validateWord('-1234567890')).not.toThrow();
  });

  it('accepts single digit with or without sign', () => {
    expect(() => validateWord('1')).not.toThrow();
    expect(() => validateWord('1+')).not.toThrow();
    expect(() => validateWord('-1')).not.toThrow();
  });

  it('throws TypeError for empty string', () => {
    expect(() => validateWord('')).toThrow(TypeError);
    expect(() => validateWord('')).toThrow('Value must contain 1-10 digits');
  });

  it('throws TypeError for sign only', () => {
    expect(() => validateWord('+')).toThrow(TypeError);
    expect(() => validateWord('-')).toThrow(TypeError);
  });

  it('throws TypeError for values exceeding 10 digits', () => {
    expect(() => validateWord('12345678901')).toThrow(TypeError);
    expect(() => validateWord('12345678901')).toThrow('Value must contain 1-10 digits');
  });

  it('throws TypeError for multiple signs', () => {
    expect(() => validateWord('++123')).toThrow(TypeError);
    expect(() => validateWord('123--')).toThrow(TypeError);
    expect(() => validateWord('12+34')).toThrow(TypeError);
    expect(() => validateWord('+-123')).toThrow(TypeError);
    expect(() => validateWord('123+-')).toThrow(TypeError);
  });

  it('throws TypeError for invalid characters', () => {
    expect(() => validateWord('123abc')).toThrow(TypeError);
    expect(() => validateWord('abc')).toThrow(TypeError);
    expect(() => validateWord('12.34')).toThrow(TypeError);
    expect(() => validateWord('12 34')).toThrow(TypeError);
    expect(() => validateWord('12,34')).toThrow(TypeError);
  });
});

describe('validateAddress', () => {
  it('does not throw for valid addresses', () => {
    expect(() => validateAddress('1')).not.toThrow();
    expect(() => validateAddress('123')).not.toThrow();
    expect(() => validateAddress('1234')).not.toThrow();
    expect(() => validateAddress('0000')).not.toThrow();
    expect(() => validateAddress('9999')).not.toThrow();
  });

  it('accepts addresses with leading zero', () => {
    expect(() => validateAddress('0001')).not.toThrow();
    expect(() => validateAddress('0123')).not.toThrow();
  });

  it('throws TypeError for empty string', () => {
    expect(() => validateAddress('')).toThrow(TypeError);
    expect(() => validateAddress('')).toThrow('Address must be 1-4 digits');
  });

  it('throws TypeError for addresses with non-numeric characters', () => {
    expect(() => validateAddress('12ab')).toThrow(TypeError);
    expect(() => validateAddress('abcd')).toThrow(TypeError);
    expect(() => validateAddress('12.3')).toThrow(TypeError);
    expect(() => validateAddress('12-3')).toThrow(TypeError);
  });

  it('throws TypeError for addresses with signs', () => {
    expect(() => validateAddress('+123')).toThrow(TypeError);
    expect(() => validateAddress('-123')).toThrow(TypeError);
    expect(() => validateAddress('123+')).toThrow(TypeError);
  });

  it('throws TypeError for addresses exceeding 4 digits', () => {
    expect(() => validateAddress('12345')).toThrow(TypeError);
    expect(() => validateAddress('123456')).toThrow(TypeError);
  });
});

describe('normalizeWord', () => {
  it('pads to 10 digits and appends plus sign by default', () => {
    expect(normalizeWord('123')).toBe('0000000123+');
  });

  it('handles negative numbers and leading sign', () => {
    expect(normalizeWord(-42)).toBe('0000000042-');
    expect(normalizeWord('+7')).toBe('0000000007+');
    expect(normalizeWord('-7')).toBe('0000000007-');
  });

  it('accepts trailing sign format', () => {
    expect(normalizeWord('1234567890-')).toBe('1234567890-');
  });

  it('handles number input', () => {
    expect(normalizeWord(123)).toBe('0000000123+');
    expect(normalizeWord(-456)).toBe('0000000456-');
    expect(normalizeWord(0)).toBe('0000000000+');
  });

  it('does not pad when already 10 digits', () => {
    expect(normalizeWord('1234567890')).toBe('1234567890+');
    expect(normalizeWord('9876543210+')).toBe('9876543210+');
  });

  it('handles single digit', () => {
    expect(normalizeWord('5')).toBe('0000000005+');
    expect(normalizeWord('5-')).toBe('0000000005-');
  });

  it('throws TypeError for values exceeding 10 digits', () => {
    expect(() => normalizeWord('12345678901')).toThrow(TypeError);
    expect(() => normalizeWord('12345678901')).toThrow('Value must contain 1-10 digits');
  });

  it('throws TypeError for multiple signs', () => {
    expect(() => normalizeWord('++123')).toThrow(TypeError);
    expect(() => normalizeWord('123--')).toThrow(TypeError);
    expect(() => normalizeWord('12+34')).toThrow(TypeError);
    expect(() => normalizeWord('+-123')).toThrow(TypeError);
    expect(() => normalizeWord('123+-')).toThrow(TypeError);
  });

  it('throws TypeError for invalid characters', () => {
    expect(() => normalizeWord('123abc')).toThrow(TypeError);
    expect(() => normalizeWord('abc')).toThrow(TypeError);
    expect(() => normalizeWord('12.34')).toThrow(TypeError);
    expect(() => normalizeWord('12 34')).toThrow(TypeError);
    expect(() => normalizeWord('12,34')).toThrow(TypeError);
  });
});

describe('normalizeAddress', () => {
  it('pads to 4 digits', () => {
    expect(normalizeAddress('123')).toBe('0123');
    expect(normalizeAddress('1')).toBe('0001');
  });

  it('handles number input', () => {
    expect(normalizeAddress(123)).toBe('0123');
    expect(normalizeAddress(1)).toBe('0001');
    expect(normalizeAddress(9999)).toBe('9999');
  });

  it('does not pad when already 4 digits', () => {
    expect(normalizeAddress('1234')).toBe('1234');
    expect(normalizeAddress('0000')).toBe('0000');
  });

  it('handles leading zeros', () => {
    expect(normalizeAddress('0001')).toBe('0001');
    expect(normalizeAddress('0100')).toBe('0100');
  });

  it('accepts single leading 0 followed by up to 4 digits', () => {
    // The regex /^0?\d{1,4}$/ allows this edge case
    expect(normalizeAddress('01234')).toBe('1234');
  });

  it('throws TypeError for invalid input', () => {
    expect(() => normalizeAddress('abcd')).toThrow(TypeError);
    expect(() => normalizeAddress('')).toThrow(TypeError);
    expect(() => normalizeAddress('12ab')).toThrow(TypeError);
  });
});

describe('normalizeAddresses', () => {
  it('normalizes 5-digit addresses in values', () => {
    const result = normalizeAddresses({ AR: '01234', PR: ZERO_DATA });
    expect(result.AR).toBe('1234');
    expect(result.PR).toBe(ZERO_DATA);
  });

  it('leaves non-5-digit values unchanged', () => {
    const result = normalizeAddresses({
      SHORT: '123',
      EXACT: '1234',
      LONG: '123456',
      WORD: ZERO_DATA
    });
    expect(result.SHORT).toBe('123');
    expect(result.EXACT).toBe('1234');
    expect(result.LONG).toBe('123456');
    expect(result.WORD).toBe(ZERO_DATA);
  });

  it('handles empty object', () => {
    const result = normalizeAddresses({});
    expect(result).toEqual({});
  });
});

describe('extractOperationCode', () => {
  it('extracts first 2 digits as operation code', () => {
    expect(extractOperationCode('6912340567+')).toBe('69');
    expect(extractOperationCode('0000000000+')).toBe('00');
    expect(extractOperationCode('1523456789-')).toBe('15');
  });

  it('normalizes input before extracting', () => {
    expect(extractOperationCode('6912340567')).toBe('69');
    expect(extractOperationCode('+6912340567')).toBe('69');
    expect(extractOperationCode('-1523456789')).toBe('15');
    expect(extractOperationCode(123)).toBe('00');
  });
});

describe('extractDataAddress', () => {
  it('extracts positions 2-5 as data address', () => {
    expect(extractDataAddress('6912340567+')).toBe('1234');
    expect(extractDataAddress('0000000000+')).toBe('0000');
    expect(extractDataAddress('1523456789-')).toBe('2345');
  });

  it('normalizes input before extracting', () => {
    expect(extractDataAddress('6912340567')).toBe('1234');
    expect(extractDataAddress('+6912340567')).toBe('1234');
    expect(extractDataAddress('-1523456789')).toBe('2345');
    expect(extractDataAddress(123)).toBe('0000');
  });
});

describe('extractInstructionAddress', () => {
  it('extracts positions 6-9 as instruction address', () => {
    expect(extractInstructionAddress('6912340567+')).toBe('0567');
    expect(extractInstructionAddress('0000000000+')).toBe('0000');
    expect(extractInstructionAddress('1523456789-')).toBe('6789');
  });

  it('normalizes input before extracting', () => {
    expect(extractInstructionAddress('6912340567')).toBe('0567');
    expect(extractInstructionAddress('+6912340567')).toBe('0567');
    expect(extractInstructionAddress('-1523456789')).toBe('6789');
    expect(extractInstructionAddress(123)).toBe('0123');
  });
});

describe('extractSign', () => {
  it('extracts position 10 as sign', () => {
    expect(extractSign('6912340567+')).toBe('+');
    expect(extractSign('0000000000-')).toBe('-');
    expect(extractSign('1523456789+')).toBe('+');
  });

  it('normalizes input before extracting', () => {
    expect(extractSign('6912340567')).toBe('+');
    expect(extractSign('+6912340567')).toBe('+');
    expect(extractSign('-1523456789')).toBe('-');
    expect(extractSign(123)).toBe('+');
    expect(extractSign(-456)).toBe('-');
  });
});
