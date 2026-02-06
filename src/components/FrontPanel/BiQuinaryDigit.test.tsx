import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import BiQuinaryDigit from './BiQuinaryDigit';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('BiQuinaryDigit', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('has role="img" with digit value in aria-label', () => {
    render(<BiQuinaryDigit value={7} />);
    const el = container.querySelector('[role="img"]');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('aria-label')).toBe('Digit: 7');
  });

  it('updates aria-label when value changes', () => {
    render(<BiQuinaryDigit value={0} />);
    const el = container.querySelector('[role="img"]');
    expect(el?.getAttribute('aria-label')).toBe('Digit: 0');

    render(<BiQuinaryDigit value={9} />);
    expect(el?.getAttribute('aria-label')).toBe('Digit: 9');
  });

  it('lights left column for digits 0-4', () => {
    render(<BiQuinaryDigit value={3} />);
    // The first Bulb (left column indicator) should be lit
    const bulbs = container.querySelectorAll('[role="img"]');
    // First child role="img" inside the container is the container itself, then bulbs
    // Container has role="img", inner bulbs also have role="img"
    const innerBulbs = Array.from(bulbs).filter(b => b.getAttribute('aria-label') !== 'Digit: 3');
    const leftBulb = innerBulbs[0];
    expect(leftBulb?.getAttribute('aria-label')).toBe('lit');
  });

  it('lights right column for digits 5-9', () => {
    render(<BiQuinaryDigit value={7} />);
    const bulbs = container.querySelectorAll('[role="img"]');
    const innerBulbs = Array.from(bulbs).filter(b => b.getAttribute('aria-label') !== 'Digit: 7');
    const leftBulb = innerBulbs[0];
    const rightBulb = innerBulbs[1];
    expect(leftBulb?.getAttribute('aria-label')).toBe('unlit');
    expect(rightBulb?.getAttribute('aria-label')).toBe('lit');
  });
});

/* @vitest-environment jsdom */
