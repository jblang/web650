import { describe, it, expect } from 'vitest';
import { normalizeValue } from './format';

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
});
