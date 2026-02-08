import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import AddressDisplay from './AddressDisplay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockFormatMocks = vi.hoisted(() => ({
  normalizeAddress: vi.fn(),
}));

vi.mock('@/lib/simh/i650/format', () => mockFormatMocks);

// Mock BiQuinaryNumber
vi.mock('./BiQuinaryNumber', () => ({
  default: ({
    value,
    tick,
    digitCount,
    title,
    testIdPrefix,
    className,
  }: {
    value: string | number;
    tick: number;
    digitCount: number;
    title?: string;
    testIdPrefix?: string;
    className?: string;
  }) => (
    <div
      data-testid="biquinary-number"
      data-value={value}
      data-tick={tick}
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

describe('AddressDisplay', () => {
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

  it('renders with data-testid', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<AddressDisplay value="1234" tick={0} />);

    const display = container.querySelector('[data-testid="address-display"]');
    expect(display).not.toBeNull();
  });

  it('calls normalizeAddress with string value', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('0042');

    render(<AddressDisplay value="42" tick={0} />);

    expect(mockFormatMocks.normalizeAddress).toHaveBeenCalledWith('42');
  });

  it('calls normalizeAddress with number value', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<AddressDisplay value={1234} tick={0} />);

    expect(mockFormatMocks.normalizeAddress).toHaveBeenCalledWith(1234);
  });

  it('passes normalized value to BiQuinaryNumber', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('0099');

    render(<AddressDisplay value={99} tick={0} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-value')).toBe('0099');
  });

  it('passes tick prop to BiQuinaryNumber', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<AddressDisplay value="1234" tick={42} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-tick')).toBe('42');
  });

  it('passes digitCount 4 to BiQuinaryNumber', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<AddressDisplay value="1234" tick={0} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-digit-count')).toBe('4');
  });

  it('passes title "ADDRESS" to BiQuinaryNumber', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<AddressDisplay value="1234" tick={0} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-title')).toBe('ADDRESS');
  });

  it('passes testIdPrefix "addr" to BiQuinaryNumber', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<AddressDisplay value="1234" tick={0} />);

    const biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-test-id-prefix')).toBe('addr');
  });

  it('sets data-address-value attribute with normalized value', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('0042');

    render(<AddressDisplay value={42} tick={0} />);

    const display = container.querySelector('[data-testid="address-display"]');
    expect(display?.getAttribute('data-address-value')).toBe('0042');
  });

  it('handles zero value', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('0000');

    render(<AddressDisplay value={0} tick={0} />);

    expect(mockFormatMocks.normalizeAddress).toHaveBeenCalledWith(0);

    const display = container.querySelector('[data-testid="address-display"]');
    expect(display?.getAttribute('data-address-value')).toBe('0000');
  });

  it('handles maximum 4-digit value', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('9999');

    render(<AddressDisplay value={9999} tick={0} />);

    const display = container.querySelector('[data-testid="address-display"]');
    expect(display?.getAttribute('data-address-value')).toBe('9999');
  });

  it('updates when value changes', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('0001');

    render(<AddressDisplay value={1} tick={0} />);

    let display = container.querySelector('[data-testid="address-display"]');
    expect(display?.getAttribute('data-address-value')).toBe('0001');

    // Update value
    mockFormatMocks.normalizeAddress.mockReturnValue('0002');
    render(<AddressDisplay value={2} tick={0} />);

    display = container.querySelector('[data-testid="address-display"]');
    expect(display?.getAttribute('data-address-value')).toBe('0002');
  });

  it('updates when tick changes', () => {
    mockFormatMocks.normalizeAddress.mockReturnValue('1234');

    render(<AddressDisplay value="1234" tick={0} />);

    let biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-tick')).toBe('0');

    // Update tick
    render(<AddressDisplay value="1234" tick={5} />);

    biquinary = container.querySelector('[data-testid="biquinary-number"]');
    expect(biquinary?.getAttribute('data-tick')).toBe('5');
  });
});

/* @vitest-environment jsdom */
