import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import BiQuinaryNumber from './BiQuinaryNumber';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockFormatMocks = vi.hoisted(() => ({
  normalizeAddress: vi.fn(),
}));

vi.mock('@/lib/simh/i650/format', () => mockFormatMocks);

// Mock BiQuinaryDigit
vi.mock('./BiQuinaryDigit', () => ({
  default: ({ value }: { value: number }) => (
    <div data-testid="biquinary-digit" data-value={value}>
      Digit: {value}
    </div>
  ),
}));

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('BiQuinaryNumber', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();

    mockFormatMocks.normalizeAddress.mockImplementation((value: string | number) => {
      return String(value).padStart(4, '0');
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders with array input', () => {
    render(<BiQuinaryNumber value={[1, 2, 3, 4]} digitCount={4} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(4);
    expect(digits[0].getAttribute('data-value')).toBe('1');
    expect(digits[1].getAttribute('data-value')).toBe('2');
    expect(digits[2].getAttribute('data-value')).toBe('3');
    expect(digits[3].getAttribute('data-value')).toBe('4');
  });

  it('renders with string input for 2 digits', () => {
    render(<BiQuinaryNumber value="42" digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    expect(digits[0].getAttribute('data-value')).toBe('4');
    expect(digits[1].getAttribute('data-value')).toBe('2');
  });

  it('pads string input for 2 digits', () => {
    render(<BiQuinaryNumber value="5" digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    expect(digits[0].getAttribute('data-value')).toBe('0');
    expect(digits[1].getAttribute('data-value')).toBe('5');
  });

  it('renders with number input for 4 digits', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<BiQuinaryNumber value={1234} digitCount={4} />);

    expect(mockFormatMocks.normalizeAddress).toHaveBeenCalledWith(1234);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(4);
  });

  it('calls normalizeAddress for 4-digit string input', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('0042');

    render(<BiQuinaryNumber value="42" digitCount={4} />);

    expect(mockFormatMocks.normalizeAddress).toHaveBeenCalledWith('42');
  });

  it('pads string input for 10 digits', () => {
    render(<BiQuinaryNumber value="123" digitCount={10} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(10);
    expect(digits[0].getAttribute('data-value')).toBe('0');
    expect(digits[7].getAttribute('data-value')).toBe('1');
    expect(digits[8].getAttribute('data-value')).toBe('2');
    expect(digits[9].getAttribute('data-value')).toBe('3');
  });

  it('renders 10 digits for number input', () => {
    render(<BiQuinaryNumber value={9876543210} digitCount={10} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(10);
    expect(digits[0].getAttribute('data-value')).toBe('9');
    expect(digits[9].getAttribute('data-value')).toBe('0');
  });

  it('renders title when provided', () => {
    render(<BiQuinaryNumber value={[1, 2]} digitCount={2} title="TEST" />);

    const title = container.querySelector('[data-testid="digit-container"] .title, [data-testid="digit-container"] [class*="title"]');
    expect(title).not.toBeNull();
    expect(title?.textContent).toBe('TEST');
  });

  it('does not render title when not provided', () => {
    render(<BiQuinaryNumber value={[1, 2]} digitCount={2} />);

    const title = container.querySelector('[data-testid="digit-container"] .title, [data-testid="digit-container"] [class*="title"]');
    expect(title).toBeNull();
  });

  it('uses custom testIdPrefix', () => {
    render(<BiQuinaryNumber value={[1, 2]} digitCount={2} testIdPrefix="custom" />);

    const container_element = container.querySelector('[data-testid="custom-container"]');
    expect(container_element).not.toBeNull();
  });

  it('uses default testIdPrefix "digit"', () => {
    render(<BiQuinaryNumber value={[1, 2]} digitCount={2} />);

    const container_element = container.querySelector('[data-testid="digit-container"]');
    expect(container_element).not.toBeNull();
  });

  it('handles zero values correctly', () => {
    render(<BiQuinaryNumber value={0} digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    expect(digits[0].getAttribute('data-value')).toBe('0');
    expect(digits[1].getAttribute('data-value')).toBe('0');
  });

  it('handles all zeros in array', () => {
    render(<BiQuinaryNumber value={[0, 0, 0, 0]} digitCount={4} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(4);
    digits.forEach((digit) => {
      expect(digit.getAttribute('data-value')).toBe('0');
    });
  });

  it('handles all nines in array', () => {
    render(<BiQuinaryNumber value={[9, 9]} digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    digits.forEach((digit) => {
      expect(digit.getAttribute('data-value')).toBe('9');
    });
  });

  it('renders correct number of cells for each digit', () => {
    render(<BiQuinaryNumber value={[1, 2, 3]} digitCount={4} />);

    // Should render 3 digits (from array) even though digitCount is 4
    // because array input takes precedence
    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(3);
  });

});

/* @vitest-environment jsdom */
