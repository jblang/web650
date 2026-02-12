import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import Bulb from './Bulb';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('Bulb', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('has role="img" on the outer span', () => {
    render(<Bulb lit={false} />);
    const bulb = container.querySelector('[role="img"]');
    expect(bulb).not.toBeNull();
  });

  it('shows "lit" aria-label when lit is true', () => {
    render(<Bulb lit={true} />);
    const bulb = container.querySelector('[role="img"]');
    expect(bulb?.getAttribute('aria-label')).toBe('lit');
  });

  it('shows "unlit" aria-label when lit is false', () => {
    render(<Bulb lit={false} />);
    const bulb = container.querySelector('[role="img"]');
    expect(bulb?.getAttribute('aria-label')).toBe('unlit');
  });

  it('includes label in aria-label when provided', () => {
    render(<Bulb lit={true} label="OVERFLOW" />);
    const bulb = container.querySelector('[role="img"]');
    expect(bulb?.getAttribute('aria-label')).toBe('OVERFLOW: lit');
  });

  it('includes label with unlit state', () => {
    render(<Bulb lit={false} label="PROGRAM" />);
    const bulb = container.querySelector('[role="img"]');
    expect(bulb?.getAttribute('aria-label')).toBe('PROGRAM: unlit');
  });
});

/* @vitest-environment jsdom */
