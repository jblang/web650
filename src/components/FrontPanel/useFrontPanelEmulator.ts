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

// Parse single-digit switch output, e.g., "CSWPS: 1." -> 1
function parseSwitchOutput(output: string): number {
  const match = output.match(/:\s+(\d)/);
  return match ? parseInt(match[1], 10) : 0;
}

export const useFrontPanelEmulator = () => {
  const { displayValue, addressRegister, sendCommand, examineRegister, refreshAddressRegister, initialized } = useEmulator();

  // Local state for knob positions
  const [programmed, setProgrammed] = useState<number>(Programmed.STOP);
  const [halfCycle, setHalfCycle] = useState<number>(HalfCycle.RUN);
  const [addressSelection, setAddressSelection] = useState<string>('0000');
  const [control, setControl] = useState<number>(Control.RUN);
  const [display, setDisplay] = useState<number>(Display.LOWER_ACCUM);
  const [overflow, setOverflow] = useState<number>(Overflow.SENSE);
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
    const register = getRegisterForDisplay(display, addressRegister);
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

  const refreshProgrammedSwitch = useCallback(async () => {
    if (!initialized) return;
    const output = await sendCommand('EXAMINE CSWPS');
    if (output) {
      const cswpsValue = parseSwitchOutput(output);
      // Invert: emulator 0 is RUN (1), emulator 1 is STOP (0)
      setProgrammed(cswpsValue === 0 ? Programmed.RUN : Programmed.STOP);
    }
  }, [initialized, sendCommand]);

  const refreshOverflowSwitch = useCallback(async () => {
    if (!initialized) return;
    const output = await sendCommand('EXAMINE CSWOS');
    if (output) {
      const cswosValue = parseSwitchOutput(output);
      // Invert: emulator 0 is SENSE (1), emulator 1 is STOP (0)
      setOverflow(cswosValue === 0 ? Overflow.SENSE : Overflow.STOP);
    }
  }, [initialized, sendCommand]);

  const refreshHalfCycleSwitch = useCallback(async () => {
    if (!initialized) return;
    const output = await sendCommand('EXAMINE HALF');
    if (output) {
      const halfValue = parseSwitchOutput(output);
      // Invert: emulator 0 is RUN (1), emulator 1 is HALF (0)
      setHalfCycle(halfValue === 0 ? HalfCycle.RUN : HalfCycle.HALF);
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
      refreshProgrammedSwitch();
      refreshOverflowSwitch();
      refreshHalfCycleSwitch();
    }
  }, [initialized, refreshAddressRegister, refreshEntryValue, refreshProgrammedSwitch, refreshOverflowSwitch, refreshHalfCycleSwitch]);

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

  const onProgrammedChange = async (value: number) => {
    // Invert: RUN (1) deposits 0, STOP (0) deposits 1
    const cswpsValue = value === Programmed.RUN ? 0 : 1;
    await sendCommand(`DEPOSIT CSWPS ${cswpsValue}`);
    await refreshProgrammedSwitch();
  };
  const onHalfCycleChange = async (value: number) => {
    // Invert: RUN (1) deposits 0, HALF (0) deposits 1
    const halfValue = value === HalfCycle.RUN ? 0 : 1;
    await sendCommand(`DEPOSIT HALF ${halfValue}`);
    await refreshHalfCycleSwitch();
  };
  const onControlChange = (value: number) => setControl(value);
  const onOverflowChange = async (value: number) => {
    // Invert: SENSE (1) deposits 0, STOP (0) deposits 1
    const cswosValue = value === Overflow.SENSE ? 0 : 1;
    await sendCommand(`DEPOSIT CSWOS ${cswosValue}`);
    await refreshOverflowSwitch();
  };
  const onErrorChange = (value: number) => setError(value);

  // Effect to manage breakpoints based on Control and Address Selection
  useEffect(() => {
    if (!initialized) return;

    const manageBreakpoint = async () => {
      if (control === Control.ADDRESS_STOP) {
        await sendCommand('NOBREAK'); // Clear existing breakpoints first
        await sendCommand(`BREAK ${addressSelection}`);
      } else {
        await sendCommand('NOBREAK'); // Clear all breakpoints
      }
    };
    manageBreakpoint();
  }, [control, addressSelection, initialized, sendCommand]);

  // Button click handlers
  const onTransferClick = async () => {
    await sendCommand(`DEPOSIT AR ${addressSelection}`);
    await refreshAddressRegister();
  };
  const onProgramStartClick = async () => {
    if (control === Control.MANUAL_OP) {
      await sendCommand('STEP'); // Do not wait for prompt after STEP
    } else {
      await sendCommand('GO', false); // Do not wait for prompt after GO
    }
  };
  const onProgramStopClick = async () => {
    // Send CTRL+E (ASCII 0x05) to the emulator, expecting a prompt but not appending a carriage return.
    await sendCommand('\x05', true, false);
  };
  const onProgramResetClick = () => {};
  const onComputerResetClick = async () => {
    await sendCommand('RESET');
  };
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
