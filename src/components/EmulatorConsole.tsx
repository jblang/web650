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
  const [sending, setSending] = useState(false);
  const { output, sendCommand } = useEmulator();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (!sending) {
      commandInputRef.current?.focus();
    }
  }, [sending]);

  const handleSend = async () => {
    if (!command.trim() || sending) return;

    setSending(true);
    await sendCommand(command.trim());
    setSending(false);
    setCommand('');
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
            disabled={sending}
            size="lg"
            ref={commandInputRef}
          />
        </div>
        {sending ? (
          <InlineLoading description="Sending..." />
        ) : (
          <Button
            renderIcon={Send}
            onClick={handleSend}
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
