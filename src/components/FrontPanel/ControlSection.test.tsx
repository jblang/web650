import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { Programmed, HalfCycle, Control, Display, Overflow, ErrorSwitch } from '@/lib/simh/i650/controls';

type KnobProps = { position: number; onChange?: (v: number) => void; testId?: string };
const knobPropsByTestId = new Map<string, KnobProps>();

vi.mock('./LabeledKnob', () => ({
  __esModule: true,
  default: (props: KnobProps) => {
    if (props.testId) knobPropsByTestId.set(props.testId, props);
    return (
      <button data-testid={`knob-${props.position}`} onClick={() => props.onChange?.(props.position + 1)}>
        {props.position}
      </button>
    );
  },
}));

vi.mock('./AddressSelection', () => ({
  __esModule: true,
  default: (props: { value: string; onChange: (v: string) => void }) => (
    <button data-testid="addr" onClick={() => props.onChange(props.value === '0000' ? '0001' : '0000')}>
      {props.value}
    </button>
  ),
}));

import ControlSection from './ControlSection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('ControlSection', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const baseProps = {
    programmed: Programmed.STOP,
    halfCycle: HalfCycle.HALF,
    addressSelection: '0000',
    control: Control.ADDRESS_STOP,
    display: Display.LOWER_ACCUM,
    overflow: Overflow.STOP,
    error: ErrorSwitch.STOP,
    onProgrammedChange: vi.fn(),
    onHalfCycleChange: vi.fn(),
    onAddressChange: vi.fn(),
    onControlChange: vi.fn(),
    onDisplayChange: vi.fn(),
    onOverflowChange: vi.fn(),
    onErrorChange: vi.fn(),
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    knobPropsByTestId.clear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('calls onProgrammedChange when programmed knob changes', () => {
    const onProgrammedChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onProgrammedChange={onProgrammedChange}
        />
      );
    });

    const knob = container.querySelectorAll('[data-testid^="knob-"]')[0] as HTMLButtonElement;
    act(() => knob.click());

    expect(onProgrammedChange).toHaveBeenCalledWith(1);
  });

  it('calls onHalfCycleChange when half cycle knob changes', () => {
    const onHalfCycleChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onHalfCycleChange={onHalfCycleChange}
        />
      );
    });

    const knob = container.querySelectorAll('[data-testid^="knob-"]')[1] as HTMLButtonElement;
    act(() => knob.click());

    expect(onHalfCycleChange).toHaveBeenCalledWith(1);
  });

  it('calls onAddressChange when address selection changes', () => {
    const onAddressChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onAddressChange={onAddressChange}
        />
      );
    });

    const addr = container.querySelector('[data-testid="addr"]') as HTMLButtonElement;
    act(() => addr.click());

    expect(onAddressChange).toHaveBeenCalledWith('0001');
  });

  it('calls onControlChange when control knob changes', () => {
    const onControlChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onControlChange={onControlChange}
        />
      );
    });

    const knob = container.querySelectorAll('[data-testid^="knob-"]')[2] as HTMLButtonElement;
    act(() => knob.click());

    expect(onControlChange).toHaveBeenCalledWith(1);
  });

  it('calls onDisplayChange when display knob changes', () => {
    const onDisplayChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onDisplayChange={onDisplayChange}
        />
      );
    });

    const knob = container.querySelectorAll('[data-testid^="knob-"]')[3] as HTMLButtonElement;
    act(() => knob.click());

    expect(onDisplayChange).toHaveBeenCalledWith(1);
  });

  it('calls onOverflowChange when overflow knob changes', () => {
    const onOverflowChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onOverflowChange={onOverflowChange}
        />
      );
    });

    const knob = container.querySelectorAll('[data-testid^="knob-"]')[4] as HTMLButtonElement;
    act(() => knob.click());

    expect(onOverflowChange).toHaveBeenCalledWith(1);
  });

  it('calls onErrorChange when error knob changes', () => {
    const onErrorChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onErrorChange={onErrorChange}
        />
      );
    });

    const knob = container.querySelectorAll('[data-testid^="knob-"]')[5] as HTMLButtonElement;
    act(() => knob.click());

    expect(onErrorChange).toHaveBeenCalledWith(1);
  });

  it('ignores out-of-range programmed knob changes', () => {
    const onProgrammedChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onProgrammedChange={onProgrammedChange}
        />
      );
    });

    act(() => knobPropsByTestId.get('programmed-knob')?.onChange?.(-1));
    act(() => knobPropsByTestId.get('programmed-knob')?.onChange?.(99));

    expect(onProgrammedChange).not.toHaveBeenCalled();
  });

  it('ignores out-of-range half cycle knob changes', () => {
    const onHalfCycleChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onHalfCycleChange={onHalfCycleChange}
        />
      );
    });

    act(() => knobPropsByTestId.get('half-cycle-knob')?.onChange?.(-1));
    act(() => knobPropsByTestId.get('half-cycle-knob')?.onChange?.(99));

    expect(onHalfCycleChange).not.toHaveBeenCalled();
  });

  it('ignores out-of-range control knob changes', () => {
    const onControlChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onControlChange={onControlChange}
        />
      );
    });

    act(() => knobPropsByTestId.get('control-knob')?.onChange?.(-1));
    act(() => knobPropsByTestId.get('control-knob')?.onChange?.(99));

    expect(onControlChange).not.toHaveBeenCalled();
  });

  it('ignores out-of-range display knob changes', () => {
    const onDisplayChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onDisplayChange={onDisplayChange}
        />
      );
    });

    act(() => knobPropsByTestId.get('display-knob')?.onChange?.(-1));
    act(() => knobPropsByTestId.get('display-knob')?.onChange?.(99));

    expect(onDisplayChange).not.toHaveBeenCalled();
  });

  it('ignores out-of-range overflow knob changes', () => {
    const onOverflowChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onOverflowChange={onOverflowChange}
        />
      );
    });

    act(() => knobPropsByTestId.get('overflow-knob')?.onChange?.(-1));
    act(() => knobPropsByTestId.get('overflow-knob')?.onChange?.(99));

    expect(onOverflowChange).not.toHaveBeenCalled();
  });

  it('ignores out-of-range error knob changes', () => {
    const onErrorChange = vi.fn();
    act(() => {
      root.render(
        <ControlSection
          {...baseProps}
          onErrorChange={onErrorChange}
        />
      );
    });

    act(() => knobPropsByTestId.get('error-knob')?.onChange?.(-1));
    act(() => knobPropsByTestId.get('error-knob')?.onChange?.(99));

    expect(onErrorChange).not.toHaveBeenCalled();
  });
});

/* @vitest-environment jsdom */
