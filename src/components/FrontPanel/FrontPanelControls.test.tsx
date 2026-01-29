import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import ControlSection from './ControlSection';
import DecimalKnob from './DecimalKnob';
import LabeledKnob from './LabeledKnob';

let container: HTMLDivElement;
let root: Root;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const click = (el: Element | null) => {
  if (!el) throw new Error('element not found');
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

describe('FrontPanel controls', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('wires control buttons to their handlers', () => {
    const handlers = {
      onTransferClick: vi.fn(),
      onProgramStartClick: vi.fn(),
      onProgramStopClick: vi.fn(),
      onProgramResetClick: vi.fn(),
      onComputerResetClick: vi.fn(),
      onAccumResetClick: vi.fn(),
      onErrorResetClick: vi.fn(),
      onErrorSenseResetClick: vi.fn(),
      onRestartClick: vi.fn(),
    };

    render(<ControlSection {...handlers} />);

    const clickByLabel = (label: string) => {
      const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === label);
      click(btn ?? null);
    };

    clickByLabel('PROGRAM START');
    clickByLabel('PROGRAM STOP');
    clickByLabel('PROGRAM RESET');
    clickByLabel('COMPUTER RESET');
    clickByLabel('ACCUM RESET');
    clickByLabel('ERROR RESET');
    clickByLabel('ERROR SENSE RESET');
    clickByLabel('RESTART EMULATOR');
    clickByLabel('TRANSFER');

    expect(handlers.onProgramStartClick).toHaveBeenCalledTimes(1);
    expect(handlers.onProgramStopClick).toHaveBeenCalledTimes(1);
    expect(handlers.onProgramResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onComputerResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onAccumResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onErrorResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onErrorSenseResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onRestartClick).toHaveBeenCalledTimes(1);
    expect(handlers.onTransferClick).toHaveBeenCalledTimes(1);
  });

  it('DecimalKnob increments and decrements via click zones', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={3} onChange={onChange} />);

    const dec = container.querySelector('[title=\"Click to rotate counter-clockwise\"]');
    const inc = container.querySelector('[title=\"Click to rotate clockwise\"]');

    click(dec);
    click(inc);

    expect(onChange).toHaveBeenCalledWith(2); // 3 -> 2 (wrap-10)
    expect(onChange).toHaveBeenCalledWith(4); // 3 -> 4
  });

  it('LabeledKnob wraps positions when rotating left and right', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 30 },
      { label: 'C', angle: 90 },
    ];
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={positions} onChange={onChange} />);

    const dec = container.querySelector('[title=\"Click to rotate counter-clockwise\"]');
    const inc = container.querySelector('[title=\"Click to rotate clockwise\"]');

    click(dec); // from 0 to 2
    click(inc); // from 0 to 1 (note: component doesn't update without parent state)

    expect(onChange).toHaveBeenCalledWith(positions.length - 1);
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

/* @vitest-environment jsdom */
