import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import EmulatorConsole from './EmulatorConsole';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Carbon components to simple HTML equivalents
type InputProps = {
  id?: string;
  onChange?: (e: { target: { value: string } }) => void;
} & Record<string, unknown>;
type ButtonProps = { onClick?: (e?: unknown) => void } & Record<string, unknown>;
let lastInputProps: InputProps | undefined;
const inputPropsById = new Map<string, InputProps>();
let lastButtonProps: ButtonProps | undefined;

const stripDomProps = (props: Record<string, unknown>) => {
  const { labelText, renderIcon, ...rest } = props;
  void labelText;
  void renderIcon;
  return rest;
};

vi.mock('@carbon/react', () => ({
  TextInput: ({ onChange, ...props }: InputProps) => {
    const merged = { ...props, onChange };
    lastInputProps = merged as InputProps;
    if (typeof merged.id === 'string') {
      inputPropsById.set(merged.id, merged as InputProps);
    }
    return <input {...stripDomProps(merged)} />;
  },
  TextArea: (props: Record<string, unknown>) => <textarea {...stripDomProps(props)} />,
  Checkbox: ({ onChange, ...props }: InputProps) => {
    const merged = { ...props, onChange };
    return <input type="checkbox" {...stripDomProps(merged)} />;
  },
  Button: ({ onClick, ...props }: ButtonProps) => {
    const merged = { ...props, onClick };
    lastButtonProps = merged as ButtonProps;
    return <button type="button" {...stripDomProps(merged)} />;
  },
  Stack: (props: Record<string, unknown>) => <div {...props} />,
}));

vi.mock('@carbon/icons-react', () => ({
  Send: () => null,
}));

// Mock useEmulatorConsole to control output and capture sends
const sendCommand = vi.fn(async () => '');
const setYieldSteps = vi.fn();
let outputValue = 'hello\n';
vi.mock('./EmulatorConsoleProvider', () => ({
  useEmulatorConsole: () => ({
    output: outputValue,
    sendCommand,
    yieldSteps: 1000,
    setYieldSteps,
    isRunning: false,
  }),
}));

vi.mock('./EmulatorActionsProvider', () => ({
  useEmulatorActions: () => ({
    onProgramStopClick: vi.fn(),
  }),
}));

let container: HTMLDivElement;
let root: Root;

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('EmulatorConsole', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    sendCommand.mockClear();
    lastInputProps = undefined;
    inputPropsById.clear();
    lastButtonProps = undefined;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows emulator output and appends new lines', () => {
    render(<EmulatorConsole />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('hello');

    // simulate new output
    outputValue = 'hello\nworld\n';
    render(<EmulatorConsole />);
    expect(textarea.value).toContain('world');
  });

  it('sends command on button click and clears input', async () => {
    render(<EmulatorConsole />);
    act(() => {
      const commandInput = inputPropsById.get('command') ?? lastInputProps;
      commandInput?.onChange?.({ target: { value: '  SHOW DEV  ' } });
    });

    await act(async () => {
      lastButtonProps.onClick?.({ preventDefault() {} });
    });

    expect(sendCommand).toHaveBeenCalledWith('SHOW DEV');
  });

  it('ignores empty commands', async () => {
    render(<EmulatorConsole />);
    const button = container.querySelector('button') as HTMLButtonElement;

    await act(async () => {
      button.click();
    });

    expect(sendCommand).not.toHaveBeenCalled();
  });
});

/* @vitest-environment jsdom */
