import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import EmulatorConsole from './EmulatorConsole';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const COMMAND_HISTORY_KEY = 'simh.command-history';

type ButtonProps = { onClick?: (e?: unknown) => void } & Record<string, unknown>;

const stripDomProps = (props: Record<string, unknown>) => {
  const {
    labelText,
    titleText,
    renderIcon,
    hasIconOnly,
    iconDescription,
    ...rest
  } = props;
  void labelText;
  void titleText;
  void renderIcon;
  void hasIconOnly;
  void iconDescription;
  return rest;
};

vi.mock('@carbon/react', () => ({
  Button: ({ onClick, ...props }: ButtonProps) => {
    const merged = { ...props, onClick };
    return <button type="button" {...stripDomProps(merged)} />;
  },
}));

vi.mock('@carbon/icons-react', () => ({
  Stop: () => null,
  Play: () => null,
}));

const emulatorConsoleState = vi.hoisted(() => ({
  sendCommand: vi.fn(async () => ''),
  outputValue: 'hello\n',
  initializedValue: true,
  isRunningValue: false,
}));

vi.mock('./EmulatorConsoleProvider', () => ({
  useEmulatorConsole: () => ({
    output: emulatorConsoleState.outputValue,
    sendCommand: emulatorConsoleState.sendCommand,
    initialized: emulatorConsoleState.initializedValue,
    isRunning: emulatorConsoleState.isRunningValue,
  }),
}));

const actionMocks = vi.hoisted(() => ({
  onProgramStopClick: vi.fn(),
}));

vi.mock('./EmulatorActionsProvider', () => ({
  useEmulatorActions: () => ({
    onProgramStopClick: actionMocks.onProgramStopClick,
  }),
}));

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const getButtonByLabel = (label: string) =>
  container.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null;

const getCommandInput = () => container.querySelector('#command') as HTMLTextAreaElement;

const getCurrentCommand = () => {
  const terminalValue = getCommandInput().value;
  const lastLine = terminalValue.split('\n').at(-1) ?? '';
  return lastLine.replace(/^sim>\s?/, '');
};

const typeCommand = (value: string) => {
  const commandInput = getCommandInput();
  const nativeValueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value'
  )?.set;
  act(() => {
    nativeValueSetter?.call(commandInput, value);
    commandInput.dispatchEvent(new Event('input', { bubbles: true }));
    commandInput.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

const pressKey = (key: string, options?: { metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean }) => {
  const commandInput = getCommandInput();
  act(() => {
    commandInput.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
  });
};

describe('EmulatorConsole', () => {
  beforeEach(() => {
    const memoryStorage = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => (memoryStorage.has(key) ? memoryStorage.get(key)! : null),
        setItem: (key: string, value: string) => {
          memoryStorage.set(key, String(value));
        },
        removeItem: (key: string) => {
          memoryStorage.delete(key);
        },
        clear: () => {
          memoryStorage.clear();
        },
      },
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    emulatorConsoleState.sendCommand.mockReset();
    emulatorConsoleState.sendCommand.mockImplementation(async () => '');
    emulatorConsoleState.outputValue = 'hello\n';
    emulatorConsoleState.initializedValue = true;
    emulatorConsoleState.isRunningValue = false;
    actionMocks.onProgramStopClick.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    act(() => root.unmount());
    container.remove();
  });

  it('renders provider output in terminal area', () => {
    render(<EmulatorConsole />);
    const output = container.querySelector('.emulator-console__output');
    expect((output as HTMLTextAreaElement | null)?.value).toContain('hello');
  });

  it('does not show prompt before emulator is initialized', () => {
    emulatorConsoleState.initializedValue = false;
    render(<EmulatorConsole />);
    expect(getCommandInput().value).toBe('hello\n');
    expect(getCommandInput().disabled).toBe(true);
  });

  it('submits command on Enter and trims input', async () => {
    render(<EmulatorConsole />);
    typeCommand('  SHOW DEV  ');
    pressKey('Enter');

    await act(async () => {
      await Promise.resolve();
    });

    expect(emulatorConsoleState.sendCommand).toHaveBeenCalledWith('SHOW DEV');
    expect(getCurrentCommand()).toBe('');
  });

  it('ignores empty and whitespace-only commands', async () => {
    render(<EmulatorConsole />);
    pressKey('Enter');
    typeCommand('   ');
    pressKey('Enter');

    await act(async () => {
      await Promise.resolve();
    });

    expect(emulatorConsoleState.sendCommand).not.toHaveBeenCalled();
  });

  it('supports command history on ArrowUp and ArrowDown', async () => {
    render(<EmulatorConsole />);

    typeCommand('first');
    pressKey('Enter');
    typeCommand('second');
    pressKey('Enter');

    await act(async () => {
      await Promise.resolve();
    });

    typeCommand('draft');

    pressKey('ArrowUp');
    expect(getCurrentCommand()).toBe('second');
    pressKey('ArrowUp');
    expect(getCurrentCommand()).toBe('first');
    pressKey('ArrowDown');
    expect(getCurrentCommand()).toBe('second');
    pressKey('ArrowDown');
    expect(getCurrentCommand()).toBe('draft');
  });

  it('persists command history to localStorage', async () => {
    render(<EmulatorConsole />);
    typeCommand('persist me');
    pressKey('Enter');

    await act(async () => {
      await Promise.resolve();
    });

    expect(JSON.parse(window.localStorage.getItem(COMMAND_HISTORY_KEY) ?? '[]')).toEqual(['persist me']);
  });

  it('loads persisted history from localStorage', () => {
    window.localStorage.setItem(COMMAND_HISTORY_KEY, JSON.stringify(['older', 'newer']));
    render(<EmulatorConsole />);

    pressKey('ArrowUp');
    expect(getCurrentCommand()).toBe('newer');
    pressKey('ArrowUp');
    expect(getCurrentCommand()).toBe('older');
  });

  it('keeps caret out of historical output on ArrowLeft', () => {
    render(<EmulatorConsole />);
    typeCommand('abc');
    const input = getCommandInput();
    const promptStart = input.value.lastIndexOf('sim> ') + 'sim> '.length;

    act(() => {
      input.setSelectionRange(0, 0);
    });
    pressKey('ArrowLeft');

    expect(input.selectionStart).toBe(promptStart);
    expect(input.selectionEnd).toBe(promptStart);
  });

  it('keeps caret out of historical output on Cmd+ArrowLeft', () => {
    render(<EmulatorConsole />);
    typeCommand('abc');
    const input = getCommandInput();
    const promptStart = input.value.lastIndexOf('sim> ') + 'sim> '.length;

    act(() => {
      input.setSelectionRange(0, 0);
    });
    pressKey('ArrowLeft', { metaKey: true });

    expect(input.selectionStart).toBe(promptStart);
    expect(input.selectionEnd).toBe(promptStart);
  });

  it('shows stop button while running and calls stop handler', async () => {
    emulatorConsoleState.isRunningValue = true;
    render(<EmulatorConsole />);

    const stopButton = getButtonByLabel('Stop') as HTMLButtonElement;
    expect(stopButton).toBeDefined();
    await act(async () => {
      stopButton.click();
    });
    expect(actionMocks.onProgramStopClick).toHaveBeenCalledTimes(1);
    expect(getCommandInput().disabled).toBe(true);
  });

  it('runs go command from Go button', async () => {
    render(<EmulatorConsole />);
    const goButton = getButtonByLabel('Go') as HTMLButtonElement;

    await act(async () => {
      goButton.click();
    });

    expect(emulatorConsoleState.sendCommand).toHaveBeenCalledWith('go');
  });

  it('clears sending state after timeout fires', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    emulatorConsoleState.sendCommand.mockImplementation(
      () =>
        new Promise<string>(() => {
          // never resolves
        })
    );
    let timeoutCallback: (() => void) | null = null;
    setTimeoutSpy.mockImplementation((cb) => {
      timeoutCallback = cb as () => void;
      return 456 as unknown as ReturnType<typeof setTimeout>;
    });

    render(<EmulatorConsole />);
    typeCommand('LONG RUN');
    pressKey('Enter');

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      timeoutCallback?.();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(getCommandInput().disabled).toBe(false);
    expect(setTimeoutSpy.mock.calls.some(([, delay]) => delay === 15000)).toBe(true);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
