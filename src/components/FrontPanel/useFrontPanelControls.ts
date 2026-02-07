import { useEffect } from 'react';
import { useEmulatorState, INITIAL_OPERATING_STATE, INITIAL_CHECKING_STATE } from '../EmulatorStateProvider';
import { useEmulatorActions } from '../EmulatorActionsProvider';
import { OperatingState } from './OperatingStatus';
import { CheckingState } from './CheckingStatus';
import { Programmed, HalfCycle, Overflow } from '@/lib/simh/i650/controls';

export const useFrontPanelControls = () => {
  const {
    initialized,
    displayValue,
    displaySwitch,
    controlSwitch,
    errorSwitch,
    addressSwitches,
    addressRegister,
    operation,
    stateStreamTick,
    consoleSwitches,
    programmedStop,
    halfCycle,
    overflowStop,
    isRunning,
  } = useEmulatorState();

  const {
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
    onEmulatorResetClick,
  } = useEmulatorActions();

  const operatingLights: OperatingState = {
    ...INITIAL_OPERATING_STATE,
    program: isRunning,
  };
  const checkingLights: CheckingState = INITIAL_CHECKING_STATE;

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
    stateStreamTick,
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
    onEmulatorResetClick,
  };
};
