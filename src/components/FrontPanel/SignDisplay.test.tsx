import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import SignDisplay from './SignDisplay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('SignDisplay', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('has role="img" with "plus" in aria-label for positive sign', () => {
    render(<SignDisplay value="+" />);
    const el = container.querySelector('[role="img"][aria-label]');
    expect(el?.getAttribute('aria-label')).toBe('Sign: plus');
  });

  it('has role="img" with "minus" in aria-label for negative sign', () => {
    render(<SignDisplay value="-" />);
    const el = container.querySelector('[role="img"][aria-label]');
    expect(el?.getAttribute('aria-label')).toBe('Sign: minus');
  });
});

/* @vitest-environment jsdom */
