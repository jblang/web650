import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  examineAllState,
  getRegisterSnapshot,
  getAddressRegister,
  setAddressRegister,
  getProgramRegister,
  setProgramRegister,
  getDistributor,
  setDistributor,
  getLowerAccumulator,
  setLowerAccumulator,
  getUpperAccumulator,
  setUpperAccumulator,
  getConsoleSwitches,
  setConsoleSwitches,
  getProgrammedStop,
  setProgrammedStop,
  getOverflowStop,
  setOverflowStop,
  getHalfCycle,
  getOverflow,
  setHalfCycle,
  setOverflow,
  resetAccumulator,
  reset,
  setMemorySize,
} from './registers';
import { ZERO_ADDRESS, ZERO_DATA } from './constants';

vi.mock('../core', () => ({
  deposit: vi.fn(),
  sendCommand: vi.fn(),
}));

vi.mock('./memory', () => ({
  examineI650State: vi.fn(),
}));

import { deposit, sendCommand } from '../core';
import { examineI650State } from './memory';

const depositMock = vi.mocked(deposit);
const sendCommandMock = vi.mocked(sendCommand);
const examineMock = vi.mocked(examineI650State);

describe('i650 registers', () => {
  beforeEach(() => {
    depositMock.mockReset();
    sendCommandMock.mockReset();
    examineMock.mockReset();
  });

  it('examines all state via STATE', () => {
    examineMock.mockReturnValue({ AR: '0001' });
    expect(examineAllState()).toEqual({ AR: '0001' });
    expect(examineMock).toHaveBeenCalledWith('STATE');
  });

  it('returns snapshot with defaults and flags', () => {
    examineMock.mockReturnValue({
      AR: '0002',
      PR: '1234567890+',
      ACCLO: '0000000001+',
      ACCUP: '0000000002+',
      DIST: '0000000003+',
      CSW: '0000000004+',
      CSWPS: '1',
      CSWOS: '0',
      HALF: '1',
    });

    const snapshot = getRegisterSnapshot();
    expect(snapshot).toEqual({
      addressRegister: '0002',
      programRegister: '1234567890+',
      lowerAccumulator: '0000000001+',
      upperAccumulator: '0000000002+',
      distributor: '0000000003+',
      consoleSwitches: '0000000004+',
      programmedStop: true,
      overflowStop: false,
      halfCycle: true,
    });
  });

  it('falls back to defaults in register snapshot when values are missing', () => {
    examineMock.mockReturnValue({});
    const snapshot = getRegisterSnapshot();
    expect(snapshot).toEqual({
      addressRegister: ZERO_ADDRESS,
      programRegister: ZERO_DATA,
      lowerAccumulator: ZERO_DATA,
      upperAccumulator: ZERO_DATA,
      distributor: ZERO_DATA,
      consoleSwitches: ZERO_DATA,
      programmedStop: false,
      overflowStop: false,
      halfCycle: false,
    });
  });

  it('falls back to zero values when state is missing', () => {
    examineMock.mockReturnValue({});
    expect(getAddressRegister()).toBe(ZERO_ADDRESS);
    expect(getProgramRegister()).toBe(ZERO_DATA);
    expect(getDistributor()).toBe(ZERO_DATA);
    expect(getLowerAccumulator()).toBe(ZERO_DATA);
    expect(getUpperAccumulator()).toBe(ZERO_DATA);
    expect(getConsoleSwitches()).toBe(ZERO_DATA);
    expect(getProgrammedStop()).toBe(false);
    expect(getOverflowStop()).toBe(false);
    expect(getHalfCycle()).toBe(false);
    expect(getOverflow()).toBe(false);
  });

  it('sets and gets registers via deposit/examine', () => {
    examineMock.mockReturnValue({ AR: '0005' });
    setAddressRegister('0005');
    expect(depositMock).toHaveBeenCalledWith('AR', '0005');
    expect(getAddressRegister()).toBe('0005');

    examineMock.mockReturnValue({ PR: '1111111111+' });
    setProgramRegister('1111111111+');
    expect(depositMock).toHaveBeenCalledWith('PR', '1111111111+');
    expect(getProgramRegister()).toBe('1111111111+');

    examineMock.mockReturnValue({ DIST: '2222222222+' });
    setDistributor('2222222222+');
    expect(depositMock).toHaveBeenCalledWith('DIST', '2222222222+');
    expect(getDistributor()).toBe('2222222222+');

    examineMock.mockReturnValue({ ACCLO: '3333333333+' });
    setLowerAccumulator('3333333333+');
    expect(depositMock).toHaveBeenCalledWith('ACCLO', '3333333333+');
    expect(getLowerAccumulator()).toBe('3333333333+');

    examineMock.mockReturnValue({ ACCUP: '4444444444+' });
    setUpperAccumulator('4444444444+');
    expect(depositMock).toHaveBeenCalledWith('ACCUP', '4444444444+');
    expect(getUpperAccumulator()).toBe('4444444444+');

    examineMock.mockReturnValue({ CSW: '5555555555+' });
    setConsoleSwitches('5555555555+');
    expect(depositMock).toHaveBeenCalledWith('CSW', '5555555555+');
    expect(getConsoleSwitches()).toBe('5555555555+');
  });

  it('sets control flags via deposit', () => {
    setProgrammedStop(true);
    setProgrammedStop(false);
    setOverflowStop(true);
    setOverflowStop(false);
    setHalfCycle(true);
    setHalfCycle(false);
    setOverflow(true);
    setOverflow(false);

    expect(depositMock).toHaveBeenCalledWith('CSWPS', '1');
    expect(depositMock).toHaveBeenCalledWith('CSWPS', '0');
    expect(depositMock).toHaveBeenCalledWith('CSWOS', '1');
    expect(depositMock).toHaveBeenCalledWith('CSWOS', '0');
    expect(depositMock).toHaveBeenCalledWith('HALF', '1');
    expect(depositMock).toHaveBeenCalledWith('HALF', '0');
    expect(depositMock).toHaveBeenCalledWith('OV', '1');
    expect(depositMock).toHaveBeenCalledWith('OV', '0');
  });

  it('resets accumulator registers', () => {
    resetAccumulator();
    expect(depositMock).toHaveBeenCalledWith('DIST', ZERO_DATA);
    expect(depositMock).toHaveBeenCalledWith('ACCLO', ZERO_DATA);
    expect(depositMock).toHaveBeenCalledWith('ACCUP', ZERO_DATA);
    expect(depositMock).toHaveBeenCalledWith('OV', '0');
  });

  it('sends RESET command', () => {
    reset();
    expect(sendCommandMock).toHaveBeenCalledWith('RESET');
  });

  it('sets memory size via command', () => {
    setMemorySize('1K');
    setMemorySize('2K');
    setMemorySize('4K');
    expect(sendCommandMock).toHaveBeenCalledWith('SET CPU 1K');
    expect(sendCommandMock).toHaveBeenCalledWith('SET CPU 2K');
    expect(sendCommandMock).toHaveBeenCalledWith('SET CPU 4K');
  });
});
