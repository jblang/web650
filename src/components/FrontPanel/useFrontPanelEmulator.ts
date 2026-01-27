import { useState, useEffect, useCallback } from 'react';
import { useEmulator } from '../EmulatorProvider';
import { OperatingState } from './OperatingStatus';
import { CheckingState } from './CheckingStatus';
import { Programmed, HalfCycle, Control, Display, Overflow, Error } from './ConfigSection';

// Map display knob position to SIMH register name
function getRegisterForDisplay(displayPosition: number, address: string): string {
  switch (displayPosition) {
    case Display.LOWER_ACCUM:
      return 'ACCLO';
    case Display.UPPER_ACCUM:
      return 'ACCUP';
    case Display.DISTRIBUTOR:
      return 'DIST';
    case Display.PROGRAM_REGISTER:
      return 'PR';
    case Display.READ_OUT_STORAGE:
    case Display.READ_IN_STORAGE:
      return address;
    default:
      return 'ACCLO';
  }
}

// Parse EXAMINE output format: "ACCLO:\t 0000000000+." -> "0000000000+"
function parseExamineOutput(output: string): string {
  // Match the value after the colon, handling tabs and spaces
  // Format is: REGISTER:\t VALUE.
  const match = output.match(/:\s+(\d{10}[+-])/);
  return match ? match[1] : '0000000000+';
}

export const useFrontPanelEmulator = () => {
  const { displayValue, addressRegister, sendCommand, examineRegister, refreshAddressRegister, initialized } = useEmulator();

  // Local state for knob positions
  const [programmed, setProgrammed] = useState<number>(Programmed.STOP);
  const [halfCycle, setHalfCycle] = useState<number>(HalfCycle.HALF);
  const [addressSelection, setAddressSelection] = useState<string>('0000');
  const [control, setControl] = useState<number>(Control.RUN);
  const [display, setDisplay] = useState<number>(Display.LOWER_ACCUM);
  const [overflow, setOverflow] = useState<number>(Overflow.STOP);
  const [error, setError] = useState<number>(Error.STOP);
  const [entryValue, setEntryValue] = useState('0000000000+');

  // Placeholder state (will be connected to emulator later)
  const [operation, setOperation] = useState(0);
  const [operatingState] = useState<OperatingState>({
    dataAddress: false, program: false, inputOutput: false, inquiry: false,
    ramac: false, magneticTape: false, instAddress: false, accumulator: false, overflow: false,
  });
  const [checkingState] = useState<CheckingState>({
    programRegister: false, controlUnit: false, storageSelection: false, storageUnit: false,
    distributor: false, clocking: false, accumulator: false, errorSense: false,
  });

  // Fetch register value when display knob changes or emulator initializes
  const refreshDisplay = useCallback(async () => {
    if (!initialized) return;
    const register = getRegisterForDisplay(display, addressSelection);
    await examineRegister(register);
  }, [display, addressSelection, initialized, examineRegister]);

  const refreshEntryValue = useCallback(async () => {
    if (!initialized) return;
    const output = await sendCommand('EXAMINE CSW');
    if (output) {
      const value = parseExamineOutput(output);
      setEntryValue(value);
    }
  }, [initialized, sendCommand]);

  useEffect(() => {
    refreshDisplay();
  }, [refreshDisplay]);

  // Fetch address register on init
  useEffect(() => {
    if (initialized) {
      refreshAddressRegister();
      refreshEntryValue();
    }
  }, [initialized, refreshAddressRegister, refreshEntryValue]);

  // Knob change handlers
  const onDisplayChange = (newDisplayValue: number) => {
    setDisplay(newDisplayValue);
  };

  const onAddressChange = (newAddress: string) => {
    setAddressSelection(newAddress);
    // If in READ_OUT_STORAGE or READ_IN_STORAGE mode, refresh immediately
    if (display === Display.READ_OUT_STORAGE || display === Display.READ_IN_STORAGE) {
      const register = getRegisterForDisplay(display, newAddress);
      examineRegister(register);
    }
  };

  const onProgrammedChange = (value: number) => setProgrammed(value);
  const onHalfCycleChange = (value: number) => setHalfCycle(value);
  const onControlChange = (value: number) => setControl(value);
  const onOverflowChange = (value: number) => setOverflow(value);
  const onErrorChange = (value: number) => setError(value);

  // Button click handlers
  const onTransferClick = async () => {
    await sendCommand(`DEPOSIT AR ${addressSelection}`);
    await refreshAddressRegister();
  };
  const onProgramStartClick = () => {};
  const onProgramStopClick = () => {};
  const onProgramResetClick = () => {};
  const onComputerResetClick = () => {};
  const onAccumResetClick = () => {};
  const onErrorResetClick = () => {};
  const onErrorSenseResetClick = () => {};
  const onMasterPowerClick = () => {};

  return {
    // Display values
    displayValue,
    entryValue,
    addressDisplay: addressRegister,
    operation,
    operatingState,
    checkingState,
    // Knob positions
    programmed,
    halfCycle,
    addressSelection,
    control,
    display,
    overflow,
    error,
    // Handlers
    onEntryValueChange: async (newValue: string) => {
      await sendCommand(`DEPOSIT CSW ${newValue}`);
      await refreshEntryValue();
    },
    onProgrammedChange,
    onHalfCycleChange,
    onAddressChange,
    onControlChange,
    onDisplayChange,
    onOverflowChange,
    onErrorChange,
    // Button handlers
    onTransferClick,
    onProgramStartClick,
    onProgramStopClick,
    onProgramResetClick,
    onComputerResetClick,
    onAccumResetClick,
    onErrorResetClick,
    onErrorSenseResetClick,
    onMasterPowerClick,
  };
};
