import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';

vi.mock('./LabeledKnob', () => ({
  __esModule: true,
  default: (props: { position: number; onChange?: (v: number) => void; style?: React.CSSProperties }) => (
    <button data-testid={`knob-${props.position}`} onClick={() => props.onChange?.(props.position + 1)}>
      {props.position}
    </button>
  ),
}));

vi.mock('./AddressSelection', () => ({
  __esModule: true,
  default: (props: { value: string; onChange: (v: string) => void }) => (
    <button data-testid="addr" onClick={() => props.onChange(props.value === '0000' ? '0001' : '0000')}>
      {props.value}
    </button>
  ),
}));

import ConfigSection from './ConfigSection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('ConfigSection', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('calls onProgrammedChange when programmed knob changes', () => {
    const onProgrammedChange = vi.fn();
    act(() => {
      root.render(
        <ConfigSection
          programmed={0}
          halfCycle={0}
          addressSelection="0000"
          control={0}
          display={0}
          overflow={0}
          error={0}
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
        <ConfigSection
          programmed={0}
          halfCycle={0}
          addressSelection="0000"
          control={0}
          display={0}
          overflow={0}
          error={0}
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
        <ConfigSection
          programmed={0}
          halfCycle={0}
          addressSelection="0000"
          control={0}
          display={0}
          overflow={0}
          error={0}
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
        <ConfigSection
          programmed={0}
          halfCycle={0}
          addressSelection="0000"
          control={0}
          display={0}
          overflow={0}
          error={0}
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
        <ConfigSection
          programmed={0}
          halfCycle={0}
          addressSelection="0000"
          control={0}
          display={0}
          overflow={0}
          error={0}
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
        <ConfigSection
          programmed={0}
          halfCycle={0}
          addressSelection="0000"
          control={0}
          display={0}
          overflow={0}
          error={0}
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
        <ConfigSection
          programmed={0}
          halfCycle={0}
          addressSelection="0000"
          control={0}
          display={0}
          overflow={0}
          error={0}
          onErrorChange={onErrorChange}
        />
      );
    });

    const knob = container.querySelectorAll('[data-testid^="knob-"]')[5] as HTMLButtonElement;
    act(() => knob.click());

    expect(onErrorChange).toHaveBeenCalledWith(1);
  });
});

/* @vitest-environment jsdom */
