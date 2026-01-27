import { useState } from 'react';
import { OperatingState } from './OperatingStatus';
import { CheckingState } from './CheckingStatus';
import { Programmed, HalfCycle, Control, Display, Overflow, Error } from './ConfigSection';

export const useFrontPanelTestMode = () => {
  const [storageEntry, setStorageEntry] = useState<string>('0000000000+');
  const [operation, setOperation] = useState(0);
  const [programmed, setProgrammed] = useState<number>(Programmed.STOP);
  const [halfCycle, setHalfCycle] = useState<number>(HalfCycle.HALF);
  const [addressSelection, setAddressSelection] = useState<string>('0000');
  const [control, setControl] = useState<number>(Control.RUN);
  const [display, setDisplay] = useState<number>(Display.LOWER_ACCUM);
  const [overflow, setOverflow] = useState<number>(Overflow.STOP);
  const [error, setError] = useState<number>(Error.STOP);
  const [overflowCounter, setOverflowCounter] = useState(0);
  const [errorCounter, setErrorCounter] = useState(0);

  // State memory for each operating column's display value
  const [leftColumnDisplay, setLeftColumnDisplay] = useState(0);
  const [middleColumnDisplay, setMiddleColumnDisplay] = useState(0);
  const [rightColumnDisplay, setRightColumnDisplay] = useState(0);

  // Column definitions
  const leftCheckingColumn: Array<keyof CheckingState> = ['programRegister', 'storageSelection', 'distributor', 'accumulator'];
  const rightCheckingColumn: Array<keyof CheckingState> = ['controlUnit', 'storageUnit', 'clocking', 'errorSense'];
  const leftOperatingColumn: Array<keyof OperatingState> = ['dataAddress', 'inquiry', 'instAddress'];
  const middleOperatingColumn: Array<keyof OperatingState> = ['program', 'ramac', 'accumulator'];
  const rightOperatingColumn: Array<keyof OperatingState> = ['inputOutput', 'magneticTape', 'overflow'];

  // Calculate checkingState as derived state
  const checkingState: CheckingState = {
    programRegister: false, controlUnit: false, storageSelection: false, storageUnit: false,
    distributor: false, clocking: false, accumulator: false, errorSense: false,
  };
  leftCheckingColumn.forEach((key, index) => {
    checkingState[key] = (overflowCounter & (1 << index)) !== 0;
  });
  rightCheckingColumn.forEach((key, index) => {
    checkingState[key] = (errorCounter & (1 << index)) !== 0;
  });

  // Calculate operatingState as derived state
  const operatingState: OperatingState = {
    dataAddress: false, program: false, inputOutput: false, inquiry: false, ramac: false,
    magneticTape: false, instAddress: false, accumulator: false, overflow: false,
  };
  leftOperatingColumn.forEach((key, index) => {
    operatingState[key] = (leftColumnDisplay & (1 << index)) !== 0;
  });
  middleOperatingColumn.forEach((key, index) => {
    operatingState[key] = (middleColumnDisplay & (1 << index)) !== 0;
  });
  rightOperatingColumn.forEach((key, index) => {
    operatingState[key] = (rightColumnDisplay & (1 << index)) !== 0;
  });

  // Knob change handlers
  const onProgrammedChange = (newProgrammedValue: number) => {
    setProgrammed(newProgrammedValue);
    setOperation(prevOp => (((Math.floor(prevOp / 10) + 1) % 10) * 10) + (prevOp % 10));
  };

  const onHalfCycleChange = (newHalfCycleValue: number) => {
    setHalfCycle(newHalfCycleValue);
    setOperation(prevOp => (Math.floor(prevOp / 10) * 10) + ((prevOp % 10 + 1) % 10));
  };

  const onOverflowChange = (newOverflowValue: number) => {
    setOverflow(newOverflowValue);
    setOverflowCounter(prev => prev + 1);
  };

  const onErrorChange = (newErrorValue: number) => {
    setError(newErrorValue);
    setErrorCounter(prev => prev + 1);
  };

  const onControlChange = (newControlValue: number) => {
    setControl(newControlValue);
    if (newControlValue === Control.ADDRESS_STOP) {
      setDisplay(leftColumnDisplay);
    } else if (newControlValue === Control.RUN) {
      setDisplay(middleColumnDisplay);
    } else if (newControlValue === Control.MANUAL_OP) {
      setDisplay(rightColumnDisplay);
    }
  };
  
  const onDisplayChange = (newDisplayValue: number) => {
    setDisplay(newDisplayValue);
    if (control === Control.ADDRESS_STOP) {
      setLeftColumnDisplay(newDisplayValue + 1);
    } else if (control === Control.RUN) {
      setMiddleColumnDisplay(newDisplayValue + 1);
    } else if (control === Control.MANUAL_OP) {
      setRightColumnDisplay(newDisplayValue + 1);
    }
  };

  // Button click handlers
  const onTransferClick = () => setStorageEntry('0000000000+');
  const onProgramStartClick = () => {
    setOperation(prevOp => prevOp % 10);
    setProgrammed(Programmed.STOP);
  };
  const onProgramStopClick = () => {
    setOperation(prevOp => Math.floor(prevOp / 10) * 10);
    setHalfCycle(HalfCycle.HALF);
  };
  const onProgramResetClick = () => setAddressSelection('0000');

  const onComputerResetClick = () => {
    setLeftColumnDisplay(0);
    setMiddleColumnDisplay(0);
    setRightColumnDisplay(0);
    setControl(Control.RUN); // Position 1
    setDisplay(0); // Corresponds to middleColumnDisplay after reset
  };

  const onAccumResetClick = () => {
    if (control === Control.ADDRESS_STOP) {
      setLeftColumnDisplay(0);
    } else if (control === Control.RUN) {
      setMiddleColumnDisplay(0);
    } else if (control === Control.MANUAL_OP) {
      setRightColumnDisplay(0);
    }
  };

  const onErrorResetClick = () => {
    setOverflow(Overflow.STOP);
    setOverflowCounter(0);
  };
  
  const onErrorSenseResetClick = () => {
    setError(Error.STOP);
    setErrorCounter(0);
  };

  const onMasterPowerClick = () => {
    onTransferClick();
    onProgramStartClick();
    onProgramStopClick();
    onProgramResetClick();
    onComputerResetClick();
    onAccumResetClick();
    onErrorResetClick();
    onErrorSenseResetClick();
  };

  return {
    storageEntry,
    addressDisplay: addressSelection, // In test mode, knobs control the display
    operation,
    operatingState,
    checkingState,
    programmed,
    halfCycle,
    addressSelection,
    control,
    display,
    overflow,
    error,
    onStorageEntryChange: setStorageEntry,
    onProgrammedChange,
    onHalfCycleChange,
    onAddressChange: setAddressSelection,
    onControlChange,
    onDisplayChange,
    onOverflowChange,
    onErrorChange,
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
