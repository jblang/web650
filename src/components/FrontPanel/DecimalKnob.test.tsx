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

    const ccw = container.querySelector('[title="DECREMENT"]');
    const cw = container.querySelector('[title="INCREMENT"]');

    act(() => ccw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    act(() => cw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onChange).toHaveBeenCalledWith(2); // 3 -> 2 (from ccw - decrement)
    expect(onChange).toHaveBeenCalledWith(4); // 3 -> 4 (from cw - increment)
  });

  it('wraps around from 0 to 9 and 9 to 0', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={0} onChange={onChange} />);
    const ccw = container.querySelector('[title="DECREMENT"]');
    act(() => ccw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onChange).toHaveBeenCalledWith(9);

    onChange.mockClear();
    render(<DecimalKnob value={9} onChange={onChange} />);
    const cw = container.querySelector('[title="INCREMENT"]');
    act(() => cw?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('opens popup and selects digit', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={5} onChange={onChange} />);

    const display = container.querySelector('[title="CHOOSE"]');
    act(() => display?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    const digitEight = Array.from(container.querySelectorAll('[role="button"], div')).find((el) => el.textContent === '8');
    act(() => digitEight?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(onChange).toHaveBeenCalledWith(8);
  });

  const getDigitNodes = () =>
    Array.from(container.querySelectorAll('div')).filter((el) =>
      /^[0-9]$/.test((el.textContent ?? '').trim())
    );

  it('closes popup when clicking outside', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={5} onChange={onChange} />);

    const display = container.querySelector('[title="CHOOSE"]');
    act(() => display?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const openCount = getDigitNodes().length;
    expect(openCount).toBeGreaterThan(1);

    act(() => document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    const closedCount = getDigitNodes().length;
    expect(closedCount).toBeLessThan(openCount);
  });

  it('keeps popup open when clicking inside the knob', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={5} onChange={onChange} />);

    const display = container.querySelector('[title="CHOOSE"]');
    act(() => display?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const openCount = getDigitNodes().length;
    expect(openCount).toBeGreaterThan(1);

    act(() => display?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    const stillOpenCount = getDigitNodes().length;
    expect(stillOpenCount).toBe(openCount);
  });

  it('adjusts popup offset when overflowing viewport', () => {
    const onChange = vi.fn();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 100 });
    const originalGetBounding = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      return {
        left: -10,
        right: 120,
        top: 0,
        bottom: 0,
        width: 130,
        height: 20,
        x: -10,
        y: 0,
        toJSON: () => '',
      } as DOMRect;
    };

    try {
      render(<DecimalKnob value={5} onChange={onChange} />);
      const display = container.querySelector('[title="CHOOSE"]');
      act(() => display?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

      const digitNodes = getDigitNodes();
      expect(digitNodes.length).toBeGreaterThan(1);
      const popup = digitNodes[1]?.parentElement as HTMLElement | undefined;
      expect(popup?.style.marginLeft).not.toBe('');
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
      Element.prototype.getBoundingClientRect = originalGetBounding;
    }
  });

  it('has spinbutton role and ARIA attributes', () => {
    render(<DecimalKnob value={5} onChange={() => {}} testId="test-knob" />);
    const knob = container.querySelector('[role="spinbutton"]');
    expect(knob).not.toBeNull();
    expect(knob?.getAttribute('aria-valuenow')).toBe('5');
    expect(knob?.getAttribute('aria-valuemin')).toBe('0');
    expect(knob?.getAttribute('aria-valuemax')).toBe('9');
    expect(knob?.getAttribute('aria-label')).toBe('Digit selector');
    expect(knob?.getAttribute('tabindex')).toBe('0');
  });

  it('increments on ArrowUp key', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={3} onChange={onChange} />);
    const knob = container.querySelector('[role="spinbutton"]')!;
    act(() => {
      knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('decrements on ArrowDown key', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={3} onChange={onChange} />);
    const knob = container.querySelector('[role="spinbutton"]')!;
    act(() => {
      knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('selects digit on number key press', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={3} onChange={onChange} />);
    const knob = container.querySelector('[role="spinbutton"]')!;
    act(() => {
      knob.dispatchEvent(new KeyboardEvent('keydown', { key: '7', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('wraps from 9 to 0 on ArrowRight key', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={9} onChange={onChange} />);
    const knob = container.querySelector('[role="spinbutton"]')!;
    act(() => {
      knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('wraps from 0 to 9 on ArrowLeft key', () => {
    const onChange = vi.fn();
    render(<DecimalKnob value={0} onChange={onChange} />);
    const knob = container.querySelector('[role="spinbutton"]')!;
    act(() => {
      knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(9);
  });

  it('closes popup on Escape key', () => {
    render(<DecimalKnob value={5} onChange={() => {}} />);
    const display = container.querySelector('[title="CHOOSE"]');
    act(() => display?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const openCount = getDigitNodes().length;
    expect(openCount).toBeGreaterThan(1);

    const knob = container.querySelector('[role="spinbutton"]')!;
    act(() => {
      knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    const closedCount = getDigitNodes().length;
    expect(closedCount).toBeLessThan(openCount);
  });

  it('adjusts popup offset when overflowing on the right', () => {
    const onChange = vi.fn();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 100 });
    const originalGetBounding = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      return {
        left: 10,
        right: 140,
        top: 0,
        bottom: 0,
        width: 130,
        height: 20,
        x: 10,
        y: 0,
        toJSON: () => '',
      } as DOMRect;
    };

    try {
      render(<DecimalKnob value={5} onChange={onChange} />);
      const display = container.querySelector('[title="CHOOSE"]');
      act(() => display?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

      const digitNodes = getDigitNodes();
      expect(digitNodes.length).toBeGreaterThan(1);
      const popup = digitNodes[1]?.parentElement as HTMLElement | undefined;
      expect(popup?.style.marginLeft).not.toBe('');
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
      Element.prototype.getBoundingClientRect = originalGetBounding;
    }
  });

  it('scales wrapper dimensions when scaleFactor is provided', () => {
    render(<DecimalKnob value={3} onChange={() => {}} scaleFactor={2} />);
    const wrapper = container.querySelector('[class*="decimalKnobWrapper"]');
    expect(wrapper?.getAttribute('style')).toContain('width: 96px');
    expect(wrapper?.getAttribute('style')).toContain('height: 96px');
  });

  it('uses default scale when scaleFactor is invalid', () => {
    render(<DecimalKnob value={3} onChange={() => {}} scaleFactor={0} />);
    const knob = container.querySelector('[role="spinbutton"]');
    expect(knob?.getAttribute('style')).toContain('height: 102px');
  });
});

/* @vitest-environment jsdom */
