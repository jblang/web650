import React, { useState } from 'react';
import OperatingStatus, { OperatingState } from './OperatingStatus';
import CheckingStatus, { CheckingState } from './CheckingStatus';
import DisplaySection from './DisplaySection';
import OperationDisplay from './OperationDisplay';
import AddressDisplay from './AddressDisplay';
import EntrySection from './EntrySection';
import ConfigSection from './ConfigSection';
import ControlSection from './ControlSection';

interface FrontPanelProps {
  value: string; // e.g., "+1234567890"
}

// Programmed switch positions
const Programmed = {
  STOP: 0,
  RUN: 1,
} as const;

// Half Cycle switch positions
const HalfCycle = {
  HALF: 0,
  RUN: 1,
} as const;

// Control switch positions
const Control = {
  ADDRESS_STOP: 0,
  RUN: 1,
  MANUAL_OP: 2,
} as const;

// Display switch positions
const Display = {
  LOWER_ACCUM: 0,
  UPPER_ACCUM: 1,
  DISTRIBUTOR: 2,
  PROGRAM_REGISTER: 3,
  READ_OUT_STORAGE: 4,
  READ_IN_STORAGE: 5,
} as const;

// Overflow switch positions
const Overflow = {
  STOP: 0,
  SENSE: 1,
} as const;

// Error switch positions
const Error = {
  STOP: 0,
  SENSE: 1,
} as const;

const styles = {
  container: {
    display: 'inline-grid',
    gridTemplateColumns: 'repeat(10, auto) auto',
    gap: '4px',
  },
  storageEntryLabel: {
    gridColumn: '1 / -1',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    letterSpacing: '0.3em',
    textAlign: 'center' as const,
    paddingTop: '4px',
  },
  cell: {
    display: 'flex',
    justifyContent: 'center',
  },
};

const FrontPanel: React.FC<FrontPanelProps> = ({ value }) => {
  // Storage entry state as a single integer
  const [storageEntry, setStorageEntry] = useState(0);

  // Operation code display (read-only for now)
  const [operation, setOperation] = useState(0);

  // Status indicator lights
  const [operatingState, setOperatingState] = useState<OperatingState>({
    dataAddress: false,
    program: false,
    inputOutput: false,
    inquiry: false,
    ramac: false,
    magneticTape: false,
    instAddress: false,
    accumulator: false,
    overflow: false,
  });

  const [checkingState, setCheckingState] = useState<CheckingState>({
    programRegister: false,
    controlUnit: false,
    storageSelection: false,
    storageUnit: false,
    distributor: false,
    clocking: false,
    accumulator: false,
    errorSense: false,
  });

  // Final row knobs state
  const [programmed, setProgrammed] = useState<number>(Programmed.STOP);
  const [halfCycle, setHalfCycle] = useState<number>(HalfCycle.HALF);
  const [addressSelection, setAddressSelection] = useState(0);
  const [control, setControl] = useState<number>(Control.RUN);
  const [display, setDisplay] = useState<number>(Display.LOWER_ACCUM);
  const [overflow, setOverflow] = useState<number>(Overflow.STOP);
  const [error, setError] = useState<number>(Error.STOP);

  return (
    <div style={styles.container}>
      <DisplaySection value={storageEntry} />

      <EntrySection
        value={storageEntry}
        onChange={setStorageEntry}
      />

      <OperationDisplay value={operation} />
      <AddressDisplay value={addressSelection} />

      {/* Operating Box */}
      <OperatingStatus state={operatingState} />

      {/* Checking Box */}
      <CheckingStatus state={checkingState} />

      <ConfigSection
        programmed={programmed}
        halfCycle={halfCycle}
        addressSelection={addressSelection}
        control={control}
        display={display}
        overflow={overflow}
        error={error}
        onProgrammedChange={setProgrammed}
        onHalfCycleChange={setHalfCycle}
        onAddressChange={setAddressSelection}
        onControlChange={setControl}
        onDisplayChange={setDisplay}
        onOverflowChange={setOverflow}
        onErrorChange={setError}
      />

      <ControlSection />
    </div>
  );
};

export default FrontPanel;
