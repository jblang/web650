import { describe, expect, it } from 'vitest';
import * as controls from './controls';

describe('i650 controls', () => {
  it('maps display switch to expected register values', () => {
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

  it('detects manual operation control switch', () => {
    expect(controls.isManualOperation(controls.Control.MANUAL_OPERATION)).toBe(true);
    expect(controls.isManualOperation(controls.Control.RUN)).toBe(false);
  });
});
