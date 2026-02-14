import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import EntrySection from './EntrySection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('EntrySection', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('increments first digit knob and normalizes value', () => {
    const onChange = vi.fn();
    render(<EntrySection value="0000000000+" onChange={onChange} />);

    const incButtons = container.querySelectorAll('[title="INCREMENT"]');
    const firstDigitInc = incButtons[0];
    act(() => {
      firstDigitInc?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('1000000000+');
  });

  it('toggles sign knob to negative', () => {
    const onChange = vi.fn();
    render(<EntrySection value="0000000000+" onChange={onChange} />);

    const signKnob = container.querySelector('[title="CW"]');
    act(() => {
      signKnob?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('0000000000-');
  });

  it('keeps negative sign when changing digits', () => {
    const onChange = vi.fn();
    render(<EntrySection value="0000000000-" onChange={onChange} />);

    const incButtons = container.querySelectorAll('[title="INCREMENT"]');
    const firstDigitInc = incButtons[0];
    act(() => {
      firstDigitInc?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('1000000000-');
  });

  it('toggles sign knob back to positive', () => {
    const onChange = vi.fn();
    render(<EntrySection value="0000000000-" onChange={onChange} />);

    const signKnob = container.querySelector('[title="CW"]');
    act(() => {
      signKnob?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('0000000000+');
  });

  it('moves focus to the next digit knob when a number is typed', () => {
    const onChange = vi.fn();
    render(<EntrySection value="0000000000+" onChange={onChange} />);

    const firstKnob = container.querySelector('[data-testid="entry-digit-0"]') as HTMLDivElement;
    const secondKnob = container.querySelector('[data-testid="entry-digit-1"]') as HTMLDivElement;

    act(() => {
      firstKnob.focus();
      firstKnob.dispatchEvent(new KeyboardEvent('keydown', { key: '7', bubbles: true }));
    });

    expect(document.activeElement).toBe(secondKnob);
    expect(onChange).toHaveBeenCalledWith('7000000000+');
  });

  it('moves focus to the previous digit knob on Backspace without changing value', () => {
    const onChange = vi.fn();
    render(<EntrySection value="0000000000+" onChange={onChange} />);

    const firstKnob = container.querySelector('[data-testid="entry-digit-0"]') as HTMLDivElement;
    const secondKnob = container.querySelector('[data-testid="entry-digit-1"]') as HTMLDivElement;

    act(() => {
      secondKnob.focus();
      secondKnob.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    });

    expect(document.activeElement).toBe(firstKnob);
    expect(onChange).not.toHaveBeenCalled();
  });
});

/* @vitest-environment jsdom */
