'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EmulatorContextType {
  output: string;
  appendOutput: (text: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  initialized: boolean;
}

const EmulatorContext = createContext<EmulatorContextType | null>(null);

export function useEmulator() {
  const context = useContext(EmulatorContext);
  if (!context) {
    throw new Error('useEmulator must be used within an EmulatorProvider');
  }
  return context;
}

export default function EmulatorProvider({ children }: { children: ReactNode }) {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const appendOutput = (text: string) => {
    setOutput((prev) => prev + text);
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
    <EmulatorContext.Provider value={{ output, appendOutput, loading, setLoading, initialized }}>
      {children}
    </EmulatorContext.Provider>
  );
}
