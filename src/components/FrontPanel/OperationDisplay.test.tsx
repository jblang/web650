import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import OperationDisplay from './OperationDisplay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

// Mock BiQuinaryNumber
vi.mock('./BiQuinaryNumber', () => ({
  default: ({
    value,
    digitCount,
    title,
    testIdPrefix,
    className,
  }: {
    value: string | number;
    digitCount: number;
    title?: string;
    testIdPrefix?: string;
    className?: string;
  }) => (
    <div
      data-testid="biquinary-number"
      data-value={value}
      data-digit-count={digitCount}
      data-title={title}
      data-test-id-prefix={testIdPrefix}
      data-class-name={className}
    >
      BiQuinaryNumber: {value}
    </div>
  ),
}));

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('OperationDisplay', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders with data-testid', () => {
    render(<OperationDisplay value="42" />);

    const display = container.querySelector('[data-testid="operation-display"]');
    expect(display).not.toBeNull();
  });

  it('passes string value to BiQuinaryNumber', () => {
    render(<OperationDisplay value="69" />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('69');
  });

  it('passes number value to BiQuinaryNumber', () => {
    render(<OperationDisplay value={42} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('42');
  });

  it('passes digitCount 2 to BiQuinaryNumber', () => {
    render(<OperationDisplay value="69" />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-digit-count')).toBe('2');
  });

  it('passes title "OPERATION" to BiQuinaryNumber', () => {
    render(<OperationDisplay value="69" />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-title')).toBe('OPERATION');
  });

  it('passes testIdPrefix "operation-digit" to BiQuinaryNumber', () => {
    render(<OperationDisplay value="69" />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-test-id-prefix')).toBe('operation-digit');
  });

  it('handles zero value', () => {
    render(<OperationDisplay value={0} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('0');
  });

  it('handles single digit value', () => {
    render(<OperationDisplay value={5} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('5');
  });

  it('handles two digit value', () => {
    render(<OperationDisplay value={99} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('99');
  });

  it('updates when value changes', () => {
    render(<OperationDisplay value={10} />);

    let biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('10');

    // Update value
    render(<OperationDisplay value={20} />);

    biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('20');
  });

});

/* @vitest-environment jsdom */
