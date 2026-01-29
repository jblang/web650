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

  it('calls change handlers for knobs and address', () => {
    const handlers = {
      onProgrammedChange: vi.fn(),
      onHalfCycleChange: vi.fn(),
      onAddressChange: vi.fn(),
      onControlChange: vi.fn(),
      onDisplayChange: vi.fn(),
      onOverflowChange: vi.fn(),
      onErrorChange: vi.fn(),
    };

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
          {...handlers}
        />
      );
    });

    const knobs = container.querySelectorAll('[data-testid^="knob-"]');
    knobs.forEach((btn) => act(() => (btn as HTMLButtonElement).click()));
    const addr = container.querySelector('[data-testid="addr"]') as HTMLButtonElement;
    act(() => addr.click());

    expect(handlers.onProgrammedChange).toHaveBeenCalled();
    expect(handlers.onHalfCycleChange).toHaveBeenCalled();
    expect(handlers.onControlChange).toHaveBeenCalled();
    expect(handlers.onDisplayChange).toHaveBeenCalled();
    expect(handlers.onOverflowChange).toHaveBeenCalled();
    expect(handlers.onErrorChange).toHaveBeenCalled();
    expect(handlers.onAddressChange).toHaveBeenCalledWith('0001');
  });
});

/* @vitest-environment jsdom */
