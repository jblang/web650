import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import OperatingStatus, { OperatingState } from './OperatingStatus';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const allOff: OperatingState = {
  dataAddress: false,
  program: false,
  inputOutput: false,
  inquiry: false,
  ramac: false,
  magneticTape: false,
  instAddress: false,
  accumulator: false,
  overflow: false,
};

describe('OperatingStatus', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('has role="group" with aria-label "Operating status"', () => {
    render(<OperatingStatus state={allOff} />);
    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group?.getAttribute('aria-label')).toBe('Operating status');
  });

  it('passes label to Bulb components for screen readers', () => {
    render(<OperatingStatus state={{ ...allOff, program: true }} />);
    const programBulb = container.querySelector('[aria-label="PROGRAM: lit"]');
    expect(programBulb).not.toBeNull();
  });

  it('renders all 9 indicators with correct labels', () => {
    render(<OperatingStatus state={allOff} />);
    const expectedLabels = [
      'DATA ADDRESS', 'PROGRAM', 'INPUT-OUTPUT',
      'INQUIRY', 'RAMAC', 'MAGNETIC TAPE',
      'INST ADDRESS', 'ACCUMULATOR', 'OVERFLOW',
    ];
    for (const label of expectedLabels) {
      const bulb = container.querySelector(`[aria-label="${label}: unlit"]`);
      expect(bulb, `Expected bulb with label "${label}"`).not.toBeNull();
    }
  });

  it('reflects lit state in aria-label', () => {
    render(<OperatingStatus state={{ ...allOff, overflow: true, dataAddress: true }} />);
    expect(container.querySelector('[aria-label="OVERFLOW: lit"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="DATA ADDRESS: lit"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="PROGRAM: unlit"]')).not.toBeNull();
  });
});

/* @vitest-environment jsdom */
