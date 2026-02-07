import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { EmulatorConsoleProvider, useEmulatorConsole } from './EmulatorConsoleProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockServiceMocks = vi.hoisted(() => ({
  init: vi.fn(),
  executeCommand: vi.fn(),
  setYieldSteps: vi.fn(),
  subscribeOutput: vi.fn(),
  unsubscribeOutputMock: vi.fn(),
}));

const mockEmulatorStateMocks = vi.hoisted(() => ({
  useEmulatorState: vi.fn(),
}));

vi.mock('@/lib/simh/i650/service', () => mockServiceMocks);
vi.mock('./EmulatorStateProvider', () => mockEmulatorStateMocks);

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('EmulatorConsoleProvider', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockEmulatorStateMocks.useEmulatorState.mockReturnValue({
      isRunning: false,
      yieldSteps: 1000,
    });

    mockServiceMocks.init.mockResolvedValue(undefined);
    mockServiceMocks.executeCommand.mockResolvedValue('command result');
    mockServiceMocks.subscribeOutput.mockReturnValue(mockServiceMocks.unsubscribeOutputMock);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('throws error when useEmulatorConsole is used outside provider', () => {
    const Probe = () => {
      useEmulatorConsole();
      return null;
    };

    expect(() => render(<Probe />)).toThrow('useEmulatorConsole must be used within EmulatorConsoleProvider');
  });

  it('calls init on mount', async () => {
    const Probe = () => {
      useEmulatorConsole();
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    expect(mockServiceMocks.init).toHaveBeenCalled();
  });

  it('enqueues error message when init fails', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};
    mockServiceMocks.init.mockRejectedValue(new Error('Init failed'));

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    // Flush the 50ms interval
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(captured.context?.output).toContain('Error initializing emulator: Init failed');
  });

  it('subscribes to output', () => {
    const Probe = () => {
      useEmulatorConsole();
      return null;
    };

    render(
      <EmulatorConsoleProvider>
        <Probe />
      </EmulatorConsoleProvider>
    );

    expect(mockServiceMocks.subscribeOutput).toHaveBeenCalled();
  });

  it('buffers output and flushes every 50ms', () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};
    let outputCallback: ((text: string) => void) | null = null;

    mockServiceMocks.subscribeOutput.mockImplementation((callback: (text: string) => void) => {
      outputCallback = callback;
      return mockServiceMocks.unsubscribeOutputMock;
    });

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    render(
      <EmulatorConsoleProvider>
        <Probe />
      </EmulatorConsoleProvider>
    );

    expect(captured.context?.output).toBe('');

    // Enqueue some output
    act(() => {
      outputCallback?.('Hello ');
      outputCallback?.('World');
    });

    // Output should still be empty (buffered)
    expect(captured.context?.output).toBe('');

    // Advance timer to trigger flush
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Now output should be flushed
    expect(captured.context?.output).toBe('Hello World');
  });

  it('sendCommand echoes command with sim> prefix', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};

    mockServiceMocks.subscribeOutput.mockImplementation((callback: (text: string) => void) => {
      void callback;
      return mockServiceMocks.unsubscribeOutputMock;
    });

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    // Send command
    await act(async () => {
      await captured.context?.sendCommand('test command');
    });

    // Flush buffer
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(captured.context?.output).toContain('sim> test command\n');
  });

  it('sendCommand trims whitespace', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    await act(async () => {
      await captured.context?.sendCommand('  trim me  ');
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(mockServiceMocks.executeCommand).toHaveBeenCalledWith('trim me', {
      streamOutput: true,
      echo: false,
    });
  });

  it('sendCommand returns empty string for empty command', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    let result: string | undefined;
    await act(async () => {
      result = await captured.context?.sendCommand('');
    });

    expect(result).toBe('');
    expect(mockServiceMocks.executeCommand).not.toHaveBeenCalled();
  });

  it('sendCommand returns empty string for whitespace-only command', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    let result: string | undefined;
    await act(async () => {
      result = await captured.context?.sendCommand('   ');
    });

    expect(result).toBe('');
    expect(mockServiceMocks.executeCommand).not.toHaveBeenCalled();
  });

  it('sendCommand returns result on success', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};
    mockServiceMocks.executeCommand.mockResolvedValue('success result');

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    let result: string | undefined;
    await act(async () => {
      result = await captured.context?.sendCommand('test');
    });

    expect(result).toBe('success result');
  });

  it('sendCommand returns empty string on error', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};
    mockServiceMocks.executeCommand.mockRejectedValue(new Error('Command failed'));

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    let result: string | undefined;
    await act(async () => {
      result = await captured.context?.sendCommand('test');
    });

    expect(result).toBe('');
  });

  it('setYieldSteps calls service method', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    act(() => {
      captured.context?.setYieldSteps(2000);
    });

    expect(mockServiceMocks.setYieldSteps).toHaveBeenCalledWith(2000);
  });

  it('clearOutput clears buffer and state', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};
    let outputCallback: ((text: string) => void) | null = null;

    mockServiceMocks.subscribeOutput.mockImplementation((callback: (text: string) => void) => {
      outputCallback = callback;
      return mockServiceMocks.unsubscribeOutputMock;
    });

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    // Add some output
    act(() => {
      outputCallback?.('Some output');
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(captured.context?.output).toBe('Some output');

    // Clear output
    act(() => {
      captured.context?.clearOutput();
    });

    expect(captured.context?.output).toBe('');

    // Ensure buffer is also cleared (nothing flushed on next interval)
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(captured.context?.output).toBe('');
  });

  it('passes through isRunning from EmulatorState', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};
    mockEmulatorStateMocks.useEmulatorState.mockReturnValue({
      isRunning: true,
      yieldSteps: 1000,
    });

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    expect(captured.context?.isRunning).toBe(true);
  });

  it('passes through yieldSteps from EmulatorState', async () => {
    const captured: { context?: ReturnType<typeof useEmulatorConsole> } = {};
    mockEmulatorStateMocks.useEmulatorState.mockReturnValue({
      isRunning: false,
      yieldSteps: 2500,
    });

    const Probe = () => {
      const context = useEmulatorConsole();
      React.useEffect(() => {
        captured.context = context;
      }, [context]);
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    expect(captured.context?.yieldSteps).toBe(2500);
  });

  it('clears interval on unmount', async () => {
    const Probe = () => {
      useEmulatorConsole();
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    await act(async () => {
      root.unmount();
    });

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('unsubscribes from output on unmount', async () => {
    const Probe = () => {
      useEmulatorConsole();
      return null;
    };

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    expect(mockServiceMocks.unsubscribeOutputMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });

    expect(mockServiceMocks.unsubscribeOutputMock).toHaveBeenCalled();
  });

  it('passes children through provider', async () => {
    const Probe = () => <div data-testid="child">Child Content</div>;

    await act(async () => {
      render(
        <EmulatorConsoleProvider>
          <Probe />
        </EmulatorConsoleProvider>
      );
    });

    const child = container.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe('Child Content');
  });
});

/* @vitest-environment jsdom */
