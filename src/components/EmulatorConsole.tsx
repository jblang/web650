'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  TextInput,
  TextArea,
  Button,
  Stack,
} from '@carbon/react';
import { Send, Stop } from '@carbon/icons-react';
import { useEmulatorConsole, useEmulatorActions } from './EmulatorProvider';

export default function EmulatorConsole() {
  const [command, setCommand] = useState('');
  const [sending, setSending] = useState(false);
  const { output, sendCommand, isRunning, yieldSteps, setYieldSteps } = useEmulatorConsole();
  const { onProgramStopClick } = useEmulatorActions();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [output]);

  const busy = isRunning;

  useEffect(() => {
    if (!busy) {
      commandInputRef.current?.focus();
    }
  }, [busy]);

  useEffect(() => {
    if (!isRunning && sending) {
      setSending(false);
    }
  }, [isRunning, sending]);

  useEffect(() => {
    if (!sending) {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
      return;
    }
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

    setSending(true);
    try {
      await sendCommand(command.trim());
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
          <TextInput
            id="command"
            labelText="Command"
            placeholder="Enter SIMH command..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            size="lg"
            ref={commandInputRef}
          />
        </div>
        <div style={{ width: '9rem' }}>
          <TextInput
            id="yield-steps"
            labelText="Yield steps"
            type="number"
            min={1}
            max={100000}
            step={1}
            value={String(yieldSteps)}
            onChange={(e) => setYieldSteps(Number(e.target.value))}
            disabled={busy}
            size="lg"
          />
        </div>
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
            renderIcon={Send}
            onClick={handleSend}
            disabled={!command.trim() || sending}
            size="lg"
          >
            Send
          </Button>
        )}
      </div>
    </Stack>
  );
}
