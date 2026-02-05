import { beforeEach, describe, expect, it, vi } from 'vitest';

const memoryMocks = vi.hoisted(() => ({
  readMemory: vi.fn(() => '1111111111+'),
  writeMemory: vi.fn(),
}));

vi.mock('./memory', () => memoryMocks);

describe('i650 controls', () => {
  beforeEach(() => {
    vi.resetModules();
    memoryMocks.readMemory.mockReset();
    memoryMocks.writeMemory.mockReset();
    memoryMocks.readMemory.mockReturnValue('1111111111+');
  });

  it('maps display switch to expected register values', async () => {
    const controls = await import('./controls');
    const regs = {
      lowerAccumulator: '0000000001+',
      upperAccumulator: '0000000002+',
      distributor: '0000000003+',
      programRegister: '0000000004+',
    };

    expect(controls.getDisplayValue(controls.Display.LOWER_ACCUM, regs)).toBe('0000000001+');
    expect(controls.getDisplayValue(controls.Display.UPPER_ACCUM, regs)).toBe('0000000002+');
    expect(controls.getDisplayValue(controls.Display.DISTRIBUTOR, regs)).toBe('0000000003+');
    expect(controls.getDisplayValue(controls.Display.PROGRAM_REGISTER, regs)).toBe('0000000004+');
    expect(controls.getDisplayValue(99 as typeof controls.Display[keyof typeof controls.Display], regs)).toBe(
      '0000000000+'
    );
  });

  it('performs read-out drum transfer', async () => {
    memoryMocks.readMemory.mockReturnValue('2222222222+');
    const controls = await import('./controls');

    const result = controls.performDrumTransfer(controls.Display.READ_OUT_STORAGE, '1234', '0000000000+');
    expect(result).toEqual({ type: 'read', value: '2222222222+' });
    expect(memoryMocks.readMemory).toHaveBeenCalledWith('1234');
  });

  it('performs read-in drum transfer', async () => {
    const controls = await import('./controls');

    const result = controls.performDrumTransfer(controls.Display.READ_IN_STORAGE, '1234', '9876543210+');
    expect(result).toEqual({ type: 'write', address: '1234', value: '9876543210+' });
    expect(memoryMocks.writeMemory).toHaveBeenCalledWith('1234', '9876543210+');
  });

  it('returns none when display switch is not in transfer mode', async () => {
    const controls = await import('./controls');

    const result = controls.performDrumTransfer(controls.Display.DISTRIBUTOR, '1234', '0000000000+');
    expect(result).toEqual({ type: 'none' });
    expect(memoryMocks.readMemory).not.toHaveBeenCalled();
    expect(memoryMocks.writeMemory).not.toHaveBeenCalled();
  });

  it('detects manual operation control switch', async () => {
    const controls = await import('./controls');
    expect(controls.isManualOperation(controls.Control.MANUAL_OPERATION)).toBe(true);
    expect(controls.isManualOperation(controls.Control.RUN)).toBe(false);
  });
});
