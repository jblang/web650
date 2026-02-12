import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import DisplaySection from './DisplaySection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockFormatMocks = vi.hoisted(() => ({
  normalizeWord: vi.fn(),
  extractSign: vi.fn(),
  extractOperationCode: vi.fn(),
  extractDataAddress: vi.fn(),
  extractInstructionAddress: vi.fn(),
}));

vi.mock('@/lib/simh/i650/format', () => mockFormatMocks);

// Mock child components to simplify testing
vi.mock('./BiQuinaryNumber', () => ({
  default: ({
    value,
    digitCount,
    testIdPrefix,
    className,
  }: {
    value: string | number | number[];
    digitCount: number;
    testIdPrefix: string;
    className?: string;
  }) => (
    <div
      data-testid={`biquinary-${testIdPrefix}`}
      data-value={JSON.stringify(value)}
      data-digit-count={digitCount}
      className={className}
    >
      BiQuinary: {Array.isArray(value) ? value.join(',') : String(value)}
    </div>
  ),
}));

vi.mock('./SignDisplay', () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="sign-display" data-value={value}>
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

    mockFormatMocks.normalizeWord.mockImplementation((value: string | number) => {
      if (typeof value === 'number') {
        return String(value).padStart(10, '0') + '+';
      }
      return value;
    });
    mockFormatMocks.extractSign.mockImplementation((value: string | number) => {
      const normalized = mockFormatMocks.normalizeWord(value);
      return normalized.endsWith('-') ? '-' : '+';
    });
    mockFormatMocks.extractOperationCode.mockImplementation((value: string | number) => {
      const normalized = mockFormatMocks.normalizeWord(value);
      return normalized.slice(0, 2);
    });
    mockFormatMocks.extractDataAddress.mockImplementation((value: string | number) => {
      const normalized = mockFormatMocks.normalizeWord(value);
      return normalized.slice(2, 6);
    });
    mockFormatMocks.extractInstructionAddress.mockImplementation((value: string | number) => {
      const normalized = mockFormatMocks.normalizeWord(value);
      return normalized.slice(6, 10);
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('calls normalizeWord with value prop', () => {
    render(<DisplaySection value="1234567890+" />);

    expect(mockFormatMocks.normalizeWord).toHaveBeenCalledWith('1234567890+');
  });

  it('calls normalizeWord with numeric value', () => {
    render(<DisplaySection value={123} />);

    expect(mockFormatMocks.normalizeWord).toHaveBeenCalledWith(123);
  });

  it('renders with data-display-value attribute', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" />);

    const section = container.querySelector('[data-testid="display-section"]');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('data-display-value')).toBe('1234567890+');
  });

  it('extracts sign from position 10', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890-');

    render(<DisplaySection value="1234567890-" />);

    const signDisplay = container.querySelector('[data-testid="sign-display"]');
    expect(signDisplay?.getAttribute('data-value')).toBe('-');
  });

  it('slices digits 0-2 for first BiQuinaryNumber', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const firstGroup = biquinaries[0];
    const value = JSON.parse(firstGroup.getAttribute('data-value') || '""');
    expect(value).toBe('12');
    expect(firstGroup.getAttribute('data-digit-count')).toBe('2');
  });

  it('slices digits 2-6 for second BiQuinaryNumber', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const secondGroup = biquinaries[1];
    const value = JSON.parse(secondGroup.getAttribute('data-value') || '""');
    expect(value).toBe('3456');
    expect(secondGroup.getAttribute('data-digit-count')).toBe('4');
  });

  it('slices digits 6-10 for third BiQuinaryNumber', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const thirdGroup = biquinaries[2];
    const value = JSON.parse(thirdGroup.getAttribute('data-value') || '""');
    expect(value).toBe('7890');
    expect(thirdGroup.getAttribute('data-digit-count')).toBe('4');
  });

  it('passes testIdPrefix "display" to all BiQuinaryNumbers', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('1234567890+');

    render(<DisplaySection value="1234567890+" />);

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    expect(biquinaries.length).toBe(3);
  });

  it('handles negative sign correctly', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('0000000001-');

    render(<DisplaySection value="0000000001-" />);

    const signDisplay = container.querySelector('[data-testid="sign-display"]');
    expect(signDisplay?.getAttribute('data-value')).toBe('-');
  });

  it('handles all zeros with positive sign', () => {
    mockFormatMocks.normalizeWord.mockReturnValue('0000000000+');

    render(<DisplaySection value="0000000000+" />);

    const signDisplay = container.querySelector('[data-testid="sign-display"]');
    expect(signDisplay?.getAttribute('data-value')).toBe('+');

    const biquinaries = container.querySelectorAll('[data-testid="biquinary-display"]');
    const firstValue = JSON.parse(biquinaries[0].getAttribute('data-value') || '""');
    const secondValue = JSON.parse(biquinaries[1].getAttribute('data-value') || '""');
    const thirdValue = JSON.parse(biquinaries[2].getAttribute('data-value') || '""');

    expect(firstValue).toBe('00');
    expect(secondValue).toBe('0000');
    expect(thirdValue).toBe('0000');
  });
});

/* @vitest-environment jsdom */
