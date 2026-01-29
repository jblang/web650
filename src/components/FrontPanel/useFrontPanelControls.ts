import { useEffect, useMemo, useState } from 'react';
import { useEmulator } from '../EmulatorProvider';
import { OperatingState } from './OperatingStatus';
import { CheckingState } from './CheckingStatus';
import { Programmed, HalfCycle, Control, Display, Overflow } from './ConfigSection';

export const useFrontPanelControls = () => {
  const {
    initialized,
    refreshRegisters,
    setBreakpoint,
    deleteBreakpoint,
    go,
    stop,
    reset,
    setProgramRegister,
    setOverflowFlag,
    getDrumLocation,
    setDrumLocation,
    setConsoleSwitches,
    setProgrammedStop,
    setOverflowStop,
    setHalfCycle,
    setAddressRegister,
    displaySwitch,
    setDisplaySwitch,
    controlSwitch,
    setControlSwitch,
    errorSwitch,
    setErrorSwitch,
    addressSwitches,
    setAddressSwitches,
    addressRegister,
    programRegister,
    lowerAccumulator,
    upperAccumulator,
    distributor,
    consoleSwitches,
    programmedStop,
    overflowStop,
    halfCycle,
    restart,
    setLowerAccumulator,
    setUpperAccumulator,
    setDistributor,
  } = useEmulator();

  const [isRunning, setIsRunning] = useState(false);
  const [activeBreakpoint, setActiveBreakpoint] = useState<string | null>(null);

  const operatingLights: OperatingState = useMemo(
    () => ({
      dataAddress: false,
      program: false,
      inputOutput: false,
      inquiry: false,
      ramac: false,
      magneticTape: false,
      instAddress: false,
      accumulator: false,
      overflow: false,
    }),
    []
  );

  const checkingLights: CheckingState = useMemo(
    () => ({
      programRegister: false,
      controlUnit: false,
      storageSelection: false,
      storageUnit: false,
      distributor: false,
      clocking: false,
      accumulator: false,
      errorSense: false,
    }),
    []
  );

  // Prime register snapshot on init
  useEffect(() => {
    if (!initialized) return;
    void (async () => {
      try {
        await refreshRegisters();
      } catch (err) {
        console.error('Failed to refresh registers', err);
      }
    })();
  }, [initialized, refreshRegisters]);

  // Track the last breakpoint we set so we can clean it up when conditions change.
  useEffect(() => {
    if (!initialized) return;
    const maybeClear = async () => {
      if (!activeBreakpoint) return;
      const addressChanged = activeBreakpoint !== addressSwitches;
      const controlChanged = controlSwitch !== Control.ADDRESS_STOP;
      if (addressChanged || controlChanged) {
        await deleteBreakpoint(activeBreakpoint);
        setActiveBreakpoint(null);
      }
    };
    void maybeClear();
  }, [initialized, controlSwitch, addressSwitches, activeBreakpoint, deleteBreakpoint]);

  const displayValue = useMemo(() => {
    if (displaySwitch === Display.LOWER_ACCUM) return lowerAccumulator;
    if (displaySwitch === Display.UPPER_ACCUM) return upperAccumulator;
    if (displaySwitch === Display.DISTRIBUTOR) return distributor;
    if (displaySwitch === Display.PROGRAM_REGISTER) return programRegister;
    if (displaySwitch === Display.READ_OUT_STORAGE) return distributor;
    if (displaySwitch === Display.READ_IN_STORAGE) return distributor;
    return '0000000000+';
  }, [displaySwitch, lowerAccumulator, upperAccumulator, distributor, programRegister]);

  const entryValue = consoleSwitches;
  const addressDisplay = addressRegister;
  const operation = useMemo(() => {
    const digits = programRegister.replace(/[^0-9]/g, '').padEnd(2, '0').slice(0, 2);
    return Number(digits) || 0;
  }, [programRegister]);

  const programmed = programmedStop ? Programmed.STOP : Programmed.RUN;
  const halfCycleKnob = halfCycle ? HalfCycle.HALF : HalfCycle.RUN;
  const overflowKnob = overflowStop ? Overflow.STOP : Overflow.SENSE;

  const handleDrumTransfer = async () => {
    // Use the current address register value for manual drum ops.
    const targetAddress = addressRegister;

    if (displaySwitch === Display.READ_OUT_STORAGE) {
      const value = await getDrumLocation(targetAddress);
      await setDistributor(value);
    } else if (displaySwitch === Display.READ_IN_STORAGE) {
      await setDistributor(consoleSwitches);
      await setDrumLocation(targetAddress, consoleSwitches);
    }
  };

  // Knob change handlers
  const onDisplayChange = (newDisplayValue: number) => {
    setDisplaySwitch(newDisplayValue);
  };

  const onAddressChange = (newAddress: string) => {
    setAddressSwitches(newAddress);
    // If in READ_OUT_STORAGE or READ_IN_STORAGE mode, initiate manual drum operation (only valid in MANUAL)
    if (
      controlSwitch === Control.MANUAL_OP &&
      (displaySwitch === Display.READ_OUT_STORAGE || displaySwitch === Display.READ_IN_STORAGE)
    ) {
      void handleDrumTransfer();
    }
  };

  const onProgrammedChange = async (value: number) => {
    const stopSelected = value === Programmed.STOP;
    await setProgrammedStop(stopSelected);
  };

  const onHalfCycleChange = async (value: number) => {
    const halfSelected = value === HalfCycle.HALF;
    await setHalfCycle(halfSelected);
  };

  const onControlChange = (value: number) => setControlSwitch(value);

  const onOverflowChange = async (value: number) => {
    const stopSelected = value === Overflow.STOP;
    await setOverflowStop(stopSelected);
  };

  const onErrorChange = (value: number) => setErrorSwitch(value);

  // Button click handlers
  const onTransferClick = async () => {
    if (controlSwitch === Control.MANUAL_OP) {
      await setAddressRegister(addressSwitches);
    }
  };

  const clearActiveBreakpoint = async () => {
    if (activeBreakpoint) {
      await deleteBreakpoint(activeBreakpoint);
      setActiveBreakpoint(null);
    }
  };

  const handleProgramStart = async () => {
    await clearActiveBreakpoint();
    if (controlSwitch === Control.ADDRESS_STOP) {
      await setBreakpoint(addressSwitches);
      setActiveBreakpoint(addressSwitches);
    }
    await go();
  };

  const onProgramStartClick = async () => {
    if (isRunning) return; // emulate hardware ignoring start when already running

    if (controlSwitch === Control.MANUAL_OP) {
      await handleDrumTransfer();
    } else {
      await handleProgramStart();
      setIsRunning(true);
    }
  };

  const onProgramStopClick = async () => {
    await stop();
    setIsRunning(false);
  };

  const onProgramResetClick = async () => {
    if (isRunning) {
      await stop();
      setIsRunning(false);
    }
    // Always clear the program register to zeros (blanks = 0)
    await setProgramRegister('00000');

    // Set address register based on control switch position
    const addressValue = controlSwitch === Control.MANUAL_OP ? '0000' : '8000';
    await setAddressRegister(addressValue);

    setIsRunning(false);
  };

  const onComputerResetClick = async () => {
    if (isRunning) {
      await stop();
      setIsRunning(false);
    }
    await reset();
    setIsRunning(false);
  };

  const onAccumResetClick = async () => {
    // Reset distributor and both halves of the accumulator to zeros; leave PR/AR untouched.
    const zeroWord = '0000000000+';
    await Promise.all([
      setDistributor(zeroWord),
      setLowerAccumulator(zeroWord),
      setUpperAccumulator(zeroWord),
      setOverflowFlag('0'),
    ]);
  };
  const onErrorResetClick = () => {};
  const onErrorSenseResetClick = () => {};
  const onRestartClick = async () => {
    await restart();
    setIsRunning(false);
  };

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
    onEntryValueChange: async (newValue: string) => {
      await setConsoleSwitches(newValue);
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
    onRestartClick,
  };
};
