import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import EmulatorConsole from './EmulatorConsole';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type InputProps = {
  id?: string;
  onChange?: (e: { target: { value: string; checked?: boolean } }) => void;
  onKeyDown?: (e: { key: string; preventDefault: () => void }) => void;
} & Record<string, unknown>;
type ButtonProps = { onClick?: (e?: unknown) => void } & Record<string, unknown>;

const inputPropsById = new Map<string, InputProps>();
let allowTextAreaRef = true;

const stripDomProps = (props: Record<string, unknown>) => {
  const { labelText, renderIcon, ...rest } = props;
  void labelText;
  void renderIcon;
  return rest;
};

vi.mock('@carbon/react', () => ({
  TextInput: ({ onChange, onKeyDown, ...props }: InputProps) => {
    const merged = { ...props, onChange, onKeyDown };
    if (typeof merged.id === 'string') {
      inputPropsById.set(merged.id, merged as InputProps);
    }
    return <input {...stripDomProps(merged)} />;
  },
  TextArea: (props: Record<string, unknown>) => {
    const { ref, ...rest } = props as Record<string, unknown> & { ref?: React.Ref<HTMLTextAreaElement> };
    return <textarea {...stripDomProps(rest)} ref={allowTextAreaRef ? (ref as React.Ref<HTMLTextAreaElement>) : undefined} />;
  },
  Checkbox: ({ onChange, ...props }: InputProps) => {
    const merged = { ...props, onChange };
    if (typeof merged.id === 'string') {
      inputPropsById.set(merged.id, merged as InputProps);
    }
    return <input type="checkbox" {...stripDomProps(merged)} />;
  },
  Button: ({ onClick, ...props }: ButtonProps) => {
    const merged = { ...props, onClick };
    return <button type="button" {...stripDomProps(merged)} />;
  },
  Stack: (props: Record<string, unknown>) => <div {...props} />,
}));

vi.mock('@carbon/icons-react', () => ({
  Send: () => null,
  Stop: () => null,
}));

const emulatorConsoleState = vi.hoisted(() => ({
  sendCommand: vi.fn(async () => ''),
  setYieldSteps: vi.fn(),
  outputValue: 'hello\n',
  isRunningValue: false,
  yieldStepsValue: 1000,
}));

vi.mock('./EmulatorConsoleProvider', () => ({
  useEmulatorConsole: () => ({
    output: emulatorConsoleState.outputValue,
    sendCommand: emulatorConsoleState.sendCommand,
    isRunning: emulatorConsoleState.isRunningValue,
    yieldSteps: emulatorConsoleState.yieldStepsValue,
    setYieldSteps: emulatorConsoleState.setYieldSteps,
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

const optionState = vi.hoisted(() => ({
  setDebugEnabled: vi.fn(),
  debugEnabled: false,
}));

vi.mock('@/lib/simh/debug', () => ({
  setDebugEnabled: optionState.setDebugEnabled,
  isDebugEnabled: () => optionState.debugEnabled,
}));

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

const typeCommand = (value: string) => {
  act(() => {
    const commandInput = inputPropsById.get('command');
    commandInput?.onChange?.({ target: { value } });
  });
};

describe('EmulatorConsole', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    inputPropsById.clear();
    allowTextAreaRef = true;
    emulatorConsoleState.sendCommand.mockReset();
    emulatorConsoleState.sendCommand.mockImplementation(async () => '');
    emulatorConsoleState.setYieldSteps.mockClear();
    actionMocks.onProgramStopClick.mockClear();
    optionState.setDebugEnabled.mockClear();
    emulatorConsoleState.outputValue = 'hello\n';
    emulatorConsoleState.isRunningValue = false;
    emulatorConsoleState.yieldStepsValue = 1000;
    optionState.debugEnabled = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    act(() => root.unmount());
    container.remove();
  });

  it('shows output updates', () => {
    render(<EmulatorConsole />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('hello');

    emulatorConsoleState.outputValue = 'hello\nworld\n';
    render(<EmulatorConsole />);
    expect(textarea.value).toContain('world');
  });

  it('skips auto-scroll when output ref is unavailable', () => {
    allowTextAreaRef = false;
    render(<EmulatorConsole />);

    emulatorConsoleState.outputValue = 'next line\n';
    render(<EmulatorConsole />);
  });

  it('sends command on send click and trims input', async () => {
    render(<EmulatorConsole />);
    typeCommand('  SHOW DEV  ');

    const sendButton = container.querySelector('button') as HTMLButtonElement;
    await act(async () => {
      sendButton.click();
    });

    expect(emulatorConsoleState.sendCommand).toHaveBeenCalledWith('SHOW DEV');
  });

  it('submits command on Enter key', async () => {
    render(<EmulatorConsole />);
    typeCommand('RESET');

    const commandInput = inputPropsById.get('command');
    await act(async () => {
      commandInput?.onKeyDown?.({ key: 'Enter', preventDefault: vi.fn() });
    });

    expect(emulatorConsoleState.sendCommand).toHaveBeenCalledWith('RESET');
  });

  it('ignores non-Enter key presses', async () => {
    render(<EmulatorConsole />);
    typeCommand('RESET');

    const commandInput = inputPropsById.get('command');
    await act(async () => {
      commandInput?.onKeyDown?.({ key: 'Escape', preventDefault: vi.fn() });
    });

    expect(emulatorConsoleState.sendCommand).not.toHaveBeenCalled();
  });

  it('ignores empty commands', async () => {
    render(<EmulatorConsole />);
    const sendButton = container.querySelector('button') as HTMLButtonElement;

    await act(async () => {
      sendButton.click();
    });

    expect(emulatorConsoleState.sendCommand).not.toHaveBeenCalled();
  });

  it('ignores whitespace-only commands on Enter', async () => {
    render(<EmulatorConsole />);
    typeCommand('   ');

    const commandInput = inputPropsById.get('command');
    await act(async () => {
      commandInput?.onKeyDown?.({ key: 'Enter', preventDefault: vi.fn() });
    });

    expect(emulatorConsoleState.sendCommand).not.toHaveBeenCalled();
  });

  it('shows stop button while running and calls stop handler', async () => {
    emulatorConsoleState.isRunningValue = true;
    render(<EmulatorConsole />);

    const stopButton = container.querySelector('button') as HTMLButtonElement;
    expect(stopButton.textContent).toContain('Stop');
    await act(async () => {
      stopButton.click();
    });
    expect(actionMocks.onProgramStopClick).toHaveBeenCalledTimes(1);

    const commandInput = container.querySelector('#command') as HTMLInputElement;
    expect(commandInput.disabled).toBe(true);
  });

  it('updates yield steps from advanced options', () => {
    render(<EmulatorConsole />);
    act(() => {
      inputPropsById.get('yield-steps')?.onChange?.({ target: { value: '2500' } });
    });
    expect(emulatorConsoleState.setYieldSteps).toHaveBeenCalledWith(2500);
  });

  it('toggles debug option', () => {
    render(<EmulatorConsole />);
    act(() => {
      inputPropsById.get('simh-debug')?.onChange?.({ target: { value: '', checked: true } });
    });
    expect(optionState.setDebugEnabled).toHaveBeenCalledWith(true);
  });

  it('clears send timeout when command finishes', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    let resolveSend: (() => void) | null = null;
    let timeoutCallback: (() => void) | null = null;
    setTimeoutSpy.mockImplementation((cb) => {
      timeoutCallback = cb as () => void;
      return 123 as unknown as ReturnType<typeof setTimeout>;
    });
    emulatorConsoleState.sendCommand.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveSend = () => resolve('');
        })
    );

    render(<EmulatorConsole />);
    typeCommand('LONG');
    const sendButton = container.querySelector('button') as HTMLButtonElement;
    await act(async () => {
      sendButton.click();
    });

    expect(setTimeoutSpy).toHaveBeenCalled();

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      resolveSend?.();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(timeoutCallback).toBeDefined();
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
    const sendButton = container.querySelector('button') as HTMLButtonElement;

    await act(async () => {
      sendButton.click();
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      timeoutCallback?.();
    });
    await act(async () => {
      await Promise.resolve();
    });
    const updatedSendButton = container.querySelector('button') as HTMLButtonElement;
    expect(updatedSendButton.disabled).toBe(false);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 15000);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

});
