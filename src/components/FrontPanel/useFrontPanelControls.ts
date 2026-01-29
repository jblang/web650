import { useState, useEffect, useCallback } from 'react';
import { useEmulator } from '../EmulatorProvider';
import { OperatingState } from './OperatingStatus';
import { CheckingState } from './CheckingStatus';
import { Programmed, HalfCycle, Control, Display, Overflow } from './ConfigSection';

export const useFrontPanelControls = () => {
  const {
    initialized,
    setBreakpoint,
    deleteBreakpoint,
    go,
    stop,
    reset,
    getLowerAccumulator,
    getUpperAccumulator,
    getDistributor,
    getProgramRegister,
    setProgramRegister,
    setLowerAccumulator,
    setUpperAccumulator,
    setDistributor,
    setOverflowFlag,
    getAllRegisters,
    getDrumLocation,
    setDrumLocation,
    getConsoleSwitches,
    setConsoleSwitches,
    getProgrammedStop,
    setProgrammedStop,
    getOverflowStop,
    setOverflowStop,
    getHalfCycle,
    setHalfCycle,
    getAddressRegister,
    setAddressRegister,
    displaySwitch,
    setDisplaySwitch,
    controlSwitch,
    setControlSwitch,
    errorSwitch,
    setErrorSwitch,
    addressSwitches,
    setAddressSwitches,
    restart,
  } = useEmulator();

  // Lights / indicators
  const [displayLights, setDisplayLights] = useState('0000000000+');
  const [addressLights, setAddressLights] = useState<string>('0000');
  const [operationLights, setOperationLights] = useState(0);
  const [operatingLights] = useState<OperatingState>({
    dataAddress: false, program: false, inputOutput: false, inquiry: false,
    ramac: false, magneticTape: false, instAddress: false, accumulator: false, overflow: false,
  });
  const [checkingLights] = useState<CheckingState>({
    programRegister: false, controlUnit: false, storageSelection: false, storageUnit: false,
    distributor: false, clocking: false, accumulator: false, errorSense: false,
  });

  // Switch positions
  const [programmedSwitch, setProgrammedSwitch] = useState<number>(Programmed.STOP);
  const [halfCycleSwitch, setHalfCycleSwitch] = useState<number>(HalfCycle.RUN);
  const [overflowSwitch, setOverflowSwitch] = useState<number>(Overflow.SENSE);
  const [entrySwitches, setEntrySwitches] = useState('0000000000+');
  const [isRunning, setIsRunning] = useState(false);

  // Fetch register value when display knob changes or emulator initializes
  const refreshDisplay = useCallback(async () => {
    if (!initialized) return;
    if (displaySwitch === Display.LOWER_ACCUM) {
      const value = await getLowerAccumulator();
      setDisplayLights(value);
    } else if (displaySwitch === Display.UPPER_ACCUM) {
      const value = await getUpperAccumulator();
      setDisplayLights(value);
    } else if (displaySwitch === Display.DISTRIBUTOR) {
      const value = await getDistributor();
      setDisplayLights(value);
    } else if (displaySwitch === Display.PROGRAM_REGISTER) {
      const value = await getProgramRegister();
      setDisplayLights(value);
    } else if (displaySwitch === Display.READ_OUT_STORAGE) {
      const value = await getDistributor();
      setDisplayLights(value);
    } else if (displaySwitch === Display.READ_IN_STORAGE) {
      const value = await getDistributor();
      setDisplayLights(value);
    }
  }, [displaySwitch, initialized, getLowerAccumulator, getUpperAccumulator, getDistributor, getProgramRegister]);

  const refreshEntryValue = useCallback(async () => {
    if (!initialized) return;
    const value = await getConsoleSwitches();
    setEntrySwitches(value);
  }, [initialized, getConsoleSwitches]);

  const refreshAddressDisplay = useCallback(async () => {
    if (!initialized) return;
    const raw = await getAddressRegister();
    setAddressLights(raw);
  }, [initialized, getAddressRegister]);

  const refreshOperationRegister = useCallback(async () => {
    if (!initialized) return;
    const pr = await getProgramRegister();
    const digits = pr.replace(/[^0-9]/g, '').padEnd(2, '0').slice(0, 2);
    setOperationLights(Number(digits) || 0);
  }, [initialized, getProgramRegister]);

  const refreshProgrammedSwitch = useCallback(async () => {
    if (!initialized) return;
    const on = await getProgrammedStop();
    setProgrammedSwitch(on ? Programmed.STOP : Programmed.RUN); // emulator 1 = STOP
  }, [initialized, getProgrammedStop]);

  const refreshOverflowSwitch = useCallback(async () => {
    if (!initialized) return;
    const on = await getOverflowStop();
    setOverflowSwitch(on ? Overflow.STOP : Overflow.SENSE); // emulator 1 = STOP
  }, [initialized, getOverflowStop]);

  const refreshHalfCycleSwitch = useCallback(async () => {
    if (!initialized) return;
    const on = await getHalfCycle();
    setHalfCycleSwitch(on ? HalfCycle.HALF : HalfCycle.RUN); // emulator 1 = HALF
  }, [initialized, getHalfCycle]);

  useEffect(() => {
    const run = async () => {
      if (!initialized) return;
      await refreshDisplay();
    };
    void run();
  }, [initialized, refreshDisplay]);

  // Fetch address register on init
  useEffect(() => {
    let cancelled = false;
    if (!initialized) return;

    const run = async () => {
      // bulk fetch to seed initial switch/light state
      const regs = await getAllRegisters();
      if (!cancelled) {
        setAddressLights(regs.AR);
        setEntrySwitches(regs.CSW);
        const digits = regs.PR.replace(/[^0-9]/g, '').padEnd(2, '0').slice(0, 2);
        setOperationLights(Number(digits) || 0);
        setProgrammedSwitch(regs.CSWPS.trim() === '1' ? Programmed.STOP : Programmed.RUN);
        setOverflowSwitch(regs.CSWOS.trim() === '1' ? Overflow.STOP : Overflow.SENSE);
        setHalfCycleSwitch(regs.HALF.trim() === '1' ? HalfCycle.HALF : HalfCycle.RUN);
      }

      if (!cancelled) {
        await refreshAddressDisplay();
        await refreshEntryValue();
        await refreshOperationRegister();
        await refreshProgrammedSwitch();
        await refreshOverflowSwitch();
        await refreshHalfCycleSwitch();
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [initialized, getAllRegisters, refreshAddressDisplay, refreshEntryValue, refreshOperationRegister, refreshProgrammedSwitch, refreshOverflowSwitch, refreshHalfCycleSwitch]);

  useEffect(() => {
    let cancelled = false;
    if (!initialized) return;
    const run = async () => {
      await refreshOperationRegister();
    };
    if (!cancelled) void run();
    return () => {
      cancelled = true;
    };
  }, [initialized, refreshOperationRegister]);

  // Knob change handlers
  const onDisplayChange = (newDisplayValue: number) => {
    setDisplaySwitch(newDisplayValue);
  };

  const onAddressChange = (newAddress: string) => {
    setAddressSwitches(newAddress);
    // If in READ_OUT_STORAGE or READ_IN_STORAGE mode, refresh immediately (only valid in MANUAL)
    if (
      controlSwitch === Control.MANUAL_OP &&
      (displaySwitch === Display.READ_OUT_STORAGE || displaySwitch === Display.READ_IN_STORAGE)
    ) {
      refreshDisplay();
    }
  };

  const onProgrammedChange = async (value: number) => {
    const stopSelected = value === Programmed.STOP;
    await setProgrammedStop(stopSelected);
    setProgrammedSwitch(value);
    await refreshProgrammedSwitch();
  };
  const onHalfCycleChange = async (value: number) => {
    const halfSelected = value === HalfCycle.HALF;
    await setHalfCycle(halfSelected);
    setHalfCycleSwitch(value);
    await refreshHalfCycleSwitch();
  };
  const onControlChange = (value: number) => setControlSwitch(value);
  const onOverflowChange = async (value: number) => {
    const stopSelected = value === Overflow.STOP;
    await setOverflowStop(stopSelected);
    setOverflowSwitch(value);
    await refreshOverflowSwitch();
  };
  const onErrorChange = (value: number) => setErrorSwitch(value);

  // Track the last breakpoint we set so we can clean it up when conditions change.
  const [activeBreakpoint, setActiveBreakpoint] = useState<string | null>(null);

  // Clean up breakpoint when control leaves ADDRESS_STOP or the address changes.
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

  // Button click handlers
  const onTransferClick = async () => {
    if (controlSwitch === Control.MANUAL_OP) {
      await setAddressRegister(addressSwitches);
      await refreshAddressDisplay();
    }
  };
  
  const handleDrumTransfer = async () => {
    // Use the current address register value for manual drum ops.
    const targetAddress = await getAddressRegister();

    if (displaySwitch === Display.READ_OUT_STORAGE) {
      const value = await getDrumLocation(targetAddress);
      await setDistributor(value);
    } else if (displaySwitch === Display.READ_IN_STORAGE) {
      await setDistributor(entrySwitches);
      await setDrumLocation(targetAddress, entrySwitches);
    }

    await refreshDisplay();
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
    setOperationLights(0);

    // Set address register based on control switch position
    const addressValue = controlSwitch === Control.MANUAL_OP ? '0000' : '8000';
    await setAddressRegister(addressValue);
    await refreshAddressDisplay();

    // Update any visible displays that depend on PR/AR
    await refreshDisplay();

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
    await refreshDisplay();
  };
  const onErrorResetClick = () => {};
  const onErrorSenseResetClick = () => {};
  const onRestartClick = async () => {
    await restart();
    setIsRunning(false);
  };

  return {
    // Display values
    displayValue: displayLights,
    entryValue: entrySwitches,
    addressDisplay: addressLights,
    operation: operationLights,
    operatingState: operatingLights,
    checkingState: checkingLights,
    // Knob positions
    programmed: programmedSwitch,
    halfCycle: halfCycleSwitch,
    addressSelection: addressSwitches,
    control: controlSwitch,
    display: displaySwitch,
    overflow: overflowSwitch,
    error: errorSwitch,
    // Handlers
    onEntryValueChange: async (newValue: string) => {
      await setConsoleSwitches(newValue);
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
    onRestartClick,
  };
};
