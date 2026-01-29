import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import DecimalKnob from './DecimalKnob';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('DecimalKnob', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('increments and decrements via knob halves', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={3} onChange={onChange} />);

    const ccw = container.querySelector('[title="Click to rotate counter-clockwise"]');
    const cw = container.querySelector('[title="Click to rotate clockwise"]');

    act(() => ccw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    act(() => cw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onChange).toHaveBeenCalledWith(2); // 3 -> 2
    expect(onChange).toHaveBeenCalledWith(4); // 3 -> 4
  });

  it('wraps around from 0 to 9 and 9 to 0', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={0} onChange={onChange} />);
    const ccw = container.querySelector('[title="Click to rotate counter-clockwise"]');
    act(() => ccw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onChange).toHaveBeenCalledWith(9);

    onChange.mockClear();
    render(<DecimalKnob value={9} onChange={onChange} />);
    const cw = container.querySelector('[title="Click to rotate clockwise"]');
    act(() => cw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('opens popup and selects digit', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={5} onChange={onChange} />);

    const display = container.querySelector('[title="Click to select digit"]');
    act(() => display?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    const digitEight = Array.from(container.querySelectorAll('[role="button"], div')).find((el) => el.textContent === '8');
    act(() => digitEight?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onChange).toHaveBeenCalledWith(8);
  });
});

/* @vitest-environment jsdom */
