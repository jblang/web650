'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  TextInput,
  TextArea,
  Button,
  InlineLoading,
  Stack,
} from '@carbon/react';
import { Send } from '@carbon/icons-react';
import { useEmulator } from './EmulatorProvider';

export default function EmulatorConsole() {
  const [command, setCommand] = useState('');
  const { output, appendOutput, loading, setLoading } = useEmulator();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (!loading) {
      commandInputRef.current?.focus();
    }
  }, [loading]);

  const sendCommand = async () => {
    if (!command.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim() }),
      });

      const data = await response.json();

      if (data.output) {
        appendOutput(data.output);
      } else if (data.error) {
        appendOutput(`Error: ${data.error}\n`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      appendOutput(`Error: ${msg}\n`);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendCommand();
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
            disabled={loading}
            size="lg"
            ref={commandInputRef}
          />
        </div>
        {loading ? (
          <InlineLoading description="Sending..." />
        ) : (
          <Button
            renderIcon={Send}
            onClick={sendCommand}
            disabled={!command.trim()}
            size="lg"
          >
            Send
          </Button>
        )}
      </div>
    </Stack>
  );
}
