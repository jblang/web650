import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';

// Mock DecimalKnob to a simple button that triggers onChange with its value+1
const knobSpy = vi.fn();
vi.mock('./DecimalKnob', () => ({
  __esModule: true,
  default: (props: { value: number; onChange?: (v: number) => void }) => {
    knobSpy(props.value);
    return (
      <button
        data-testid={`digit-${props.value}`}
        onClick={() => props.onChange?.(props.value + 1)}
      >
        {props.value}
      </button>
    );
  },
}));

import AddressSelection from './AddressSelection';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('AddressSelection', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    knobSpy.mockClear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('pads and slices value to four digits', () => {
    act(() => {
      root.render(<AddressSelection value={12} onChange={() => {}} />);
    });
    // Should render digits 0,0,1,2
    expect(knobSpy.mock.calls.map((c) => c[0])).toEqual([0, 0, 1, 2]);
  });

  it('propagates digit change with updated string', () => {
    const onChange = vi.fn();
    act(() => {
      root.render(<AddressSelection value="0012" onChange={onChange} />);
    });

    const secondDigit = container.querySelector('[data-testid="digit-0"]') as HTMLButtonElement;
    act(() => secondDigit.click());

    expect(onChange).toHaveBeenCalledWith('1012'); // second digit was 0, mocked click sends 1
  });
});

/* @vitest-environment jsdom */
