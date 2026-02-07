import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import Providers from './Providers';
import { useEmulatorState } from './EmulatorStateProvider';
import { useEmulatorConsole } from './EmulatorConsoleProvider';
import { useEmulatorActions } from './EmulatorActionsProvider';
import { useCardDeck } from './CardDeckProvider';
import type { I650EmulatorState } from '@/lib/simh/i650';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

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
  getState: vi.fn(),
  subscribe: vi.fn(),
  unsubscribeMock: vi.fn(),
  init: vi.fn(),
  subscribeOutput: vi.fn(),
  unsubscribeOutputMock: vi.fn(),
  refreshRegisters: vi.fn(),
  setDisplaySwitch: vi.fn(),
  setAddressSwitches: vi.fn(),
  setProgrammedStop: vi.fn(),
  setHalfCycle: vi.fn(),
  setControlSwitch: vi.fn(),
  setOverflowStop: vi.fn(),
  setErrorSwitch: vi.fn(),
  setConsoleSwitches: vi.fn(),
  startProgramOrTransfer: vi.fn(),
  stopProgram: vi.fn(),
  resetProgram: vi.fn(),
  resetComputer: vi.fn(),
  resetAccumulator: vi.fn(),
  transferAddress: vi.fn(),
  restart: vi.fn(),
  executeCommand: vi.fn(),
  setYieldSteps: vi.fn(),
}));

vi.mock('@/lib/simh/i650', () => mockServiceMocks);

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('Providers', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();

    mockServiceMocks.getState.mockReturnValue({ ...mockState });
    mockServiceMocks.subscribe.mockReturnValue(mockServiceMocks.unsubscribeMock);
    mockServiceMocks.init.mockResolvedValue(undefined);
    mockServiceMocks.subscribeOutput.mockReturnValue(mockServiceMocks.unsubscribeOutputMock);
    mockServiceMocks.executeCommand.mockResolvedValue('');
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders children', async () => {
    const Child = () => <div data-testid="child">Test Child</div>;

    await act(async () => {
      render(
        <Providers>
          <Child />
        </Providers>
      );
    });

    const child = container.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe('Test Child');
  });

  it('provides CardDeck context', async () => {
    const captured: { deck?: ReturnType<typeof useCardDeck> } = {};

    const Probe = () => {
      const deck = useCardDeck();
      React.useEffect(() => {
        captured.deck = deck;
      }, [deck]);
      return null;
    };

    await act(async () => {
      render(
        <Providers>
          <Probe />
        </Providers>
      );
    });

    expect(captured.deck).toBeDefined();
    expect(captured.deck?.cardDeck).toEqual([]);
  });

  it('provides EmulatorState context', async () => {
    const captured: { state?: ReturnType<typeof useEmulatorState> } = {};

    const Probe = () => {
      const state = useEmulatorState();
      React.useEffect(() => {
        captured.state = state;
      }, [state]);
      return null;
    };

    await act(async () => {
      render(
        <Providers>
          <Probe />
        </Providers>
      );
    });

    expect(captured.state).toBeDefined();
    expect(captured.state?.initialized).toBe(false);
  });

  it('provides EmulatorConsole context', async () => {
    const captured: { console?: ReturnType<typeof useEmulatorConsole> } = {};

    const Probe = () => {
      const emulatorConsole = useEmulatorConsole();
      React.useEffect(() => {
        captured.console = emulatorConsole;
      }, [emulatorConsole]);
      return null;
    };

    await act(async () => {
      render(
        <Providers>
          <Probe />
        </Providers>
      );
    });

    expect(captured.console).toBeDefined();
    expect(captured.console?.output).toBeDefined();
    expect(captured.console?.sendCommand).toBeInstanceOf(Function);
  });

  it('provides EmulatorActions context', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    await act(async () => {
      render(
        <Providers>
          <Probe />
        </Providers>
      );
    });

    expect(captured.actions).toBeDefined();
    expect(captured.actions?.refreshRegisters).toBeInstanceOf(Function);
  });

  it('nests providers in correct order', async () => {
    // Test that all contexts are available to children
    // This verifies the nesting order: CardDeck → State → Console → Actions
    const captured: {
      deck?: ReturnType<typeof useCardDeck>;
      state?: ReturnType<typeof useEmulatorState>;
      console?: ReturnType<typeof useEmulatorConsole>;
      actions?: ReturnType<typeof useEmulatorActions>;
    } = {};

    const Probe = () => {
      const deck = useCardDeck();
      const state = useEmulatorState();
      const emulatorConsole = useEmulatorConsole();
      const actions = useEmulatorActions();

      React.useEffect(() => {
        captured.deck = deck;
        captured.state = state;
        captured.console = emulatorConsole;
        captured.actions = actions;
      }, [deck, state, emulatorConsole, actions]);
      return null;
    };

    await act(async () => {
      render(
        <Providers>
          <Probe />
        </Providers>
      );
    });

    // All contexts should be available
    expect(captured.deck).toBeDefined();
    expect(captured.state).toBeDefined();
    expect(captured.console).toBeDefined();
    expect(captured.actions).toBeDefined();

    // Verify some properties to ensure they're not just mock objects
    expect(captured.deck?.cardDeck).toEqual([]);
    expect(captured.state?.initialized).toBe(false);
    expect(captured.console?.output).toBeDefined();
    expect(captured.actions?.refreshRegisters).toBeInstanceOf(Function);
  });

  it('allows EmulatorConsole to access EmulatorState', async () => {
    // EmulatorConsoleProvider depends on EmulatorStateProvider
    // This test verifies that Console can access State (correct nesting order)
    const captured: { isRunning?: boolean; yieldSteps?: number } = {};

    const Probe = () => {
      const { isRunning, yieldSteps } = useEmulatorConsole();
      React.useEffect(() => {
        captured.isRunning = isRunning;
        captured.yieldSteps = yieldSteps;
      }, [isRunning, yieldSteps]);
      return null;
    };

    await act(async () => {
      render(
        <Providers>
          <Probe />
        </Providers>
      );
    });

    expect(captured.isRunning).toBe(false);
    expect(captured.yieldSteps).toBe(1000);
  });

  it('allows EmulatorActions to access EmulatorConsole', async () => {
    // EmulatorActionsProvider depends on EmulatorConsoleProvider
    // This test verifies that Actions can access Console (correct nesting order)
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    await act(async () => {
      render(
        <Providers>
          <Probe />
        </Providers>
      );
    });

    // onEmulatorResetClick uses clearOutput from Console
    expect(captured.actions?.onEmulatorResetClick).toBeInstanceOf(Function);
  });
});

/* @vitest-environment jsdom */
