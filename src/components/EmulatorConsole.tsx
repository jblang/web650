'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  Button,
} from '@carbon/react';
import { Stop, Play, ViewNext, Script, Reset, Clean } from '@carbon/icons-react';
import { useEmulatorConsole } from './EmulatorConsoleProvider';
import { useEmulatorActions } from './EmulatorActionsProvider';
import FilesystemBrowser from './FilesystemBrowser';

const COMMAND_HISTORY_KEY = 'simh.command-history';
const MAX_COMMAND_HISTORY = 50;

function loadCommandHistory(): string[] {
  if (typeof window === 'undefined') return [];
  const storages: Storage[] = [window.localStorage, window.sessionStorage];
  for (const storage of storages) {
    try {
      const raw = storage.getItem(COMMAND_HISTORY_KEY);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value): value is string => typeof value === 'string');
    } catch {
      // Try next storage backend.
    }
  }
  return [];
}

function saveCommandHistory(history: string[]): void {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(history);
  try {
    window.localStorage.setItem(COMMAND_HISTORY_KEY, payload);
    return;
  } catch {
    // Fall back to session storage.
  }
  try {
    window.sessionStorage.setItem(COMMAND_HISTORY_KEY, payload);
  } catch {
    // Ignore storage failures.
  }
}

export default function EmulatorConsole() {
  const PROMPT = 'sim> ';

  const CONSOLE_CONTAINER_STYLE = {
    flex: 1,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    margin: 0,
    padding: '1rem 0',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'hidden',
  } as const;
  const TERMINAL_ROW_STYLE = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
  } as const;
  const TERMINAL_SLOT_STYLE = {
    flex: 1,
    minHeight: 0,
  } as const;
  const CONTROL_COLUMN_STYLE = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'stretch',
  } as const;
  const ICON_BUTTON_STYLE = {
    width: '3rem',
    minWidth: '3rem',
    height: '3rem',
    padding: 0,
  } as const;
  const TERMINAL_CONTAINER_STYLE = {
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    backgroundColor: 'var(--cds-layer, #f4f4f4)',
    border: '1px solid var(--cds-border-subtle-01, #c6c6c6)',
    borderRadius: 0,
    overflow: 'hidden',
  } as const;
  const TERMINAL_TEXTAREA_STYLE = {
    width: '100%',
    height: '100%',
    minHeight: 0,
    resize: 'none',
    border: 'none',
    outline: 'none',
    backgroundColor: 'var(--cds-layer, #f4f4f4)',
    color: 'var(--cds-text-primary, #161616)',
    caretColor: 'var(--cds-text-primary, #161616)',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    padding: '0.5rem',
    boxSizing: 'border-box',
  } as const;

  const [sending, setSending] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [transcript, setTranscript] = useState('');
  const { output, sendCommand, initialized, isRunning, clearOutput } = useEmulatorConsole();
  const { onProgramGoClick, onProgramStepClick, onRunScriptClick, onProgramStopClick, onComputerResetClick } = useEmulatorActions();

  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputCursorRef = useRef(0);
  const historyIndexRef = useRef<number | null>(null);
  const historyDraftRef = useRef('');

  const busy = isRunning;
  const inputReady = initialized && !busy && !sending;
  const editableStart = useMemo(
    () => transcript.length + (inputReady ? PROMPT.length : 0),
    [transcript, inputReady]
  );
  const terminalValue = useMemo(
    () => (inputReady ? `${transcript}${PROMPT}${commandInput}` : transcript),
    [transcript, commandInput, inputReady]
  );

  const placeCaretAtEnd = useCallback(() => {
    const element = textAreaRef.current;
    if (!element) return;
    const end = element.value.length;
    element.setSelectionRange(end, end);
  }, []);

  const focusTerminalInput = useCallback(() => {
    const element = textAreaRef.current;
    if (!element) return;
    element.focus();
    placeCaretAtEnd();
  }, [placeCaretAtEnd]);

  const scrollTerminalToBottom = () => {
    const element = textAreaRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  };

  useEffect(() => {
    if (output.length < outputCursorRef.current) {
      outputCursorRef.current = 0;
      setTranscript('');
    }
    if (output.length === outputCursorRef.current) return;

    const chunk = output.slice(outputCursorRef.current);
    outputCursorRef.current = output.length;

    if (chunk.length > 0) {
      setTranscript((current) => current + chunk);
    }
  }, [output]);

  useEffect(() => {
    requestAnimationFrame(scrollTerminalToBottom);
  }, [transcript]);

  useEffect(() => {
    if (!inputReady) return;
    focusTerminalInput();
    const timeoutId = window.setTimeout(() => {
      focusTerminalInput();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [inputReady, focusTerminalInput]);

  useEffect(() => {
    if (!sending) return;
    sendTimeoutRef.current = setTimeout(() => {
      setSending(false);
    }, 15000);
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
    };
  }, [sending]);

  const submitCommand = async () => {
    const rawInput = commandInput.trim();
    setCommandInput('');
    historyIndexRef.current = null;
    historyDraftRef.current = '';
    if (!rawInput) return;

    setTranscript((current) => `${current}${PROMPT}${rawInput}\n`);
    const previousHistory = loadCommandHistory();
    const nextHistory = [...previousHistory.filter((item) => item !== rawInput), rawInput]
      .slice(-MAX_COMMAND_HISTORY);
    saveCommandHistory(nextHistory);
    setSending(true);
    try {
      await sendCommand(rawInput);
    } finally {
      setSending(false);
    }
  };

  const handleInputKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget;
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const hasModifier = event.metaKey || event.ctrlKey || event.altKey;

    if (hasModifier) {
      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowUp' ||
        event.key === 'Home' ||
        event.key === 'PageUp'
      ) {
        event.preventDefault();
        element.setSelectionRange(editableStart, editableStart);
        return;
      }
      if (
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown' ||
        event.key === 'End' ||
        event.key === 'PageDown'
      ) {
        event.preventDefault();
        placeCaretAtEnd();
        return;
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      const history = loadCommandHistory();
      if (history.length === 0) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      if (historyIndexRef.current === null) {
        historyDraftRef.current = commandInput;
        historyIndexRef.current = history.length - 1;
      } else {
        historyIndexRef.current = Math.max(0, historyIndexRef.current - 1);
      }
      setCommandInput(history[historyIndexRef.current]);
      return;
    }

    if (event.key === 'ArrowDown') {
      const history = loadCommandHistory();
      if (historyIndexRef.current === null) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      if (historyIndexRef.current < history.length - 1) {
        historyIndexRef.current += 1;
        setCommandInput(history[historyIndexRef.current]);
        return;
      }
      historyIndexRef.current = null;
      setCommandInput(historyDraftRef.current);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      await submitCommand();
      return;
    }

    if (event.key === 'Backspace') {
      if (start <= editableStart && end <= editableStart) {
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Delete') {
      if (start < editableStart || end < editableStart) {
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      element.setSelectionRange(editableStart, editableStart);
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (start <= editableStart && end <= editableStart) {
        event.preventDefault();
        element.setSelectionRange(editableStart, editableStart);
      }
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'End') {
      return;
    }

    if (event.key.length === 1) {
      historyIndexRef.current = null;
      if (start < editableStart || end < editableStart) {
        event.preventDefault();
        placeCaretAtEnd();
      }
      return;
    }

    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
    }
  };

  const handleTextAreaChange = (nextValue: string) => {
    const expectedPrefix = `${transcript}${PROMPT}`;
    if (nextValue.startsWith(expectedPrefix)) {
      setCommandInput(nextValue.slice(expectedPrefix.length));
      historyIndexRef.current = null;
      return;
    }

    const lastLine = nextValue.split('\n').at(-1) ?? '';
    if (lastLine.startsWith(PROMPT)) {
      setCommandInput(lastLine.slice(PROMPT.length));
    } else {
      setCommandInput(lastLine);
    }
    historyIndexRef.current = null;
  };

  const handleGo = async () => {
    if (sending) return;

    setSending(true);
    try {
      await onProgramGoClick();
    } finally {
      setSending(false);
    }
  };

  const handleStep = async () => {
    if (sending || busy || !initialized) return;

    setSending(true);
    try {
      await onProgramStepClick();
    } finally {
      setSending(false);
    }
  };

  const [scriptBrowserOpen, setScriptBrowserOpen] = useState(false);

  const handleChooseScript = async (path: string) => {
    if (sending || busy || !initialized) return;
    setScriptBrowserOpen(false);

    setSending(true);
    try {
      await onRunScriptClick(path);
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    if (sending || busy || !initialized) return;

    setSending(true);
    try {
      await onComputerResetClick();
    } finally {
      setSending(false);
    }
  };

  const handleClearOutput = () => {
    clearOutput();
    setCommandInput('');
    historyIndexRef.current = null;
    historyDraftRef.current = '';
  };

  return (
    <div style={CONSOLE_CONTAINER_STYLE}>
      <div style={TERMINAL_ROW_STYLE}>
        <div style={TERMINAL_SLOT_STYLE}>
          <div style={TERMINAL_CONTAINER_STYLE}>
            <textarea
              id="command"
              ref={textAreaRef}
              className="emulator-console__output"
              value={terminalValue}
              disabled={!inputReady}
              spellCheck={false}
              style={TERMINAL_TEXTAREA_STYLE}
              onFocus={placeCaretAtEnd}
              onKeyDown={handleInputKeyDown}
              onChange={(e) => handleTextAreaChange(e.target.value)}
            />
          </div>
        </div>
        <div style={CONTROL_COLUMN_STYLE}>
          {busy ? (
            <Button
              kind="danger"
              renderIcon={Stop}
              onClick={onProgramStopClick}
              size="lg"
              hasIconOnly
              iconDescription="Stop"
              tooltipPosition="left"
              aria-label="Stop"
              style={ICON_BUTTON_STYLE}
            >
            </Button>
          ) : (
            <Button
              onClick={handleGo}
              disabled={sending}
              size="lg"
              kind="primary"
              className="emulator-console__go"
              renderIcon={Play}
              hasIconOnly
              iconDescription="Go"
              tooltipPosition="left"
              aria-label="Go"
              style={ICON_BUTTON_STYLE}
            >
            </Button>
          )}
          <Button
            onClick={handleStep}
            disabled={!initialized || busy || sending}
            size="lg"
            kind="primary"
            hasIconOnly
            renderIcon={ViewNext}
            iconDescription="Step"
            tooltipPosition="left"
            aria-label="Step"
            style={ICON_BUTTON_STYLE}
          >
          </Button>
          <Button
            onClick={() => setScriptBrowserOpen(true)}
            disabled={!initialized || busy || sending}
            size="lg"
            kind="primary"
            hasIconOnly
            renderIcon={Script}
            iconDescription="Run script"
            tooltipPosition="left"
            aria-label="Run script"
            style={ICON_BUTTON_STYLE}
          >
          </Button>
          <Button
            onClick={handleClearOutput}
            size="lg"
            kind="primary"
            hasIconOnly
            renderIcon={Clean}
            iconDescription="Clear output"
            tooltipPosition="left"
            aria-label="Clear output"
            style={ICON_BUTTON_STYLE}
          >
          </Button>
          <Button
            onClick={handleReset}
            disabled={!initialized || busy || sending}
            size="lg"
            kind="danger"
            hasIconOnly
            renderIcon={Reset}
            iconDescription="Reset"
            tooltipPosition="left"
            aria-label="Reset"
            style={ICON_BUTTON_STYLE}
          >
          </Button>
        </div>
      </div>
      <FilesystemBrowser
        open={scriptBrowserOpen}
        onRequestClose={() => setScriptBrowserOpen(false)}
        onChoose={handleChooseScript}
        modalHeading="Run script"
        rootPaths={['/sw', '/tests', '/tmp']}
        acceptExtensions={['.ini']}
      />
    </div>
  );
}
