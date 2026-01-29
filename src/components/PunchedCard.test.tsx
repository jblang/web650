import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import PunchedCard from './PunchedCard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('PunchedCard', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders 80 columns and uppercases printed text', () => {
    render(<PunchedCard text="Abc" />);
    const columns = container.querySelectorAll('[data-testid^="card-column-"]');
    expect(columns.length).toBe(80);

    const first = container.querySelector('[data-testid="printed-char-0"]');
    const second = container.querySelector('[data-testid="printed-char-1"]');
    const third = container.querySelector('[data-testid="printed-char-2"]');
    const last = container.querySelector('[data-testid="printed-char-79"]');

    expect(first?.textContent).toBe('A');
    expect(second?.textContent).toBe('B');
    expect(third?.textContent).toBe('C');
    expect(last?.textContent).toBe(''); // padded space
  });

  it('punches correct rows for encoded characters', () => {
    render(<PunchedCard text="A0" />);

    const col1Row12 = container.querySelector('[data-col-index="1"][data-row-value="12"]') as HTMLElement | null;
    const col1Row1 = container.querySelector('[data-col-index="1"][data-row-value="1"]') as HTMLElement | null;
    const col1Row2 = container.querySelector('[data-col-index="1"][data-row-value="2"]') as HTMLElement | null;

    expect(col1Row12).not.toBeNull();
    expect(col1Row1).not.toBeNull();
    expect(col1Row2).not.toBeNull();

    const color12 = getComputedStyle(col1Row12!.firstElementChild as HTMLElement).backgroundColor;
    const color1 = getComputedStyle(col1Row1!.firstElementChild as HTMLElement).backgroundColor;
    const color2 = getComputedStyle(col1Row2!.firstElementChild as HTMLElement).backgroundColor;

    expect(color12).toBe('rgb(0, 34, 68)'); // punched
    expect(color1).toBe('rgb(0, 34, 68)');  // punched
    expect(color2).toBe('rgba(0, 0, 0, 0)');     // not punched

    const col2Row0 = container.querySelector('[data-col-index="2"][data-row-value="0"]') as HTMLElement | null;
    expect(col2Row0).not.toBeNull();
    const color0 = getComputedStyle(col2Row0!.firstElementChild as HTMLElement).backgroundColor;
    expect(color0).toBe('rgb(0, 34, 68)'); // digit 0 punches row 0
  });

  it('truncates text longer than 80 columns', () => {
    const long = 'X'.repeat(90);
    render(<PunchedCard text={long} />);
    const columns = container.querySelectorAll('[data-testid^="card-column-"]');
    expect(columns.length).toBe(80);
  });
});

/* @vitest-environment jsdom */
