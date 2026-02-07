import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { useDisplayDecay, type DisplayIntensity } from './useDisplayDecay';

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

describe('useDisplayDecay', () => {
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

  it('returns initial empty intensity structure', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity).toBeDefined();
    expect(captured.intensity?.digits).toHaveLength(10);
    expect(captured.intensity?.sign).toHaveProperty('plus');
    expect(captured.intensity?.sign).toHaveProperty('minus');
  });

  it('lights left bulb and row for digits 0-4', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('3000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Digit 3: left bulb + row[3]
    expect(captured.intensity?.digits[0].left).toBe(1);
    expect(captured.intensity?.digits[0].right).toBe(0);
    expect(captured.intensity?.digits[0].rows[3]).toBe(1);
  });

  it('lights right bulb and row for digits 5-9', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('7000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Digit 7: right bulb + row[2] (7 % 5 = 2)
    expect(captured.intensity?.digits[0].left).toBe(0);
    expect(captured.intensity?.digits[0].right).toBe(1);
    expect(captured.intensity?.digits[0].rows[2]).toBe(1);
  });

  it('lights plus sign for positive values', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity?.sign.plus).toBe(1);
    expect(captured.intensity?.sign.minus).toBe(0);
  });

  it('lights minus sign for negative values', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000-', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    expect(captured.intensity?.sign.plus).toBe(0);
    expect(captured.intensity?.sign.minus).toBe(1);
  });

  it('applies exponential decay to unlit bulbs', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // First frame - set baseline
    triggerRAF(1000);

    const initialMinus = captured.intensity?.sign.minus ?? 0;
    expect(initialMinus).toBe(0); // Unlit

    // Second frame with 50ms delta
    triggerRAF(1050);

    const afterDecay = captured.intensity?.sign.minus ?? 0;

    // Should apply decay factor: Math.exp(-50 / 50) = Math.exp(-1) ≈ 0.368
    // Since it starts at 0, it stays at 0
    expect(afterDecay).toBe(0);
  });

  it('preserves intensity of lit bulbs during decay', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Get initial plus intensity (should be 1)
    const initialPlus = captured.intensity?.sign.plus ?? 0;
    expect(initialPlus).toBe(1);

    // Trigger frames to apply decay
    triggerRAF(1000);
    triggerRAF(1050);

    const afterDecay = captured.intensity?.sign.plus ?? 0;

    // Lit bulb should stay at 1
    expect(afterDecay).toBe(1);
  });

  it('handles first frame with null lastFrameRef', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // First RAF call - should set lastFrameRef without crashing
    expect(() => triggerRAF(1000)).not.toThrow();
  });

  it('handles zero delta between frames', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    triggerRAF(1000);
    const intensityBefore = captured.intensity;

    // Same timestamp - zero delta
    triggerRAF(1000);
    const intensityAfter = captured.intensity;

    // Should not update state when delta is 0
    expect(intensityAfter).toBe(intensityBefore);
  });

  it('updates intensity when tick changes', () => {
    const captured: { intensity?: DisplayIntensity } = {};
    const setTickRef = { current: undefined as ((t: number) => void) | undefined };

    const Probe = () => {
      const [tick, setTickState] = React.useState(0);
      React.useEffect(() => {
        setTickRef.current = setTickState;
      }, [setTickState]);
      const intensity = useDisplayDecay('0000000000+', tick);
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

    // Should trigger re-evaluation (reference changes)
    expect(afterTick).not.toBe(initialIntensity);
  });

  it('cancels animation frame on unmount', () => {
    const Probe = () => {
      useDisplayDecay('0000000000+', 0);
      return null;
    };

    render(<Probe />);

    const cancelSpy = vi.mocked(globalThis.cancelAnimationFrame);

    act(() => root.unmount());

    // Should have called cancelAnimationFrame
    expect(cancelSpy).toHaveBeenCalled();
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
      const captured: { intensity?: DisplayIntensity } = {};

      const Probe = () => {
        const intensity = useDisplayDecay(`${digit}000000000+`, 0);
        React.useEffect(() => {
          captured.intensity = intensity;
        }, [intensity]);
        return null;
      };

      render(<Probe />);

      expect(captured.intensity?.digits[0].left).toBe(expectedLeft ? 1 : 0);
      expect(captured.intensity?.digits[0].right).toBe(expectedRight ? 1 : 0);
      expect(captured.intensity?.digits[0].rows[expectedRow]).toBe(1);

      act(() => root.unmount());
      container.remove();
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    }
  });

  it('applies decay only to unlit rows when digit has lit bulbs', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('3000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Trigger first frame
    triggerRAF(1000);

    // Digit 3: left bulb + row[3] should be lit
    expect(captured.intensity?.digits[0].left).toBe(1);
    expect(captured.intensity?.digits[0].rows[3]).toBe(1);

    // Trigger second frame with decay
    triggerRAF(1050);

    // Lit bulbs should stay at 1
    expect(captured.intensity?.digits[0].left).toBe(1);
    expect(captured.intensity?.digits[0].rows[3]).toBe(1);

    // Unlit rows should remain 0 (0 * factor = 0)
    expect(captured.intensity?.digits[0].rows[0]).toBe(0);
    expect(captured.intensity?.digits[0].rows[1]).toBe(0);
    expect(captured.intensity?.digits[0].rows[2]).toBe(0);
    expect(captured.intensity?.digits[0].rows[4]).toBe(0);
  });

  it('preserves sign bulbs during decay', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000-', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Trigger frames
    triggerRAF(1000);
    triggerRAF(1050);

    // Minus should stay lit
    expect(captured.intensity?.sign.minus).toBe(1);

    // Plus should remain 0
    expect(captured.intensity?.sign.plus).toBe(0);
  });

  it('skips decay when factor is >= 1', () => {
    const captured: { intensity?: DisplayIntensity } = {};

    const Probe = () => {
      const intensity = useDisplayDecay('0000000000+', 0);
      React.useEffect(() => {
        captured.intensity = intensity;
      }, [intensity]);
      return null;
    };

    render(<Probe />);

    // Set initial frame
    triggerRAF(1000);
    const intensityBefore = captured.intensity;

    // Trigger frame with negative delta (time goes backward - shouldn't happen but let's test the branch)
    // Since delta would be <= 0, factor calculation won't apply
    triggerRAF(999);
    const intensityAfter = captured.intensity;

    // Intensity reference should be the same (no decay applied)
    expect(intensityAfter).toBe(intensityBefore);
  });
});

/* @vitest-environment jsdom */
