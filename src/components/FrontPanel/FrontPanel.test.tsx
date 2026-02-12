import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import FrontPanel, { FrontPanelProps } from './FrontPanel';
import type { OperatingState } from './OperatingStatus';
import type { CheckingState } from './CheckingStatus';
import { Programmed, HalfCycle, Overflow, Control, Display, ErrorSwitch } from '@/lib/simh/i650/controls';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

// Mock all child components
vi.mock('./DisplaySection', () => ({
  default: ({ value }: { value: string | number }) => (
    <div data-testid="display-section" data-value={value}>
      DisplaySection
    </div>
  ),
}));

vi.mock('./EntrySection', () => ({
  default: ({ value, onChange }: { value: string; onChange: (next: string) => void | Promise<void> }) => (
    <div data-testid="entry-section" data-value={value} data-on-change={typeof onChange}>
      EntrySection
    </div>
  ),
}));

vi.mock('./OperationDisplay', () => ({
  default: ({ value }: { value: string | number }) => (
    <div data-testid="operation-display" data-value={value}>
      OperationDisplay
    </div>
  ),
}));

vi.mock('./AddressDisplay', () => ({
  default: ({ value }: { value: string | number }) => (
    <div data-testid="address-display" data-value={value}>
      AddressDisplay
    </div>
  ),
}));

vi.mock('./OperatingStatus', () => ({
  default: ({ state }: { state: OperatingState }) => (
    <div data-testid="operating-status" data-state={JSON.stringify(state)}>
      OperatingStatus
    </div>
  ),
}));

vi.mock('./CheckingStatus', () => ({
  default: ({ state }: { state: CheckingState }) => (
    <div data-testid="checking-status" data-state={JSON.stringify(state)}>
      CheckingStatus
    </div>
  ),
}));

vi.mock('./ConfigSection', () => ({
  default: ({
    programmed,
    halfCycle,
    addressSelection,
    control,
    display,
    overflow,
    error,
    onProgrammedChange,
    onHalfCycleChange,
    onAddressChange,
    onControlChange,
    onDisplayChange,
    onOverflowChange,
    onErrorChange,
  }: {
    programmed: number;
    halfCycle: number;
    addressSelection: string;
    control: number;
    display: number;
    overflow: number;
    error: number;
    onProgrammedChange: (value: number) => void | Promise<void>;
    onHalfCycleChange: (value: number) => void | Promise<void>;
    onAddressChange: (value: string) => void | Promise<void>;
    onControlChange: (value: number) => void | Promise<void>;
    onDisplayChange: (value: number) => void | Promise<void>;
    onOverflowChange: (value: number) => void | Promise<void>;
    onErrorChange: (value: number) => void | Promise<void>;
  }) => (
    <div
      data-testid="config-section"
      data-programmed={programmed}
      data-half-cycle={halfCycle}
      data-address-selection={addressSelection}
      data-control={control}
      data-display={display}
      data-overflow={overflow}
      data-error={error}
      data-on-programmed-change={typeof onProgrammedChange}
      data-on-half-cycle-change={typeof onHalfCycleChange}
      data-on-address-change={typeof onAddressChange}
      data-on-control-change={typeof onControlChange}
      data-on-display-change={typeof onDisplayChange}
      data-on-overflow-change={typeof onOverflowChange}
      data-on-error-change={typeof onErrorChange}
    >
      ConfigSection
    </div>
  ),
}));

vi.mock('./ControlSection', () => ({
  default: ({
    onTransferClick,
    onProgramStartClick,
    onProgramStopClick,
    onProgramResetClick,
    onComputerResetClick,
    onAccumResetClick,
    onEmulatorResetClick,
  }: {
    onTransferClick?: () => void | Promise<void>;
    onProgramStartClick?: () => void | Promise<void>;
    onProgramStopClick?: () => void | Promise<void>;
    onProgramResetClick?: () => void | Promise<void>;
    onComputerResetClick?: () => void | Promise<void>;
    onAccumResetClick?: () => void | Promise<void>;
    onEmulatorResetClick?: () => void | Promise<void>;
  }) => (
    <div
      data-testid="control-section"
      data-on-transfer-click={typeof onTransferClick}
      data-on-program-start-click={typeof onProgramStartClick}
      data-on-program-stop-click={typeof onProgramStopClick}
      data-on-program-reset-click={typeof onProgramResetClick}
      data-on-computer-reset-click={typeof onComputerResetClick}
      data-on-accum-reset-click={typeof onAccumResetClick}
      data-on-emulator-reset-click={typeof onEmulatorResetClick}
    >
      ControlSection
    </div>
  ),
}));

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('FrontPanel', () => {
  const mockProps: FrontPanelProps = {
    displayValue: '1234567890+',
    entryValue: '0000000000+',
    addressDisplay: '1234',
    operation: '69',
    operatingState: {
      dataAddress: false,
      program: true,
      inputOutput: false,
      inquiry: false,
      ramac: false,
      magneticTape: false,
      instAddress: false,
      accumulator: false,
      overflow: false,
    },
    checkingState: {
      programRegister: false,
      controlUnit: false,
      storageSelection: false,
      storageUnit: false,
      distributor: false,
      clocking: false,
      accumulator: false,
      errorSense: false,
    },
    programmed: Programmed.RUN,
    halfCycle: HalfCycle.RUN,
    addressSelection: '0000',
    control: Control.RUN,
    display: Display.LOWER_ACCUM,
    overflow: Overflow.STOP,
    error: ErrorSwitch.STOP,
    onEntryValueChange: vi.fn(),
    onProgrammedChange: vi.fn(),
    onHalfCycleChange: vi.fn(),
    onAddressChange: vi.fn(),
    onControlChange: vi.fn(),
    onDisplayChange: vi.fn(),
    onOverflowChange: vi.fn(),
    onErrorChange: vi.fn(),
    onTransferClick: vi.fn(),
    onProgramStartClick: vi.fn(),
    onProgramStopClick: vi.fn(),
    onProgramResetClick: vi.fn(),
    onComputerResetClick: vi.fn(),
    onAccumResetClick: vi.fn(),
    onEmulatorResetClick: vi.fn(),
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders all child components', () => {
    render(<FrontPanel {...mockProps} />);

    expect(container.querySelector('[data-testid="display-section"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="entry-section"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="operation-display"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="address-display"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="operating-status"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="checking-status"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="config-section"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="control-section"]')).not.toBeNull();
  });

  it('passes displayValue to DisplaySection', () => {
    render(<FrontPanel {...mockProps} />);

    const displaySection = container.querySelector('[data-testid="display-section"]');
    expect(displaySection?.getAttribute('data-value')).toBe('1234567890+');
  });

  it('passes entryValue and onEntryValueChange to EntrySection', () => {
    render(<FrontPanel {...mockProps} />);

    const entrySection = container.querySelector('[data-testid="entry-section"]');
    expect(entrySection?.getAttribute('data-value')).toBe('0000000000+');
    expect(entrySection?.getAttribute('data-on-change')).toBe('function');
  });

  it('passes operation to OperationDisplay', () => {
    render(<FrontPanel {...mockProps} />);

    const operationDisplay = container.querySelector('[data-testid="operation-display"]');
    expect(operationDisplay?.getAttribute('data-value')).toBe('69');
  });

  it('passes addressDisplay to AddressDisplay', () => {
    render(<FrontPanel {...mockProps} />);

    const addressDisplay = container.querySelector('[data-testid="address-display"]');
    expect(addressDisplay?.getAttribute('data-value')).toBe('1234');
  });

  it('passes operatingState to OperatingStatus', () => {
    render(<FrontPanel {...mockProps} />);

    const operatingStatus = container.querySelector('[data-testid="operating-status"]');
    const state = JSON.parse(operatingStatus?.getAttribute('data-state') || '{}');
    expect(state.program).toBe(true);
    expect(state.dataAddress).toBe(false);
  });

  it('passes checkingState to CheckingStatus', () => {
    render(<FrontPanel {...mockProps} />);

    const checkingStatus = container.querySelector('[data-testid="checking-status"]');
    const state = JSON.parse(checkingStatus?.getAttribute('data-state') || '{}');
    expect(state.programRegister).toBe(false);
    expect(state.controlUnit).toBe(false);
  });

  it('passes all config values to ConfigSection', () => {
    render(<FrontPanel {...mockProps} />);

    const configSection = container.querySelector('[data-testid="config-section"]');
    expect(configSection?.getAttribute('data-programmed')).toBe('1');
    expect(configSection?.getAttribute('data-half-cycle')).toBe('1');
    expect(configSection?.getAttribute('data-address-selection')).toBe('0000');
    expect(configSection?.getAttribute('data-control')).toBe('1');
    expect(configSection?.getAttribute('data-display')).toBe('0');
    expect(configSection?.getAttribute('data-overflow')).toBe('0');
    expect(configSection?.getAttribute('data-error')).toBe('0');
  });

  it('passes all config handlers to ConfigSection', () => {
    render(<FrontPanel {...mockProps} />);

    const configSection = container.querySelector('[data-testid="config-section"]');
    expect(configSection?.getAttribute('data-on-programmed-change')).toBe('function');
    expect(configSection?.getAttribute('data-on-half-cycle-change')).toBe('function');
    expect(configSection?.getAttribute('data-on-address-change')).toBe('function');
    expect(configSection?.getAttribute('data-on-control-change')).toBe('function');
    expect(configSection?.getAttribute('data-on-display-change')).toBe('function');
    expect(configSection?.getAttribute('data-on-overflow-change')).toBe('function');
    expect(configSection?.getAttribute('data-on-error-change')).toBe('function');
  });

  it('passes all button handlers to ControlSection', () => {
    render(<FrontPanel {...mockProps} />);

    const controlSection = container.querySelector('[data-testid="control-section"]');
    expect(controlSection?.getAttribute('data-on-transfer-click')).toBe('function');
    expect(controlSection?.getAttribute('data-on-program-start-click')).toBe('function');
    expect(controlSection?.getAttribute('data-on-program-stop-click')).toBe('function');
    expect(controlSection?.getAttribute('data-on-program-reset-click')).toBe('function');
    expect(controlSection?.getAttribute('data-on-computer-reset-click')).toBe('function');
    expect(controlSection?.getAttribute('data-on-accum-reset-click')).toBe('function');
    expect(controlSection?.getAttribute('data-on-emulator-reset-click')).toBe('function');
  });

  it('handles optional control button handlers', () => {
    const propsWithoutButtons = {
      ...mockProps,
      onTransferClick: undefined,
      onProgramStartClick: undefined,
      onProgramStopClick: undefined,
      onProgramResetClick: undefined,
      onComputerResetClick: undefined,
      onAccumResetClick: undefined,
      onEmulatorResetClick: undefined,
    };

    render(<FrontPanel {...propsWithoutButtons} />);

    const controlSection = container.querySelector('[data-testid="control-section"]');
    expect(controlSection?.getAttribute('data-on-transfer-click')).toBe('undefined');
  });
});

/* @vitest-environment jsdom */
