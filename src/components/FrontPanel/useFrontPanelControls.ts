import { useEffect } from 'react';
import { useEmulator } from '../EmulatorProvider';
import { OperatingState } from './OperatingStatus';
import { CheckingState } from './CheckingStatus';
import { Programmed, HalfCycle, Overflow } from './ConfigSection';

export const useFrontPanelControls = () => {
  const {
    initialized,
    refreshRegisters,
    displayValue,
    displaySwitch,
    controlSwitch,
    errorSwitch,
    addressSwitches,
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
    onErrorResetClick,
    onErrorSenseResetClick,
    onRestartClick,
    addressRegister,
    operation,
    consoleSwitches,
    programmedStop,
    halfCycle,
    overflowStop,
    operatingState,
    checkingState,
  } = useEmulator();

  const operatingLights: OperatingState = operatingState;
  const checkingLights: CheckingState = checkingState;

  // Ensure front panel reflects emulator state when loaded or when display knob changes.
  useEffect(() => {
    if (!initialized) return;
    void refreshRegisters().catch((err) => console.error('Failed to refresh registers', err));
  }, [initialized, displaySwitch, refreshRegisters]);

  const entryValue = consoleSwitches;
  const addressDisplay = addressRegister;
  const programmed = programmedStop ? Programmed.STOP : Programmed.RUN;
  const halfCycleKnob = halfCycle ? HalfCycle.HALF : HalfCycle.RUN;
  const overflowKnob = overflowStop ? Overflow.STOP : Overflow.SENSE;

  return {
    // Display values
    displayValue,
    entryValue,
    addressDisplay,
    operation,
    operatingState: operatingLights,
    checkingState: checkingLights,
    // Knob positions
    programmed,
    halfCycle: halfCycleKnob,
    addressSelection: addressSwitches,
    control: controlSwitch,
    display: displaySwitch,
    overflow: overflowKnob,
    error: errorSwitch,
    // Handlers
    onEntryValueChange,
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
    onRestartClick,
  };
};
