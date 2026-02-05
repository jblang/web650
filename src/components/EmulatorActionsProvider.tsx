'use client';

import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { Programmed, HalfCycle, Overflow } from './FrontPanel/ConfigSection';
import * as i650Service from '@/lib/simh/i650/service';
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition } from '@/lib/simh/i650/controls';
import { useEmulatorConsole } from './EmulatorConsoleProvider';

interface EmulatorActionsContextType {
  refreshRegisters: () => Promise<void>;
  onDisplayChange: (value: DisplayPosition) => void;
  onAddressChange: (value: string) => Promise<void>;
  onProgrammedChange: (value: number) => Promise<void>;
  onHalfCycleChange: (value: number) => Promise<void>;
  onControlChange: (value: ControlPosition) => void;
  onOverflowChange: (value: number) => Promise<void>;
  onErrorChange: (value: ErrorSwitchPosition) => void;
  onEntryValueChange: (value: string) => Promise<void>;
  onTransferClick: () => Promise<void>;
  onProgramStartClick: () => Promise<void>;
  onProgramStopClick: () => Promise<void>;
  onProgramResetClick: () => Promise<void>;
  onComputerResetClick: () => Promise<void>;
  onAccumResetClick: () => Promise<void>;
  onHelpClick: () => void;
  onCheatClick: () => void;
  onEmulatorResetClick: () => Promise<void>;
}

const EmulatorActionsContext = createContext<EmulatorActionsContextType | null>(null);

export function useEmulatorActions() {
  const context = useContext(EmulatorActionsContext);
  if (!context) {
    throw new Error('useEmulatorActions must be used within EmulatorActionsProvider');
  }
  return context;
}

export function EmulatorActionsProvider({ children }: { children: ReactNode }) {
  const { clearOutput } = useEmulatorConsole();

  const refreshRegisters = useCallback(() => i650Service.refreshRegisters(), []);

  const onDisplayChange = useCallback((value: DisplayPosition) => {
    i650Service.setDisplaySwitch(value);
  }, []);

  const onAddressChange = useCallback(
    async (value: string) => {
      i650Service.setAddressSwitches(value);
    },
    []
  );

  const onProgrammedChange = useCallback(
    async (value: number) => {
      const stopSelected = value === Programmed.STOP;
      await i650Service.setProgrammedStop(stopSelected);
    },
    []
  );

  const onHalfCycleChange = useCallback(
    async (value: number) => {
      const halfSelected = value === HalfCycle.HALF;
      await i650Service.setHalfCycle(halfSelected);
    },
    []
  );

  const onControlChange = useCallback((value: ControlPosition) => {
    i650Service.setControlSwitch(value);
  }, []);

  const onOverflowChange = useCallback(
    async (value: number) => {
      const stopSelected = value === Overflow.STOP;
      await i650Service.setOverflowStop(stopSelected);
    },
    []
  );

  const onErrorChange = useCallback((value: ErrorSwitchPosition) => {
    i650Service.setErrorSwitch(value);
  }, []);

  const onEntryValueChange = useCallback(
    async (value: string) => {
      await i650Service.setConsoleSwitches(value);
    },
    []
  );

  const onProgramStartClick = useCallback(async () => {
    await i650Service.startProgramOrTransfer();
  }, []);

  const onProgramStopClick = useCallback(async () => {
    await i650Service.stopProgram();
  }, []);

  const onProgramResetClick = useCallback(async () => {
    await i650Service.resetProgram();
  }, []);

  const onComputerResetClick = useCallback(async () => {
    await i650Service.resetComputer();
  }, []);

  const onAccumResetClick = useCallback(async () => {
    await i650Service.resetAccumulator();
  }, []);

  const onTransferClick = useCallback(async () => {
    await i650Service.transferAddress();
  }, []);

  const onEmulatorResetClick = useCallback(async () => {
    clearOutput();
    await i650Service.restart();
  }, [clearOutput]);

  const onHelpClick = useCallback(() => {}, []);

  const onCheatClick = useCallback(() => {}, []);

  const actionsValue = useMemo(
    () => ({
      refreshRegisters,
      onDisplayChange,
      onAddressChange,
      onProgrammedChange,
      onHalfCycleChange,
      onControlChange,
      onOverflowChange,
      onErrorChange,
      onEntryValueChange,
      onTransferClick,
      onProgramStartClick,
      onProgramStopClick,
      onProgramResetClick,
      onComputerResetClick,
      onAccumResetClick,
      onHelpClick,
      onCheatClick,
      onEmulatorResetClick,
    }),
    [
      refreshRegisters,
      onDisplayChange,
      onAddressChange,
      onProgrammedChange,
      onHalfCycleChange,
      onControlChange,
      onOverflowChange,
      onErrorChange,
      onEntryValueChange,
      onTransferClick,
      onProgramStartClick,
      onProgramStopClick,
      onProgramResetClick,
      onComputerResetClick,
      onAccumResetClick,
      onHelpClick,
      onCheatClick,
      onEmulatorResetClick,
    ]
  );

  return <EmulatorActionsContext.Provider value={actionsValue}>{children}</EmulatorActionsContext.Provider>;
}
