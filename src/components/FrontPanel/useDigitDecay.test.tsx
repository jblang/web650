import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { useDigitDecay, type DigitIntensity } from './useDigitDecay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let rafCallbacks: Map<number, FrameRequestCallback>;
let rafId: number;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const triggerRAF = (timestamp: number) => {
  const callback = rafCallbacks.get(1);
  if (callback) {
    act(() => {
      callback(timestamp);
    });
  }
};

describe('useDigitDecay', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Mock RAF
    rafCallbacks = new Map();
    rafId = 0;
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
      rafId++;
      rafCallbacks.set(rafId, cb);
      return rafId;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
      rafCallbacks.delete(id);
    }));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('returns array matching digits length', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('1234', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity).toHaveLength(4);
    expect(captured.intensity?.[0]).toHaveProperty('left');
    expect(captured.intensity?.[0]).toHaveProperty('right');
    expect(captured.intensity?.[0]).toHaveProperty('rows');
  });

  it('returns empty array for empty string', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity).toHaveLength(0);
  });

  it('returns single element for single digit', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('5', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity).toHaveLength(1);
  });

  it('lights left bulb and row for digits 0-4', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('2', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity?.[0].left).toBe(1);
    expect(captured.intensity?.[0].right).toBe(0);
    expect(captured.intensity?.[0].rows[2]).toBe(1);
  });

  it('lights right bulb and row for digits 5-9', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('8', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Digit 8: right bulb + row[3] (8 % 5 = 3)
    expect(captured.intensity?.[0].left).toBe(0);
    expect(captured.intensity?.[0].right).toBe(1);
    expect(captured.intensity?.[0].rows[3]).toBe(1);
  });

  it('handles multiple digits correctly', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('159', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Digit 1: left + row[1]
    expect(captured.intensity?.[0].left).toBe(1);
    expect(captured.intensity?.[0].rows[1]).toBe(1);

    // Digit 5: right + row[0]
    expect(captured.intensity?.[1].right).toBe(1);
    expect(captured.intensity?.[1].rows[0]).toBe(1);

    // Digit 9: right + row[4]
    expect(captured.intensity?.[2].right).toBe(1);
    expect(captured.intensity?.[2].rows[4]).toBe(1);
  });

  it('resizes arrays when digit count increases', () => {
    const captured: { intensity?: DigitIntensity[] } = {};
    const setDigitsRef = { current: undefined as ((d: string) => void) | undefined };

    const Probe = () => {
      const [digits, setDigitsState] = React.useState('12');
      React.useEffect(() => {
        setDigitsRef.current = setDigitsState;
      }, [setDigitsState]);
      const intensity = useDigitDecay(digits, 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity).toHaveLength(2);

    // Increase length
    act(() => setDigitsRef.current?.('12345'));

    expect(captured.intensity).toHaveLength(5);
  });

  it('resizes arrays when digit count decreases', () => {
    const captured: { intensity?: DigitIntensity[] } = {};
    const setDigitsRef = { current: undefined as ((d: string) => void) | undefined };

    const Probe = () => {
      const [digits, setDigitsState] = React.useState('12345');
      React.useEffect(() => {
        setDigitsRef.current = setDigitsState;
      }, [setDigitsState]);
      const intensity = useDigitDecay(digits, 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity).toHaveLength(5);

    // Decrease length
    act(() => setDigitsRef.current?.('12'));

    expect(captured.intensity).toHaveLength(2);
  });

  it('applies exponential decay to unlit bulbs', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('0', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // First frame
    triggerRAF(1000);

    const initialRight = captured.intensity?.[0].right ?? 0;
    expect(initialRight).toBe(0); // Unlit

    // Second frame - stays at 0 since it started at 0
    triggerRAF(1050);

    const afterDecay = captured.intensity?.[0].right ?? 0;
    expect(afterDecay).toBe(0);
  });

  it('preserves intensity of lit bulbs during decay', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('0', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    const initialLeft = captured.intensity?.[0].left ?? 0;
    expect(initialLeft).toBe(1); // Lit

    // Trigger decay frames
    triggerRAF(1000);
    triggerRAF(1050);

    const afterDecay = captured.intensity?.[0].left ?? 0;

    // Lit bulb stays at 1
    expect(afterDecay).toBe(1);
  });

  it('updates intensity when tick changes', () => {
    const captured: { intensity?: DigitIntensity[] } = {};
    const setTickRef = { current: undefined as ((t: number) => void) | undefined };

    const Probe = () => {
      const [tick, setTickState] = React.useState(0);
      React.useEffect(() => {
        setTickRef.current = setTickState;
      }, [setTickState]);
      const intensity = useDigitDecay('0', tick);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    const initialIntensity = captured.intensity;

    // Change tick
    act(() => setTickRef.current?.(1));

    const afterTick = captured.intensity;

    // Should trigger re-evaluation
    expect(afterTick).not.toBe(initialIntensity);
  });

  it('cancels animation frame on unmount', () => {
    const Probe = () => {
      useDigitDecay('123', 0);
      return null;
    };

    render(<Probe />);

    const cancelSpy = vi.mocked(globalThis.cancelAnimationFrame);

    act(() => root.unmount());

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('handles first frame with null lastFrameRef', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('0', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // First RAF call - should not crash
    expect(() => triggerRAF(1000)).not.toThrow();
  });

  it('handles zero delta between frames', () => {
    const captured: { intensity?: DigitIntensity[] } = {};

    const Probe = () => {
      const intensity = useDigitDecay('0', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    triggerRAF(1000);
    const intensityBefore = captured.intensity;

    // Same timestamp
    triggerRAF(1000);
    const intensityAfter = captured.intensity;

    // Should not update when delta is 0
    expect(intensityAfter).toBe(intensityBefore);
  });

  it('correctly encodes all digits 0-9', () => {
    const testCases = [
      { digit: '0', expectedLeft: true, expectedRight: false, expectedRow: 0 },
      { digit: '1', expectedLeft: true, expectedRight: false, expectedRow: 1 },
      { digit: '2', expectedLeft: true, expectedRight: false, expectedRow: 2 },
      { digit: '3', expectedLeft: true, expectedRight: false, expectedRow: 3 },
      { digit: '4', expectedLeft: true, expectedRight: false, expectedRow: 4 },
      { digit: '5', expectedLeft: false, expectedRight: true, expectedRow: 0 },
      { digit: '6', expectedLeft: false, expectedRight: true, expectedRow: 1 },
      { digit: '7', expectedLeft: false, expectedRight: true, expectedRow: 2 },
      { digit: '8', expectedLeft: false, expectedRight: true, expectedRow: 3 },
      { digit: '9', expectedLeft: false, expectedRight: true, expectedRow: 4 },
    ];

    for (const { digit, expectedLeft, expectedRight, expectedRow } of testCases) {
      const captured: { intensity?: DigitIntensity[] } = {};

      const Probe = () => {
        const intensity = useDigitDecay(digit, 0);
        React.useEffect(() => {
          captured.intensity = intensity;
        }, [intensity]);
        return null;
      };

      render(<Probe />);

      expect(captured.intensity?.[0].left).toBe(expectedLeft ? 1 : 0);
      expect(captured.intensity?.[0].right).toBe(expectedRight ? 1 : 0);
      expect(captured.intensity?.[0].rows[expectedRow]).toBe(1);

      act(() => root.unmount());
      container.remove();
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    }
  });

  it('handles rapid length changes', () => {
    const captured: { intensity?: DigitIntensity[] } = {};
    const setDigitsRef = { current: undefined as ((d: string) => void) | undefined };

    const Probe = () => {
      const [digits, setDigitsState] = React.useState('12');
      React.useEffect(() => {
        setDigitsRef.current = setDigitsState;
      }, [setDigitsState]);
      const intensity = useDigitDecay(digits, 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity).toHaveLength(2);

    // Rapid changes
    act(() => {
      setDigitsRef.current?.('1');
      setDigitsRef.current?.('123');
      setDigitsRef.current?.('12');
      setDigitsRef.current?.('12345678');
    });

    expect(captured.intensity).toHaveLength(8);
    expect(captured.intensity?.[0].left).toBe(1); // Digit 1
    expect(captured.intensity?.[7].right).toBe(1); // Digit 8
  });
});

/* @vitest-environment jsdom */
