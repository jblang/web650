import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import BiQuinaryNumber from './BiQuinaryNumber';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockDigitIntensity = {
  left: 1,
  right: 0,
  rows: [1, 0, 0, 0, 0],
};

const mockUseDigitDecayMock = vi.hoisted(() => ({
  useDigitDecay: vi.fn(),
}));

const mockFormatMocks = vi.hoisted(() => ({
  normalizeAddress: vi.fn(),
}));

vi.mock('./useDigitDecay', () => mockUseDigitDecayMock);
vi.mock('@/lib/simh/i650/format', () => mockFormatMocks);

// Mock BiQuinaryDigit
vi.mock('./BiQuinaryDigit', () => ({
  default: ({ value, intensity }: Record<string, unknown>) => (
    <div
      data-testid="biquinary-digit"
      data-value={value}
      data-intensity={JSON.stringify(intensity)}
    >
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

    mockUseDigitDecayMock.useDigitDecay.mockReturnValue(
      Array(10).fill(mockDigitIntensity)
    );

    mockFormatMocks.normalizeAddress.mockImplementation((value: string | number) => {
      return String(value).padStart(4, '0');
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders with array input', () => {
    render(<BiQuinaryNumber value={[1, 2, 3, 4]} tick={0} digitCount={4} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(4);
    expect(digits[0].getAttribute('data-value')).toBe('1');
    expect(digits[1].getAttribute('data-value')).toBe('2');
    expect(digits[2].getAttribute('data-value')).toBe('3');
    expect(digits[3].getAttribute('data-value')).toBe('4');
  });

  it('renders with string input for 2 digits', () => {
    render(<BiQuinaryNumber value="42" tick={0} digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    expect(digits[0].getAttribute('data-value')).toBe('4');
    expect(digits[1].getAttribute('data-value')).toBe('2');
  });

  it('pads string input for 2 digits', () => {
    render(<BiQuinaryNumber value="5" tick={0} digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    expect(digits[0].getAttribute('data-value')).toBe('0');
    expect(digits[1].getAttribute('data-value')).toBe('5');
  });

  it('renders with number input for 4 digits', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<BiQuinaryNumber value={1234} tick={0} digitCount={4} />);

    expect(mockFormatMocks.normalizeAddress).toHaveBeenCalledWith(1234);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(4);
  });

  it('calls normalizeAddress for 4-digit string input', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('0042');

    render(<BiQuinaryNumber value="42" tick={0} digitCount={4} />);

    expect(mockFormatMocks.normalizeAddress).toHaveBeenCalledWith('42');
  });

  it('pads string input for 10 digits', () => {
    render(<BiQuinaryNumber value="123" tick={0} digitCount={10} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(10);
    expect(digits[0].getAttribute('data-value')).toBe('0');
    expect(digits[7].getAttribute('data-value')).toBe('1');
    expect(digits[8].getAttribute('data-value')).toBe('2');
    expect(digits[9].getAttribute('data-value')).toBe('3');
  });

  it('renders 10 digits for number input', () => {
    render(<BiQuinaryNumber value={9876543210} tick={0} digitCount={10} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(10);
    expect(digits[0].getAttribute('data-value')).toBe('9');
    expect(digits[9].getAttribute('data-value')).toBe('0');
  });

  it('renders title when provided', () => {
    render(<BiQuinaryNumber value={[1, 2]} tick={0} digitCount={2} title="TEST" />);

    const title = container.querySelector('.title');
    expect(title).not.toBeNull();
    expect(title?.textContent).toBe('TEST');
  });

  it('does not render title when not provided', () => {
    render(<BiQuinaryNumber value={[1, 2]} tick={0} digitCount={2} />);

    const title = container.querySelector('.title');
    expect(title).toBeNull();
  });

  it('uses custom testIdPrefix', () => {
    render(<BiQuinaryNumber value={[1, 2]} tick={0} digitCount={2} testIdPrefix="custom" />);

    const container_element = container.querySelector('[data-testid="custom-container"]');
    expect(container_element).not.toBeNull();
  });

  it('uses default testIdPrefix "digit"', () => {
    render(<BiQuinaryNumber value={[1, 2]} tick={0} digitCount={2} />);

    const container_element = container.querySelector('[data-testid="digit-container"]');
    expect(container_element).not.toBeNull();
  });

  it('applies custom className', () => {
    render(<BiQuinaryNumber value={[1, 2]} tick={0} digitCount={2} className="custom-class" />);

    const container_element = container.querySelector('.custom-class');
    expect(container_element).not.toBeNull();
  });

  it('uses default styles when className not provided', () => {
    render(<BiQuinaryNumber value={[1, 2]} tick={0} digitCount={2} />);

    const container_element = container.querySelector('[data-testid="digit-container"]');
    expect(container_element?.className).toContain('container');
  });

  it('calls useDigitDecay with digit string and tick', () => {
    render(<BiQuinaryNumber value={[4, 2]} tick={5} digitCount={2} />);

    expect(mockUseDigitDecayMock.useDigitDecay).toHaveBeenCalledWith('42', 5);
  });

  it('uses provided intensity instead of computed', () => {
    const providedIntensity = [
      { left: 0.5, right: 0.3, rows: [0.1, 0.2, 0.3, 0.4, 0.5] },
      { left: 0.7, right: 0.2, rows: [0.5, 0.4, 0.3, 0.2, 0.1] },
    ];

    render(
      <BiQuinaryNumber
        value={[1, 2]}
        tick={0}
        digitCount={2}
        intensity={providedIntensity}
      />
    );

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    const firstIntensity = JSON.parse(digits[0].getAttribute('data-intensity') || '{}');
    const secondIntensity = JSON.parse(digits[1].getAttribute('data-intensity') || '{}');

    expect(firstIntensity.left).toBe(0.5);
    expect(secondIntensity.left).toBe(0.7);
  });

  it('handles zero values correctly', () => {
    render(<BiQuinaryNumber value={0} tick={0} digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    expect(digits[0].getAttribute('data-value')).toBe('0');
    expect(digits[1].getAttribute('data-value')).toBe('0');
  });

  it('handles all zeros in array', () => {
    render(<BiQuinaryNumber value={[0, 0, 0, 0]} tick={0} digitCount={4} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(4);
    digits.forEach((digit) => {
      expect(digit.getAttribute('data-value')).toBe('0');
    });
  });

  it('handles all nines in array', () => {
    render(<BiQuinaryNumber value={[9, 9]} tick={0} digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(2);
    digits.forEach((digit) => {
      expect(digit.getAttribute('data-value')).toBe('9');
    });
  });

  it('renders correct number of cells for each digit', () => {
    render(<BiQuinaryNumber value={[1, 2, 3]} tick={0} digitCount={4} />);

    // Should render 3 digits (from array) even though digitCount is 4
    // because array input takes precedence
    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    expect(digits.length).toBe(3);
  });

  it('passes intensity to each BiQuinaryDigit', () => {
    const intensities = [
      { left: 1, right: 0, rows: [1, 0, 0, 0, 0] },
      { left: 0, right: 1, rows: [0, 1, 0, 0, 0] },
    ];

    mockUseDigitDecayMock.useDigitDecay.mockReturnValue(intensities);

    render(<BiQuinaryNumber value={[5, 6]} tick={0} digitCount={2} />);

    const digits = container.querySelectorAll('[data-testid="biquinary-digit"]');
    const firstIntensity = JSON.parse(digits[0].getAttribute('data-intensity') || '{}');
    const secondIntensity = JSON.parse(digits[1].getAttribute('data-intensity') || '{}');

    expect(firstIntensity).toEqual(intensities[0]);
    expect(secondIntensity).toEqual(intensities[1]);
  });
});

/* @vitest-environment jsdom */
