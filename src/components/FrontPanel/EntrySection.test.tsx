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

    const inc = container.querySelector('[title="Click to rotate clockwise"]');
    act(() => {
      inc?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('1000000000+');
  });

  it('toggles sign knob to negative', () => {
    const onChange = vi.fn();
    render(<EntrySection value="0000000000+" onChange={onChange} />);

    const cwKnobs = container.querySelectorAll('[title="Click to rotate clockwise"]');
    const signKnob = cwKnobs[cwKnobs.length - 1];
    act(() => {
      signKnob?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('0000000000-');
  });
});

/* @vitest-environment jsdom */
