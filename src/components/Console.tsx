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

export default function Console() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [output]);

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
        setOutput((prev) => prev + data.output);
      } else if (data.error) {
        setOutput((prev) => prev + `Error: ${data.error}\n`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setOutput((prev) => prev + `Error: ${msg}\n`);
    } finally {
      setLoading(false);
      setCommand('');
      commandInputRef.current?.focus();
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
