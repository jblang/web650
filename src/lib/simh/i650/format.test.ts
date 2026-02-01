import { describe, it, expect } from 'vitest';
import {
  normalizeValue,
  normalizeAddress,
  extractOperationCode,
  extractDataAddress,
  extractInstructionAddress,
} from './format';

describe('normalizeValue', () => {
  it('pads to 10 digits and appends plus sign by default', () => {
    expect(normalizeValue('123')).toBe('0000000123+');
  });

  it('handles negative numbers and leading sign', () => {
    expect(normalizeValue(-42)).toBe('0000000042-');
    expect(normalizeValue('+7')).toBe('0000000007+');
    expect(normalizeValue('-7')).toBe('0000000007-');
  });

  it('accepts trailing sign format', () => {
    expect(normalizeValue('1234567890-')).toBe('1234567890-');
  });

  it('handles null and undefined', () => {
    expect(normalizeValue(null)).toBe('0000000000+');
    expect(normalizeValue(undefined)).toBe('0000000000+');
  });

  it('handles empty string and lone sign', () => {
    expect(normalizeValue('')).toBe('0000000000+');
    expect(normalizeValue('+')).toBe('0000000000+');
    expect(normalizeValue('-')).toBe('0000000000-');
  });

  it('throws TypeError for values exceeding 10 digits', () => {
    expect(() => normalizeValue('12345678901')).toThrow(TypeError);
    expect(() => normalizeValue('12345678901')).toThrow('must be at most 10 digits');
    expect(() => normalizeValue(12345678901)).toThrow(TypeError);
  });

  it('throws TypeError for multiple signs', () => {
    expect(() => normalizeValue('++123')).toThrow(TypeError);
    expect(() => normalizeValue('123--')).toThrow(TypeError);
    expect(() => normalizeValue('12+34')).toThrow(TypeError);
    expect(() => normalizeValue('+-123')).toThrow(TypeError);
    expect(() => normalizeValue('123+-')).toThrow(TypeError);
  });

  it('throws TypeError for invalid characters', () => {
    expect(() => normalizeValue('123abc')).toThrow(TypeError);
    expect(() => normalizeValue('abc')).toThrow(TypeError);
    expect(() => normalizeValue('12.34')).toThrow(TypeError);
    expect(() => normalizeValue('12 34')).toThrow(TypeError);
    expect(() => normalizeValue('12,34')).toThrow(TypeError);
  });
});

describe('normalizeAddress', () => {
  it('pads to 4 digits', () => {
    expect(normalizeAddress('123')).toBe('0123');
    expect(normalizeAddress(123)).toBe('0123');
    expect(normalizeAddress('1')).toBe('0001');
  });

  it('handles null and undefined', () => {
    expect(normalizeAddress(null)).toBe('0000');
    expect(normalizeAddress(undefined)).toBe('0000');
  });

  it('truncates to last 4 digits on overflow', () => {
    expect(normalizeAddress('12345')).toBe('2345');
    expect(normalizeAddress(12345)).toBe('2345');
  });

  it('removes non-numeric characters from strings', () => {
    expect(normalizeAddress('12-34')).toBe('1234');
    expect(normalizeAddress('A1B2C3D4')).toBe('1234');
  });
});

describe('extractOperationCode', () => {
  it('extracts first 2 digits as operation code', () => {
    expect(extractOperationCode('6912340567+')).toBe('69');
    expect(extractOperationCode('0000000000+')).toBe('00');
    expect(extractOperationCode('1523456789-')).toBe('15');
  });
});

describe('extractDataAddress', () => {
  it('extracts positions 2-5 as data address', () => {
    expect(extractDataAddress('6912340567+')).toBe('1234');
    expect(extractDataAddress('0000000000+')).toBe('0000');
    expect(extractDataAddress('1523456789-')).toBe('2345');
  });
});

describe('extractInstructionAddress', () => {
  it('extracts positions 6-9 as instruction address', () => {
    expect(extractInstructionAddress('6912340567+')).toBe('0567');
    expect(extractInstructionAddress('0000000000+')).toBe('0000');
    expect(extractInstructionAddress('1523456789-')).toBe('6789');
  });
});
