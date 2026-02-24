'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  ComboBox,
  TextArea,
  Button,
  Stack,
  Checkbox,
} from '@carbon/react';
import { Send, Stop, Play } from '@carbon/icons-react';
import { useEmulatorConsole } from './EmulatorConsoleProvider';
import { useEmulatorActions } from './EmulatorActionsProvider';
import { setDebugEnabled, isDebugEnabled } from '@/lib/simh/debug';

export default function EmulatorConsole() {
  const COMMAND_HISTORY_KEY = 'simh.command-history';
  const MAX_COMMAND_HISTORY = 50;

  type CommandHistoryItem = { id: string; text: string };
  const toHistoryItems = (commands: string[]): CommandHistoryItem[] =>
    commands.map((text, index) => ({ id: `${index}-${text}`, text }));

  const readStoredHistory = (): string[] => {
    if (typeof window === 'undefined') return [];
    const storage = window.localStorage as { getItem?: (key: string) => string | null } | undefined;
    if (!storage?.getItem) return [];
    try {
      const raw = storage.getItem(COMMAND_HISTORY_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value): value is string => typeof value === 'string');
    } catch {
      return [];
    }
  };

  const persistHistory = (commands: string[]) => {
    if (typeof window === 'undefined') return;
    const storage = window.localStorage as { setItem?: (key: string, value: string) => void } | undefined;
    storage?.setItem?.(COMMAND_HISTORY_KEY, JSON.stringify(commands));
  };

  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(() => readStoredHistory());
  const [commandInputResetKey, setCommandInputResetKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [debugEnabled, setDebugEnabledState] = useState(() => isDebugEnabled());
  const { output, sendCommand, isRunning } = useEmulatorConsole();
  const { onProgramStopClick } = useEmulatorActions();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusCommandInput = () => {
    const commandInput = document.getElementById('command') as HTMLInputElement | null;
    commandInput?.focus();
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [output]);

  const busy = isRunning;
  const commandItems = toHistoryItems(commandHistory);

  useEffect(() => {
    if (!busy) {
      focusCommandInput();
    }
  }, [busy]);

  useEffect(() => {
    if (busy) return;
    const timeoutId = window.setTimeout(() => {
      focusCommandInput();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busy, commandInputResetKey]);

  useEffect(() => {
    if (!isRunning && sending) {
      setSending(false);
    }
  }, [isRunning, sending]);

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

  const handleSend = async () => {
    if (!command.trim() || sending) return;

    const trimmed = command.trim();
    setSending(true);
    try {
      await sendCommand(trimmed);
      const nextHistory = [trimmed, ...commandHistory.filter((item) => item !== trimmed)].slice(0, MAX_COMMAND_HISTORY);
      setCommandHistory(nextHistory);
      persistHistory(nextHistory);
    } finally {
      setSending(false);
      setCommand('');
      setCommandInputResetKey((current) => current + 1);
    }
  };

  const handleGo = async () => {
    if (sending) return;

    setSending(true);
    try {
      await sendCommand('go');
    } finally {
      setSending(false);
      setCommand('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDebugToggle = (checked: boolean) => {
    setDebugEnabled(checked);
    setDebugEnabledState(checked);
  };

  return (
    <Stack gap={5}>
      <TextArea
        ref={textAreaRef}
        id="output"
        labelText="Output"
        value={output}
        readOnly
        rows={20}
        className="mono-textarea"
      />
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flexGrow: 1 }}>
          <ComboBox
            key={commandInputResetKey}
            id="command"
            titleText="Command"
            placeholder="Type a command..."
            items={commandItems}
            itemToString={(item) => item?.text ?? ''}
            onInputChange={(value) => setCommand(value ?? '')}
            onChange={({ selectedItem }) => {
              if (selectedItem) {
                setCommand(selectedItem.text);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={busy}
            size="lg"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            renderIcon={Send}
            onClick={handleSend}
            disabled={busy || !command.trim() || sending}
            size="lg"
          >
            Send
          </Button>
          {busy ? (
            <Button
              kind="danger"
              renderIcon={Stop}
              onClick={onProgramStopClick}
              size="lg"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleGo}
              disabled={sending}
              size="lg"
              kind="primary"
              className="emulator-console__go"
              renderIcon={Play}
            >
              Go
            </Button>
          )}
        </div>
      </div>
      <div>
        <Checkbox
          id="simh-debug"
          labelText="Enable SIMH debug logging"
          checked={debugEnabled}
          onChange={(e) => handleDebugToggle((e.target as HTMLInputElement).checked)}
        />
      </div>
    </Stack>
  );
}
