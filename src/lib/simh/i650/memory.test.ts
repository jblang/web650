import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postProcessI650Values, readMemory, writeMemory } from './memory';
import { ZERO_DATA } from './constants';

vi.mock('../core', () => ({
  examine: vi.fn(),
  deposit: vi.fn(),
}));

import { examine, deposit } from '../core';

const examineMock = vi.mocked(examine);
const depositMock = vi.mocked(deposit);

describe('i650 memory helpers', () => {
  beforeEach(() => {
    examineMock.mockReset();
    depositMock.mockReset();
  });

  it('normalizes 5-digit addresses in values', () => {
    const result = postProcessI650Values({ AR: '01234', PR: ZERO_DATA });
    expect(result.AR).toBe('1234');
    expect(result.PR).toBe(ZERO_DATA);
  });

  it('reads memory using numeric key', () => {
    examineMock.mockReturnValue({ '100': '2222222222+' });
    expect(readMemory('0100')).toBe('2222222222+');
  });

  it('returns undefined when numeric key is missing', () => {
    examineMock.mockReturnValue({ '0100': '1111111111+' });
    expect(readMemory('0100')).toBeUndefined();
  });

  it('returns undefined when examine throws', () => {
    examineMock.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(readMemory('0100')).toBeUndefined();
  });

  it('writes memory via deposit', () => {
    writeMemory('0100', '4444444444+');
    expect(depositMock).toHaveBeenCalledWith('0100', '4444444444+');
  });

  it('throws on invalid address', () => {
    expect(() => readMemory('ABCD')).toThrow();
    expect(() => writeMemory('ABCDE', '0000000000+')).toThrow();
    expect(depositMock).not.toHaveBeenCalled();
  });

  it('throws on invalid word format', () => {
    expect(() => writeMemory('0100', 'INVALID')).toThrow();
    expect(depositMock).not.toHaveBeenCalled();
  });
});
