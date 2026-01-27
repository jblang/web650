'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface EmulatorContextType {
  output: string;
  appendOutput: (text: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  initialized: boolean;
  displayValue: string;
  addressRegister: string;
  sendCommand: (command: string) => Promise<string>;
  examineRegister: (register: string) => Promise<string>;
  refreshAddressRegister: () => Promise<string>;
}

const EmulatorContext = createContext<EmulatorContextType | null>(null);

export function useEmulator() {
  const context = useContext(EmulatorContext);
  if (!context) {
    throw new Error('useEmulator must be used within an EmulatorProvider');
  }
  return context;
}

// Parse EXAMINE output format: "ACCLO:\t 0000000000+." -> "0000000000+"
function parseExamineOutput(output: string): string {
  // Match the value after the colon, handling tabs and spaces
  // Format is: REGISTER:\t VALUE.
  const match = output.match(/:\s+(\d{10}[+-])/);
  return match ? match[1] : '0000000000+';
}

// Parse AR output format: "AR:\t 00000." -> "0000" (last 4 digits)
function parseAddressRegister(output: string): string {
  const match = output.match(/:\s+(\d+)/);
  return match ? match[1].slice(-4).padStart(4, '0') : '0000';
}

export default function EmulatorProvider({ children }: { children: ReactNode }) {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [displayValue, setDisplayValue] = useState('0000000000+');
  const [addressRegister, setAddressRegister] = useState('0000');

  // Command queue to prevent overlapping requests
  const commandQueue = useRef<Promise<unknown>>(Promise.resolve());

  const appendOutput = (text: string) => {
    setOutput((prev) => prev + text);
  };

  const sendCommand = async (command: string): Promise<string> => {
    // Chain onto the command queue to serialize requests
    const result = commandQueue.current.then(async () => {
      try {
        const response = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command }),
        });
        const data = await response.json();
        if (data.output) {
          setOutput((prev) => prev + data.output);
          return data.output;
        } else if (data.error) {
          console.error('Command error:', data.error);
          return '';
        }
      } catch (err) {
        console.error('Command failed:', err);
      }
      return '';
    });
    commandQueue.current = result.catch(() => {});
    return result;
  };

  const examineRegister = async (register: string): Promise<string> => {
    const output = await sendCommand(`EXAMINE ${register}`);
    if (output) {
      const value = parseExamineOutput(output);
      setDisplayValue(value);
      return value;
    }
    return displayValue;
  };

  const refreshAddressRegister = async (): Promise<string> => {
    const output = await sendCommand('EXAMINE AR');
    if (output) {
      const value = parseAddressRegister(output);
      setAddressRegister(value);
      return value;
    }
    return addressRegister;
  };

  useEffect(() => {
    const initEmulator = async () => {
      try {
        const response = await fetch('/api/init', { method: 'POST' });
        const data = await response.json();
        if (data.output) {
          setOutput(data.output);
        } else if (data.error) {
          setOutput(`Error: ${data.error}\n`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setOutput(`Error initializing emulator: ${msg}\n`);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    initEmulator();
  }, []);

  return (
    <EmulatorContext.Provider value={{ output, appendOutput, loading, setLoading, initialized, displayValue, addressRegister, sendCommand, examineRegister, refreshAddressRegister }}>
      {children}
    </EmulatorContext.Provider>
  );
}
