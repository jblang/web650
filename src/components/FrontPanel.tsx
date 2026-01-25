import React, { useState } from 'react';
import OperatingStatus from './OperatingStatus';
import CheckingStatus from './CheckingStatus';
import DisplaySection from './DisplaySection';
import OperationDisplay from './OperationDisplay';
import AddressDisplay from './AddressDisplay';
import EntrySection from './EntrySection';
import ConfigSection from './ConfigSection';
import ControlSection from './ControlSection';

interface FrontPanelProps {
  value: string; // e.g., "+1234567890"
}

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
  // Parse initial value
  const initialSign = value[0] === '-' ? 0 : 1; // 0 = minus, 1 = plus

  // Storage entry knobs state (initialized to 0-9)
  const [storageDigits, setStorageDigits] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [storageSign, setStorageSign] = useState(initialSign);

  // Final row knobs state
  const [programmed, setProgrammed] = useState(0);
  const [halfCycle, setHalfCycle] = useState(0);
  const [addressSelection, setAddressSelection] = useState([1, 9, 5, 4]);
  const [control, setControl] = useState(0);
  const [display, setDisplay] = useState(0);
  const [overflow, setOverflow] = useState(0);
  const [error, setError] = useState(0);

  // Derived values for display
  const sign = storageSign === 1 ? '+' : '-';
  const digits = storageDigits;

  // Handler for storage digit changes
  const handleStorageDigitChange = (index: number) => (newValue: number) => {
    setStorageDigits(prev => {
      const next = [...prev];
      next[index] = newValue;
      return next;
    });
  };

  // Handler for address selection changes
  const handleAddressChange = (index: number) => (newValue: number) => {
    setAddressSelection(prev => {
      const next = [...prev];
      next[index] = newValue;
      return next;
    });
  };

  return (
    <div style={styles.container}>
      <DisplaySection digits={digits} sign={sign} />

      <EntrySection
        digits={digits}
        storageSign={storageSign}
        onStorageDigitChange={handleStorageDigitChange}
        onSignChange={setStorageSign}
      />

      <OperationDisplay operationDigits={[6, 9]} />
      <AddressDisplay addressDigits={addressSelection} />

      {/* Operating Box */}
      <OperatingStatus />

      {/* Checking Box */}
      <CheckingStatus />

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
        onAddressChange={handleAddressChange}
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
