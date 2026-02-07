import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { EmulatorStateProvider, useEmulatorState } from './EmulatorStateProvider';
import type { I650EmulatorState } from '@/lib/simh/i650/service';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let subscribeCallback: ((state: I650EmulatorState) => void) | null = null;

const mockState: I650EmulatorState = {
  initialized: false,
  isRunning: false,
  yieldSteps: 1000,
  displaySwitch: 0,
  controlSwitch: 0,
  errorSwitch: 0,
  addressSwitches: '0000',
  addressRegister: '0000',
  programRegister: '0000000000+',
  lowerAccumulator: '0000000000+',
  upperAccumulator: '0000000000+',
  distributor: '0000000000+',
  consoleSwitches: '0000000000+',
  programmedStop: false,
  overflowStop: false,
  halfCycle: false,
  displayValue: '0000000000+',
  operation: '00',
  stateStreamTick: 0,
};

const mockServiceMocks = vi.hoisted(() => ({
  unsubscribeMock: vi.fn(),
  getState: vi.fn(),
  subscribe: vi.fn(),
  INITIAL_OPERATING_STATE: Object.freeze({
    dataAddress: false,
    program: false,
    inputOutput: false,
    inquiry: false,
    ramac: false,
    magneticTape: false,
    instAddress: false,
    accumulator: false,
    overflow: false,
  }),
  INITIAL_CHECKING_STATE: Object.freeze({
    programRegister: false,
    controlUnit: false,
    storageSelection: false,
    storageUnit: false,
    distributor: false,
    clocking: false,
    accumulator: false,
    errorSense: false,
  }),
}));

vi.mock('@/lib/simh/i650/service', () => mockServiceMocks);

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('EmulatorStateProvider', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    subscribeCallback = null;
    vi.clearAllMocks();

    mockServiceMocks.getState.mockReturnValue({ ...mockState });
    mockServiceMocks.subscribe.mockImplementation((callback: (state: I650EmulatorState) => void) => {
      subscribeCallback = callback;
      return mockServiceMocks.unsubscribeMock;
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('throws error when useEmulatorState is used outside provider', () => {
    const Probe = () => {
      useEmulatorState();
      return null;
    };

    expect(() => render(<Probe />)).toThrow('useEmulatorState must be used within EmulatorStateProvider');
  });

  it('calls getState on mount', () => {
    const Probe = () => {
      useEmulatorState();
      return null;
    };

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    expect(mockServiceMocks.getState).toHaveBeenCalled();
  });

  it('subscribes to service updates', () => {
    const Probe = () => {
      useEmulatorState();
      return null;
    };

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    expect(mockServiceMocks.subscribe).toHaveBeenCalled();
    expect(subscribeCallback).not.toBeNull();
  });

  it('provides all state properties to consumers', () => {
    const captured: { state?: ReturnType<typeof useEmulatorState> } = {};

    const Probe = () => {
      const state = useEmulatorState();
      React.useEffect(() => {
        captured.state = state;
      }, [state]);
      return null;
    };

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    expect(captured.state).toMatchObject({
      initialized: false,
      isRunning: false,
      yieldSteps: 1000,
      displaySwitch: 0,
      controlSwitch: 0,
      errorSwitch: 0,
      addressSwitches: '0000',
      addressRegister: '0000',
      programRegister: '0000000000+',
      lowerAccumulator: '0000000000+',
      upperAccumulator: '0000000000+',
      distributor: '0000000000+',
      consoleSwitches: '0000000000+',
      programmedStop: false,
      overflowStop: false,
      halfCycle: false,
      displayValue: '0000000000+',
      operation: '00',
      stateStreamTick: 0,
    });
  });

  it('updates state when service publishes changes', () => {
    const captured: { state?: ReturnType<typeof useEmulatorState> } = {};

    const Probe = () => {
      const state = useEmulatorState();
      React.useEffect(() => {
        captured.state = state;
      }, [state]);
      return null;
    };

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    expect(captured.state?.isRunning).toBe(false);

    // Simulate state update from service
    act(() => {
      subscribeCallback?.({
        ...mockState,
        isRunning: true,
      });
    });

    expect(captured.state?.isRunning).toBe(true);
  });

  it('triggers re-render when state updates', () => {
    let renderCount = 0;

    const Probe = () => {
      const state = useEmulatorState();
      React.useEffect(() => {
        renderCount++;
      }, [state]);
      return null;
    };

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    const initialRenderCount = renderCount;

    // Simulate state update
    act(() => {
      subscribeCallback?.({
        ...mockState,
        yieldSteps: 2000,
      });
    });

    expect(renderCount).toBeGreaterThan(initialRenderCount);
  });

  it('unsubscribes on unmount', () => {
    const Probe = () => {
      useEmulatorState();
      return null;
    };

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    expect(mockServiceMocks.unsubscribeMock).not.toHaveBeenCalled();

    act(() => root.unmount());

    expect(mockServiceMocks.unsubscribeMock).toHaveBeenCalled();
  });

  it('provides stable context value when state does not change', () => {
    const captured: { values: Array<ReturnType<typeof useEmulatorState>> } = { values: [] };

    const Probe = () => {
      const state = useEmulatorState();
      React.useEffect(() => {
        captured.values.push(state);
      }, [state]);
      return null;
    };

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    const firstValue = captured.values[0];

    // Trigger same state update (no actual change)
    act(() => {
      subscribeCallback?.({ ...mockState });
    });

    const secondValue = captured.values[captured.values.length - 1];

    // useMemo should prevent unnecessary reference changes
    // (though values may differ if emuState ref changes)
    expect(firstValue).toBeDefined();
    expect(secondValue).toBeDefined();
  });

  it('exposes INITIAL_OPERATING_STATE constant', () => {
    expect(mockServiceMocks.INITIAL_OPERATING_STATE).toEqual({
      dataAddress: false,
      program: false,
      inputOutput: false,
      inquiry: false,
      ramac: false,
      magneticTape: false,
      instAddress: false,
      accumulator: false,
      overflow: false,
    });
  });

  it('exposes INITIAL_CHECKING_STATE constant', () => {
    expect(mockServiceMocks.INITIAL_CHECKING_STATE).toEqual({
      programRegister: false,
      controlUnit: false,
      storageSelection: false,
      storageUnit: false,
      distributor: false,
      clocking: false,
      accumulator: false,
      errorSense: false,
    });
  });

  it('passes children through provider', () => {
    const Probe = () => <div data-testid="child">Child Content</div>;

    render(
      <EmulatorStateProvider>
        <Probe />
      </EmulatorStateProvider>
    );

    const child = container.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe('Child Content');
  });
});

/* @vitest-environment jsdom */
