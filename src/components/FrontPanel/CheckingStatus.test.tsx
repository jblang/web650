import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import CheckingStatus, { CheckingState } from './CheckingStatus';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const allOff: CheckingState = {
  programRegister: false,
  controlUnit: false,
  storageSelection: false,
  storageUnit: false,
  distributor: false,
  clocking: false,
  accumulator: false,
  errorSense: false,
};

describe('CheckingStatus', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('has role="group" with aria-label "Checking status"', () => {
    render(<CheckingStatus state={allOff} />);
    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group?.getAttribute('aria-label')).toBe('Checking status');
  });

  it('passes label to Bulb components for screen readers', () => {
    render(<CheckingStatus state={{ ...allOff, clocking: true }} />);
    expect(container.querySelector('[aria-label="CLOCKING: lit"]')).not.toBeNull();
  });

  it('renders all 8 indicators with correct labels', () => {
    render(<CheckingStatus state={allOff} />);
    const expectedLabels = [
      'PROGRAM REGISTER', 'CONTROL UNIT',
      'STORAGE SELECTION', 'STORAGE UNIT',
      'DISTRIBUTOR', 'CLOCKING',
      'ACCUMULATOR', 'ERROR SENSE',
    ];
    for (const label of expectedLabels) {
      const bulb = container.querySelector(`[aria-label="${label}: unlit"]`);
      expect(bulb, `Expected bulb with label "${label}"`).not.toBeNull();
    }
  });
});

/* @vitest-environment jsdom */
