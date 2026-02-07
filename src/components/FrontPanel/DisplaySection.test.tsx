import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import DisplaySection from './DisplaySection';
import type { DisplayIntensity } from './useDisplayDecay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockDisplayIntensity: DisplayIntensity = {
  digits: [
    { left: 1, right: 0, rows: [1, 0, 0, 0, 0] },
    { left: 1, right: 0, rows: [0, 1, 0, 0, 0] },
    { left: 1, right: 0, rows: [0, 0, 1, 0, 0] },
    { left: 1, right: 0, rows: [0, 0, 0, 1, 0] },
    { left: 0, right: 1, rows: [0, 0, 0, 0, 1] },
    { left: 0, right: 1, rows: [1, 0, 0, 0, 0] },
    { left: 0, right: 1, rows: [0, 1, 0, 0, 0] },
    { left: 0, right: 1, rows: [0, 0, 1, 0, 0] },
    { left: 0, right: 1, rows: [0, 0, 0, 1, 0] },
    { left: 1, right: 0, rows: [0, 0, 0, 0, 1] },
  ],
  sign: { plus: 1, minus: 0 },
};

const mockDisplayDecayMock = vi.hoisted(() => ({
  useDisplayDecay: vi.fn(),
}));

const mockFormatMocks = vi.hoisted(() => ({
  normalizeWord: vi.fn(),
}));

vi.mock('./useDisplayDecay', () => mockDisplayDecayMock);
vi.mock('@/lib/simh/i650/format', () => mockFormatMocks);

// Mock child components to simplify testing
vi.mock('./BiQuinaryNumber', () => ({
  default: ({ value, tick, digitCount, intensity, testIdPrefix, className }: Record<string, unknown>) => (
    <div
      data-testid={`biquinary-${testIdPrefix}`}
      data-value={JSON.stringify(value)}
      data-tick={tick}
      data-digit-count={digitCount}
      data-intensity={JSON.stringify(intensity)}
      className={className}
    >
      BiQuinary: {value.join(',')}
    </div>
  ),
}));

vi.mock('./SignDisplay', () => ({
  default: ({ value, intensity }: Record<string, unknown>) => (
    <div data-testid="sign-display" data-value={value} data-intensity={JSON.stringify(intensity)}>
      Sign: {value}
    </div>
  ),
}));

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('DisplaySection', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();

    mockDisplayDecayMock.useDisplayDecay.mockReturnValue(mockDisplayIntensity);
    mockFormatMocks.normalizeWord.mockImplementation((value: string | number) => {
      if (typeof value === 'number') {
        return String(value).padStart(10, '0') + '+';
      }
      return value;
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('calls normalizeWord with value prop', () => {
    render(<DisplaySection value="1234567890+" tick={0} />);

    expect(mockFormatMocks.normalizeWord).toHaveBeenCalledWith('1234567890+');
  });

  it('calls normalizeWord with numeric value', () => {
    render(<DisplaySection value={123} tick={0} />);

    expect(mockFormatMocks.normalizeWord).toHaveBeenCalledWith(123);
  });

  it('calls useDisplayDecay with normalized value and tick', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('9876543210+');

    render(<DisplaySection value="9876543210+" tick={5} />);

    expect(mockDisplayDecayMock.useDisplayDecay).toHaveBeenCalledWith('9876543210+', 5);
  });

  it('renders with data-display-value attribute', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" tick={0} />);

    const section = container.querySelector('[data-testid="display-section"]');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('data-display-value')).toBe('1234567890+');
  });

  it('extracts sign from position 10', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890-');

    render(<DisplaySection value="1234567890-" tick={0} />);

    const signDisplay = container.querySelector('[data-testid="sign-display"]');
    expect(signDisplay?.getAttribute('data-value')).toBe('-');
  });

  it('passes sign intensity to SignDisplay', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');
    const customIntensity = { ...mockDisplayIntensity, sign: { plus: 0.5, minus: 0.1 } };
    mockDisplayDecayMock.useDisplayDecay.mockReturnValue(customIntensity);

    render(<DisplaySection value="1234567890+" tick={0} />);

    const signDisplay = container.querySelector('[data-testid="sign-display"]');
    const intensity = JSON.parse(signDisplay?.getAttribute('data-intensity') || '{}');
    expect(intensity).toEqual({ plus: 0.5, minus: 0.1 });
  });

  it('slices digits 0-2 for first BiQuinaryNumber', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" tick={0} />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const firstGroup = biquinaries[0];
    const value = JSON.parse(firstGroup.getAttribute('data-value') || '[]');
    expect(value).toEqual([1, 2]);
    expect(firstGroup.getAttribute('data-digit-count')).toBe('2');
  });

  it('slices digits 2-6 for second BiQuinaryNumber', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" tick={0} />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const secondGroup = biquinaries[1];
    const value = JSON.parse(secondGroup.getAttribute('data-value') || '[]');
    expect(value).toEqual([3, 4, 5, 6]);
    expect(secondGroup.getAttribute('data-digit-count')).toBe('4');
  });

  it('slices digits 6-10 for third BiQuinaryNumber', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" tick={0} />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const thirdGroup = biquinaries[2];
    const value = JSON.parse(thirdGroup.getAttribute('data-value') || '[]');
    expect(value).toEqual([7, 8, 9, 0]);
    expect(thirdGroup.getAttribute('data-digit-count')).toBe('4');
  });

  it('passes correct intensity slices to BiQuinaryNumbers', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" tick={0} />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');

    // First group: intensity[0:2]
    const firstIntensity = JSON.parse(biquinaries[0].getAttribute('data-intensity') || '[]');
    expect(firstIntensity).toEqual(mockDisplayIntensity.digits.slice(0, 2));

    // Second group: intensity[2:6]
    const secondIntensity = JSON.parse(biquinaries[1].getAttribute('data-intensity') || '[]');
    expect(secondIntensity).toEqual(mockDisplayIntensity.digits.slice(2, 6));

    // Third group: intensity[6:10]
    const thirdIntensity = JSON.parse(biquinaries[2].getAttribute('data-intensity') || '[]');
    expect(thirdIntensity).toEqual(mockDisplayIntensity.digits.slice(6, 10));
  });

  it('passes tick prop to all BiQuinaryNumbers', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" tick={42} />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    biquinaries.forEach((biquinary) => {
      expect(biquinary.getAttribute('data-tick')).toBe('42');
    });
  });

  it('passes testIdPrefix "display" to all BiQuinaryNumbers', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" tick={0} />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    expect(biquinaries.length).toBe(3);
  });

  it('handles negative sign correctly', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('0000000001-');

    render(<DisplaySection value="0000000001-" tick={0} />);

    const signDisplay = container.querySelector('[data-testid="sign-display"]');
    expect(signDisplay?.getAttribute('data-value')).toBe('-');
  });

  it('handles all zeros with positive sign', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('0000000000+');

    render(<DisplaySection value="0000000000+" tick={0} />);

    const signDisplay = container.querySelector('[data-testid="sign-display"]');
    expect(signDisplay?.getAttribute('data-value')).toBe('+');

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const firstValue = JSON.parse(biquinaries[0].getAttribute('data-value') || '[]');
    const secondValue = JSON.parse(biquinaries[1].getAttribute('data-value') || '[]');
    const thirdValue = JSON.parse(biquinaries[2].getAttribute('data-value') || '[]');

    expect(firstValue).toEqual([0, 0]);
    expect(secondValue).toEqual([0, 0, 0, 0]);
    expect(thirdValue).toEqual([0, 0, 0, 0]);
  });
});

/* @vitest-environment jsdom */
