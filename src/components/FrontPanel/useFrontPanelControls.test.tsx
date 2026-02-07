import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { useFrontPanelControls } from './useFrontPanelControls';
import { EmulatorStateProvider } from '../EmulatorStateProvider';
import { EmulatorConsoleProvider } from '../EmulatorConsoleProvider';
import { EmulatorActionsProvider } from '../EmulatorActionsProvider';
import { Programmed, HalfCycle, Overflow } from './ConfigSection';
import { Display } from '@/lib/simh/i650/controls';
import type { I650EmulatorState } from '@/lib/simh/i650/service';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockState: I650EmulatorState = {
  initialized: true,
  isRunning: false,
  yieldSteps: 1000,
  displaySwitch: Display.LOWER_ACCUM,
  controlSwitch: 1,
  errorSwitch: 0,
  addressSwitches: '0000',
  addressRegister: '1234',
  programRegister: '0000000000+',
  lowerAccumulator: '0000000000+',
  upperAccumulator: '0000000000+',
  distributor: '0000000000+',
  consoleSwitches: '9876543210+',
  programmedStop: false,
  overflowStop: false,
  halfCycle: false,
  displayValue: '1234567890+',
  operation: '69',
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

vi.mock('@/lib/simh/i650/service', () => mockServiceMocks);

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('useFrontPanelControls', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();

    mockServiceMocks.getState.mockReturnValue({ ...mockState });
    mockServiceMocks.subscribe.mockReturnValue(mockServiceMocks.unsubscribeMock);
    mockServiceMocks.init.mockResolvedValue(undefined);
    mockServiceMocks.subscribeOutput.mockReturnValue(mockServiceMocks.unsubscribeOutputMock);
    mockServiceMocks.refreshRegisters.mockResolvedValue(undefined);
    mockServiceMocks.executeCommand.mockResolvedValue('');
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <EmulatorStateProvider>
      <EmulatorConsoleProvider>
        <EmulatorActionsProvider>{children}</EmulatorActionsProvider>
      </EmulatorConsoleProvider>
    </EmulatorStateProvider>
  );

  it('returns all expected properties', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls).toMatchObject({
      displayValue: expect.any(String),
      entryValue: expect.any(String),
      addressDisplay: expect.any(String),
      operation: expect.any(String),
      stateStreamTick: expect.any(Number),
      operatingState: expect.any(Object),
      checkingState: expect.any(Object),
      programmed: expect.any(Number),
      halfCycle: expect.any(Number),
      addressSelection: expect.any(String),
      control: expect.any(Number),
      display: expect.any(Number),
      overflow: expect.any(Number),
      error: expect.any(Number),
      onEntryValueChange: expect.any(Function),
      onProgrammedChange: expect.any(Function),
      onHalfCycleChange: expect.any(Function),
      onAddressChange: expect.any(Function),
      onControlChange: expect.any(Function),
      onDisplayChange: expect.any(Function),
      onOverflowChange: expect.any(Function),
      onErrorChange: expect.any(Function),
      onTransferClick: expect.any(Function),
      onProgramStartClick: expect.any(Function),
      onProgramStopClick: expect.any(Function),
      onProgramResetClick: expect.any(Function),
      onComputerResetClick: expect.any(Function),
      onAccumResetClick: expect.any(Function),
      onEmulatorResetClick: expect.any(Function),
    });
  });

  it('converts programmedStop false to Programmed.RUN', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, programmedStop: false });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.programmed).toBe(Programmed.RUN);
  });

  it('converts programmedStop true to Programmed.STOP', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, programmedStop: true });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.programmed).toBe(Programmed.STOP);
  });

  it('converts halfCycle false to HalfCycle.RUN', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, halfCycle: false });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.halfCycle).toBe(HalfCycle.RUN);
  });

  it('converts halfCycle true to HalfCycle.HALF', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, halfCycle: true });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.halfCycle).toBe(HalfCycle.HALF);
  });

  it('converts overflowStop false to Overflow.SENSE', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, overflowStop: false });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.overflow).toBe(Overflow.SENSE);
  });

  it('converts overflowStop true to Overflow.STOP', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, overflowStop: true });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.overflow).toBe(Overflow.STOP);
  });

  it('sets operatingState.program to true when isRunning is true', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, isRunning: true });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.operatingState.program).toBe(true);
  });

  it('sets operatingState.program to false when isRunning is false', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, isRunning: false });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.operatingState.program).toBe(false);
  });

  it('maps entryValue from consoleSwitches', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, consoleSwitches: '1111111111+' });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.entryValue).toBe('1111111111+');
  });

  it('maps addressDisplay from addressRegister', async () => {
    const captured: { controls?: ReturnType<typeof useFrontPanelControls> } = {};
    mockServiceMocks.getState.mockReturnValue({ ...mockState, addressRegister: '5678' });

    const Probe = () => {
      const controls = useFrontPanelControls();
      React.useEffect(() => {
        captured.controls = controls;
      }, [controls]);
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(captured.controls?.addressDisplay).toBe('5678');
  });

  it('calls refreshRegisters when initialized becomes true', async () => {
    mockServiceMocks.getState.mockReturnValue({ ...mockState, initialized: false });
    let subscribeCallback: ((state: I650EmulatorState) => void) | null = null;

    mockServiceMocks.subscribe.mockImplementation((callback: (state: I650EmulatorState) => void) => {
      subscribeCallback = callback;
      return mockServiceMocks.unsubscribeMock;
    });

    const Probe = () => {
      useFrontPanelControls();
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    expect(mockServiceMocks.refreshRegisters).not.toHaveBeenCalled();

    // Update to initialized
    await act(async () => {
      subscribeCallback?.({ ...mockState, initialized: true });
    });

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockServiceMocks.refreshRegisters).toHaveBeenCalled();
  });

  it('calls refreshRegisters when displaySwitch changes', async () => {
    let subscribeCallback: ((state: I650EmulatorState) => void) | null = null;

    mockServiceMocks.subscribe.mockImplementation((callback: (state: I650EmulatorState) => void) => {
      subscribeCallback = callback;
      return mockServiceMocks.unsubscribeMock;
    });

    const Probe = () => {
      useFrontPanelControls();
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    // Wait for initial effect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const callCountBefore = mockServiceMocks.refreshRegisters.mock.calls.length;

    // Change display switch
    await act(async () => {
      subscribeCallback?.({ ...mockState, displaySwitch: Display.UPPER_ACCUM });
    });

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const callCountAfter = mockServiceMocks.refreshRegisters.mock.calls.length;
    expect(callCountAfter).toBeGreaterThan(callCountBefore);
  });

  it('logs error when refreshRegisters fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockServiceMocks.refreshRegisters.mockRejectedValue(new Error('Refresh failed'));

    const Probe = () => {
      useFrontPanelControls();
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    // Wait for effect and error handling
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh registers', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('does not call refreshRegisters when not initialized', async () => {
    mockServiceMocks.getState.mockReturnValue({ ...mockState, initialized: false });

    const Probe = () => {
      useFrontPanelControls();
      return null;
    };

    await act(async () => {
      render(
        <TestWrapper>
          <Probe />
        </TestWrapper>
      );
    });

    // Wait a bit to ensure no effect runs
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockServiceMocks.refreshRegisters).not.toHaveBeenCalled();
  });
});

/* @vitest-environment jsdom */
