import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import ControlSection from './ControlSection';
import controlStyles from './ControlSection.module.scss';
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
      onEmulatorResetClick: vi.fn(),
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
    clickByLabel('EMULATOR RESET');
    clickByLabel('TRANSFER');

    expect(handlers.onProgramStartClick).toHaveBeenCalledTimes(1);
    expect(handlers.onProgramStopClick).toHaveBeenCalledTimes(1);
    expect(handlers.onProgramResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onComputerResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onAccumResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onEmulatorResetClick).toHaveBeenCalledTimes(1);
    expect(handlers.onTransferClick).toHaveBeenCalledTimes(1);
  });

  it('shows pressed state while holding a control button', () => {
    render(<ControlSection />);

    const button = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'TRANSFER');
    if (!button) throw new Error('button not found');

    act(() => {
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(button.classList.contains(controlStyles.pressed)).toBe(true);

    act(() => {
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    expect(button.classList.contains(controlStyles.pressed)).toBe(false);

    act(() => {
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    });
    expect(button.classList.contains(controlStyles.pressed)).toBe(false);
  });

  it('DecimalKnob increments and decrements via click zones', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={3} onChange={onChange} />);

    const dec = container.querySelector('[title="DECREMENT"]');
    const inc = container.querySelector('[title="INCREMENT"]');

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

    const ccw = container.querySelector('[title="CCW"]');
    const cw = container.querySelector('[title="CW"]');

    click(ccw); // from 0 to 2
    click(cw); // from 0 to 1 (note: component doesn't update without parent state)

    expect(onChange).toHaveBeenCalledWith(positions.length - 1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('LabeledKnob selects a position when label clicked', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 30 },
      { label: 'C', angle: 90 },
    ];
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={positions} onChange={onChange} />);

    const label = Array.from(container.querySelectorAll('span')).find((el) => el.textContent === 'B');
    click(label ?? null);

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('LabeledKnob handles out-of-range position values', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 30 },
    ];
    render(<LabeledKnob position={99} positions={positions} />);

    const knob = container.querySelector('[data-current-label]');
    expect(knob?.getAttribute('data-current-label')).toBe('');
  });

  it('LabeledKnob has slider role and ARIA attributes', () => {
    const positions = [
      { label: 'STOP', angle: -30 },
      { label: 'RUN', angle: 30 },
      { label: 'FAST', angle: 90 },
    ];
    render(<LabeledKnob position={1} positions={positions} label="Control" />);

    const slider = container.querySelector('[role="slider"]');
    expect(slider).not.toBeNull();
    expect(slider?.getAttribute('aria-valuenow')).toBe('1');
    expect(slider?.getAttribute('aria-valuemin')).toBe('0');
    expect(slider?.getAttribute('aria-valuemax')).toBe('2');
    expect(slider?.getAttribute('aria-valuetext')).toBe('RUN');
    expect(slider?.getAttribute('aria-label')).toBe('Control');
    expect(slider?.getAttribute('tabindex')).toBe('0');
  });

  it('LabeledKnob falls back to testId for aria-label when no label prop', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 30 },
    ];
    render(<LabeledKnob position={0} positions={positions} testId="my-knob" />);

    const slider = container.querySelector('[role="slider"]');
    expect(slider?.getAttribute('aria-label')).toBe('my-knob');
  });

  it('LabeledKnob navigates with ArrowRight and ArrowLeft keys', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 0 },
      { label: 'C', angle: 30 },
    ];
    const onChange = vi.fn();
    render(<LabeledKnob position={1} positions={positions} onChange={onChange} />);

    const slider = container.querySelector('[role="slider"]')!;
    act(() => {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(2);

    onChange.mockClear();
    act(() => {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('LabeledKnob navigates with ArrowUp and ArrowDown keys', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 0 },
      { label: 'C', angle: 30 },
    ];
    const onChange = vi.fn();
    render(<LabeledKnob position={1} positions={positions} onChange={onChange} />);

    const slider = container.querySelector('[role="slider"]')!;
    act(() => {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(2);

    onChange.mockClear();
    act(() => {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('LabeledKnob Home key selects first position', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 0 },
      { label: 'C', angle: 30 },
    ];
    const onChange = vi.fn();
    render(<LabeledKnob position={2} positions={positions} onChange={onChange} />);

    const slider = container.querySelector('[role="slider"]')!;
    act(() => {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('LabeledKnob End key selects last position', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 0 },
      { label: 'C', angle: 30 },
    ];
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={positions} onChange={onChange} />);

    const slider = container.querySelector('[role="slider"]')!;
    act(() => {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('LabeledKnob wraps around with arrow keys', () => {
    const positions = [
      { label: 'A', angle: -30 },
      { label: 'B', angle: 30 },
    ];
    const onChange = vi.fn();
    render(<LabeledKnob position={0} positions={positions} onChange={onChange} />);

    const slider = container.querySelector('[role="slider"]')!;
    act(() => {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(1); // wraps from 0 to last

    onChange.mockClear();
    render(<LabeledKnob position={1} positions={positions} onChange={onChange} />);
    const slider2 = container.querySelector('[role="slider"]')!;
    act(() => {
      slider2.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(0); // wraps from last to 0
  });

  it('ControlSection buttons have type="button"', () => {
    render(<ControlSection />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('type')).toBe('button');
    });
  });
});

/* @vitest-environment jsdom */
