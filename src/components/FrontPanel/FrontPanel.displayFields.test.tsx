import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import FrontPanel from './FrontPanel';
import { Programmed, HalfCycle, Overflow, Control, Display, ErrorSwitch } from '@/lib/simh/i650/controls';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

vi.mock('./EntrySection', () => ({
  default: () => <div data-testid="entry-section" />,
}));

vi.mock('./OperationDisplay', () => ({
  default: () => <div data-testid="operation-display" />,
}));

vi.mock('./AddressDisplay', () => ({
  default: () => <div data-testid="address-display" />,
}));

vi.mock('./OperatingStatus', () => ({
  default: () => <div data-testid="operating-status" />,
}));

vi.mock('./CheckingStatus', () => ({
  default: () => <div data-testid="checking-status" />,
}));

vi.mock('./ControlSection', () => ({
  default: () => <div data-testid="control-section" />,
}));

vi.mock('./ButtonSection', () => ({
  default: () => <div data-testid="button-section" />,
}));

vi.mock('./BiQuinaryNumber', () => ({
  default: ({
    value,
    testIdPrefix,
    digitCount,
  }: {
    value: string | number | number[];
    testIdPrefix: string;
    digitCount: number;
  }) => (
    <div
      data-testid={`biquinary-${testIdPrefix}`}
      data-value={JSON.stringify(value)}
      data-digit-count={digitCount}
    />
  ),
}));

vi.mock('./SignDisplay', () => ({
  default: ({ value }: { value: string }) => <div data-testid="sign-display" data-value={value} />,
}));

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('FrontPanel display fields', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders display fields using extracted op/data/instruction values', () => {
    render(
      <FrontPanel
        displayValue="1234567890-"
        entryValue="0000000000+"
        addressDisplay="1234"
        operation="69"
        operatingState={{
          dataAddress: false,
          program: true,
          inputOutput: false,
          inquiry: false,
          ramac: false,
          magneticTape: false,
          instAddress: false,
          accumulator: false,
          overflow: false,
        }}
        checkingState={{
          programRegister: false,
          controlUnit: false,
          storageSelection: false,
          storageUnit: false,
          distributor: false,
          clocking: false,
          accumulator: false,
          errorSense: false,
        }}
        programmed={Programmed.RUN}
        halfCycle={HalfCycle.RUN}
        addressSelection="0000"
        control={Control.RUN}
        display={Display.LOWER_ACCUM}
        overflow={Overflow.STOP}
        error={ErrorSwitch.STOP}
        onEntryValueChange={vi.fn()}
        onProgrammedChange={vi.fn()}
        onHalfCycleChange={vi.fn()}
        onAddressChange={vi.fn()}
        onControlChange={vi.fn()}
        onDisplayChange={vi.fn()}
        onOverflowChange={vi.fn()}
        onErrorChange={vi.fn()}
        onTransferClick={vi.fn()}
        onProgramStartClick={vi.fn()}
        onProgramStopClick={vi.fn()}
        onProgramResetClick={vi.fn()}
        onComputerResetClick={vi.fn()}
        onAccumResetClick={vi.fn()}
        onEmulatorResetClick={vi.fn()}
      />
    );

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const values = Array.from(biquinaries).map((node) =>
      JSON.parse(node.getAttribute('data-value') || '""')
    );
    expect(values).toEqual(['12', '3456', '7890']);

    const sign = container.querySelector('[data-testid="sign-display"]');
    expect(sign?.getAttribute('data-value')).toBe('-');
  });
});

/* @vitest-environment jsdom */
