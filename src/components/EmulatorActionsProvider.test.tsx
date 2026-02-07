import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { EmulatorActionsProvider, useEmulatorActions } from './EmulatorActionsProvider';
import { Programmed, HalfCycle, Overflow } from './FrontPanel/ConfigSection';
import { Control, Display, ErrorSwitch } from '@/lib/simh/i650/controls';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockServiceMocks = vi.hoisted(() => ({
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
}));

const mockConsoleMocks = vi.hoisted(() => ({
  clearOutput: vi.fn(),
  useEmulatorConsole: vi.fn(),
}));

vi.mock('@/lib/simh/i650/service', () => mockServiceMocks);
vi.mock('./EmulatorConsoleProvider', () => mockConsoleMocks);

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('EmulatorActionsProvider', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();

    mockConsoleMocks.useEmulatorConsole.mockReturnValue({
      clearOutput: mockConsoleMocks.clearOutput,
    });

    mockServiceMocks.refreshRegisters.mockResolvedValue(undefined);
    mockServiceMocks.setProgrammedStop.mockResolvedValue(undefined);
    mockServiceMocks.setHalfCycle.mockResolvedValue(undefined);
    mockServiceMocks.setOverflowStop.mockResolvedValue(undefined);
    mockServiceMocks.setConsoleSwitches.mockResolvedValue(undefined);
    mockServiceMocks.startProgramOrTransfer.mockResolvedValue(undefined);
    mockServiceMocks.stopProgram.mockResolvedValue(undefined);
    mockServiceMocks.resetProgram.mockResolvedValue(undefined);
    mockServiceMocks.resetComputer.mockResolvedValue(undefined);
    mockServiceMocks.resetAccumulator.mockResolvedValue(undefined);
    mockServiceMocks.transferAddress.mockResolvedValue(undefined);
    mockServiceMocks.restart.mockResolvedValue(undefined);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('throws error when useEmulatorActions is used outside provider', () => {
    mockConsoleMocks.useEmulatorConsole.mockImplementation(() => {
      throw new Error('useEmulatorConsole must be used within EmulatorConsoleProvider');
    });

    const Probe = () => {
      useEmulatorActions();
      return null;
    };

    expect(() => render(<Probe />)).toThrow();
  });

  it('refreshRegisters calls service method', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.refreshRegisters();
    });

    expect(mockServiceMocks.refreshRegisters).toHaveBeenCalled();
  });

  it('onDisplayChange calls setDisplaySwitch with value', () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    act(() => {
      captured.actions?.onDisplayChange(Display.UPPER_ACCUM);
    });

    expect(mockServiceMocks.setDisplaySwitch).toHaveBeenCalledWith(Display.UPPER_ACCUM);
  });

  it('onAddressChange calls setAddressSwitches with value', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onAddressChange('1234');
    });

    expect(mockServiceMocks.setAddressSwitches).toHaveBeenCalledWith('1234');
  });

  it('onProgrammedChange converts STOP enum to true', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onProgrammedChange(Programmed.STOP);
    });

    expect(mockServiceMocks.setProgrammedStop).toHaveBeenCalledWith(true);
  });

  it('onProgrammedChange converts RUN enum to false', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onProgrammedChange(Programmed.RUN);
    });

    expect(mockServiceMocks.setProgrammedStop).toHaveBeenCalledWith(false);
  });

  it('onHalfCycleChange converts HALF enum to true', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onHalfCycleChange(HalfCycle.HALF);
    });

    expect(mockServiceMocks.setHalfCycle).toHaveBeenCalledWith(true);
  });

  it('onHalfCycleChange converts RUN enum to false', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onHalfCycleChange(HalfCycle.RUN);
    });

    expect(mockServiceMocks.setHalfCycle).toHaveBeenCalledWith(false);
  });

  it('onControlChange calls setControlSwitch with value', () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    act(() => {
      captured.actions?.onControlChange(Control.MANUAL_OPERATION);
    });

    expect(mockServiceMocks.setControlSwitch).toHaveBeenCalledWith(Control.MANUAL_OPERATION);
  });

  it('onOverflowChange converts STOP enum to true', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onOverflowChange(Overflow.STOP);
    });

    expect(mockServiceMocks.setOverflowStop).toHaveBeenCalledWith(true);
  });

  it('onOverflowChange converts SENSE enum to false', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onOverflowChange(Overflow.SENSE);
    });

    expect(mockServiceMocks.setOverflowStop).toHaveBeenCalledWith(false);
  });

  it('onErrorChange calls setErrorSwitch with value', () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    act(() => {
      captured.actions?.onErrorChange(ErrorSwitch.SENSE);
    });

    expect(mockServiceMocks.setErrorSwitch).toHaveBeenCalledWith(ErrorSwitch.SENSE);
  });

  it('onEntryValueChange calls setConsoleSwitches with value', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onEntryValueChange('1234567890+');
    });

    expect(mockServiceMocks.setConsoleSwitches).toHaveBeenCalledWith('1234567890+');
  });

  it('onProgramStartClick calls startProgramOrTransfer', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onProgramStartClick();
    });

    expect(mockServiceMocks.startProgramOrTransfer).toHaveBeenCalled();
  });

  it('onProgramStopClick calls stopProgram', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onProgramStopClick();
    });

    expect(mockServiceMocks.stopProgram).toHaveBeenCalled();
  });

  it('onProgramResetClick calls resetProgram', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onProgramResetClick();
    });

    expect(mockServiceMocks.resetProgram).toHaveBeenCalled();
  });

  it('onComputerResetClick calls resetComputer', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onComputerResetClick();
    });

    expect(mockServiceMocks.resetComputer).toHaveBeenCalled();
  });

  it('onAccumResetClick calls resetAccumulator', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onAccumResetClick();
    });

    expect(mockServiceMocks.resetAccumulator).toHaveBeenCalled();
  });

  it('onTransferClick calls transferAddress', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onTransferClick();
    });

    expect(mockServiceMocks.transferAddress).toHaveBeenCalled();
  });

  it('onEmulatorResetClick calls clearOutput then restart', async () => {
    const captured: { actions?: ReturnType<typeof useEmulatorActions> } = {};
    const callOrder: string[] = [];

    mockConsoleMocks.clearOutput.mockImplementation(() => {
      callOrder.push('clearOutput');
    });

    mockServiceMocks.restart.mockImplementation(async () => {
      callOrder.push('restart');
    });

    const Probe = () => {
      const actions = useEmulatorActions();
      React.useEffect(() => {
        captured.actions = actions;
      }, [actions]);
      return null;
    };

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    await act(async () => {
      await captured.actions?.onEmulatorResetClick();
    });

    expect(callOrder).toEqual(['clearOutput', 'restart']);
  });

  it('passes children through provider', () => {
    const Probe = () => <div data-testid="child">Child Content</div>;

    render(
      <EmulatorActionsProvider>
        <Probe />
      </EmulatorActionsProvider>
    );

    const child = container.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe('Child Content');
  });
});

/* @vitest-environment jsdom */
