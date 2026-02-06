'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import * as i650Service from '@/lib/simh/i650/service';
import { useEmulatorState } from './EmulatorStateProvider';

interface EmulatorConsoleContextType {
  output: string;
  sendCommand: (command: string) => Promise<string>;
  isRunning: boolean;
  yieldSteps: number;
  setYieldSteps: (steps: number) => void;
  clearOutput: () => void;
}

const EmulatorConsoleContext = createContext<EmulatorConsoleContextType | null>(null);

export function useEmulatorConsole() {
  const context = useContext(EmulatorConsoleContext);
  if (!context) {
    throw new Error('useEmulatorConsole must be used within EmulatorConsoleProvider');
  }
  return context;
}

export function EmulatorConsoleProvider({ children }: { children: ReactNode }) {
  const { isRunning, yieldSteps } = useEmulatorState();
  const [output, setOutput] = useState('');
  const outputBufferRef = useRef('');

  const enqueueOutput = useCallback((text: string) => {
    outputBufferRef.current += text;
  }, []);

  const clearOutput = useCallback(() => {
    outputBufferRef.current = '';
    setOutput('');
  }, []);

  useEffect(() => {
    const flush = () => {
      const chunk = outputBufferRef.current;
      if (!chunk) return;
      outputBufferRef.current = '';
      setOutput((prev) => prev + chunk);
    };

    const id = setInterval(flush, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => i650Service.subscribeOutput(enqueueOutput), [enqueueOutput]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await i650Service.init();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        enqueueOutput(`Error initializing emulator: ${msg}\n`);
      }
    };
    initialize();
  }, [enqueueOutput]);

  const sendCommand = useCallback(
    async (command: string): Promise<string> => {
      const trimmed = command.trim();
      if (!trimmed) return '';

      enqueueOutput(`sim> ${trimmed}\n`);

      try {
        const result = await i650Service.executeCommand(trimmed, { streamOutput: true, echo: false });
        return result;
      } catch {
        // Errors are already printed to the console output stream.
        return '';
      }
    },
    [enqueueOutput]
  );

  const setYieldSteps = useCallback((steps: number) => {
    void i650Service.setYieldSteps(steps);
  }, []);


  const consoleValue = useMemo(
    () => ({
      output,
      sendCommand,
      isRunning,
      yieldSteps,
      setYieldSteps,
      clearOutput,
    }),
    [output, sendCommand, isRunning, yieldSteps, setYieldSteps, clearOutput]
  );

  return <EmulatorConsoleContext.Provider value={consoleValue}>{children}</EmulatorConsoleContext.Provider>;
}
