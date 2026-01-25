import React, { useState } from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import SignDisplay from './SignDisplay';
import DecimalKnob from './DecimalKnob';
import LabeledKnob from './LabeledKnob';

interface FrontPanelProps {
  value: string; // e.g., "+1234567890"
}

const unlitBulb = '⚪';

// Knob position configurations
const STOP_RUN_POS = [{label: 'STOP', angle: -30}, {label: 'RUN', angle: 30}];
const HALF_RUN_POS = [{label: 'HALF', angle: -30}, {label: 'RUN', angle: 30}];
const CONTROL_POS = [{label: 'ADDR STOP', angle: -45}, {label: 'RUN', angle: 0}, {label: 'MANUAL OP', angle: 45}];
const OVERFLOW_POS = [{label: 'STOP', angle: -30}, {label: 'SENSE', angle: 30}];
const ERROR_POS = [{label: 'STOP', angle: -30}, {label: 'SENSE', angle: 30}];
const SIGN_POS = [{label: '-', angle: -30}, {label: '+', angle: 30}];
const DISPLAY_POS = [
  {label: 'LOWER ACCUM', angle: -90},
  {label: 'UPPER ACCUM', angle: -65},
  {label: 'DISTRIBUTOR', angle: -35},
  {label: 'PROGRAM REGISTER', angle: 35},
  {label: 'READ-OUT STORAGE', angle: 65},
  {label: 'READ-IN STORAGE', angle: 90},
];

// Indicator labels
const OPERATING_LABELS = [
  ["DATA ADDRESS", "PROGRAM", "INPUT-OUTPUT"],
  ["INQUIRY", "RAMAC", "MAGNETIC TAPE"],
  ["INST ADDRESS", "ACCUMULATOR", "OVERFLOW"]
];

const CHECKING_LABELS = [
  ["PROGRAM REGISTER", "CONTROL UNIT"],
  ["STORAGE SELECTION", "STORAGE UNIT"],
  ["DISTRIBUTOR", "CLOCKING"],
  ["ACCUMULATOR", "ERROR SENSE"]
];

// Button labels (3 groups of 3)
const BUTTON_GROUPS = [
  ["TRANSFER", "PROGRAM START", "PROGRAM STOP"],
  ["PROGRAM RESET", "COMPUTER RESET", "ACCUM RESET"],
  ["ERROR RESET", "ERROR SENSE RESET", "MASTER POWER"],
];

const styles = {
  container: {
    display: 'inline-grid',
    gridTemplateColumns: 'repeat(10, auto) auto',
    gap: '4px',
  },
  labelBar: {
    gridColumn: '1 / 12',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    backgroundColor: '#002244',
    padding: '4px 0',
  },
  labelDisplay: {
    gridColumn: '1 / 11',
    padding: '0 12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    letterSpacing: '5em',
    textAlign: 'center' as const,
    paddingLeft: '5em',
  },
  labelSign: {
    gridColumn: '11',
    padding: '0 12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    letterSpacing: '0.6em',
    textAlign: 'center' as const,
  },
  digitGroup1: {
    gridColumn: '1 / 3',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
  },
  digitGroup2: {
    gridColumn: '3 / 7',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
  },
  digitGroup3: {
    gridColumn: '7 / 11',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
  },
  signGroup: {
    gridColumn: '11',
    backgroundColor: '#002244',
    padding: '12px',
    display: 'flex',
    justifyContent: 'center',
  },
  knobsRow: {
    gridColumn: '1 / 11',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridTemplateRows: 'auto 1fr',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
    alignItems: 'stretch',
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
  signKnobCell: {
    gridColumn: '11',
    backgroundColor: '#002244',
    padding: '12px',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    justifyContent: 'stretch',
    alignItems: 'stretch',
    gap: '12px',
  },
  cell: {
    display: 'flex',
    justifyContent: 'center',
  },
  operatingBox: {
    gridColumn: '7 / 10', // Span 3 columns
    display: 'grid',
    gridTemplateColumns: 'subgrid', // 3 columns from parent
    gridTemplateRows: 'auto 1fr', // For title and content
    backgroundColor: 'transparent', // As requested
    padding: '12px',
    gap: '12px',
  },
  operatingTitle: {
    gridColumn: 'span 3',
    textAlign: 'center' as const,
    color: '#002244',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    letterSpacing: '1.2em',
    paddingLeft: '1.2em',
  },
  ledColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  ledUnit: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  bulb: {
    textAlign: 'center' as const,
    lineHeight: 1.4,
  },
  ledLabel: {
    color: '#002244',
    fontSize: '8px',
    fontWeight: 'bold' as const,
    whiteSpace: 'nowrap' as const,
  },
  checkingBox: {
    gridColumn: '10 / 12', // Span 2 columns
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridTemplateRows: 'auto 1fr', // Title and content
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
  },
  checkingTitle: {
    gridColumn: 'span 2',
    textAlign: 'center' as const,
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    letterSpacing: '0.6em',
    paddingLeft: '0.6em',
  },
  checkingUnit: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  checkingLabel: {
    color: 'white',
    fontSize: '8px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    whiteSpace: 'pre-wrap' as const,
  },
  finalKnobsRow: {
    gridColumn: '1 / 12',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridTemplateRows: 'auto auto',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
    alignItems: 'end',
  },
  knobLabel: {
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  buttonsRow: {
    gridColumn: '1 / 12',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
    backgroundColor: 'transparent',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0',
    background: 'linear-gradient(to bottom, #888888 0%, #b0b0b0 20%, #d0d0d0 40%, #eeeeee 50%, #d0d0d0 60%, #b0b0b0 80%, #888888 100%)',
    borderRadius: '0',
    padding: '4px',
  },
  button: {
    width: '80px',
    height: '64px',
    background: 'linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 20%, #353535 40%, #404040 50%, #353535 60%, #2a2a2a 80%, #1a1a1a 100%)',
    border: 'none',
    borderLeft: '1px solid #1a1a1a',
    borderRight: '1px solid #3a3a3a',
    borderRadius: '0',
    cursor: 'pointer',
    color: '#e0e0e0',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '4px',
    lineHeight: 1.2,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  buttonRed: {
    width: '80px',
    height: '64px',
    background: 'linear-gradient(to bottom, #aa2222 0%, #cc3333 20%, #dd4444 40%, #ee5555 50%, #dd4444 60%, #cc3333 80%, #aa2222 100%)',
    border: 'none',
    borderLeft: '1px solid #aa2222',
    borderRight: '1px solid #ff5555',
    borderRadius: '0',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '4px',
    lineHeight: 1.2,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  buttonGroupRed: {
    display: 'flex',
    gap: '0',
    background: 'linear-gradient(to bottom, #888888 0%, #b0b0b0 20%, #d0d0d0 40%, #eeeeee 50%, #d0d0d0 60%, #b0b0b0 80%, #888888 100%)',
    borderRadius: '0',
    padding: '4px',
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
      {/* Labels row */}
      <div style={styles.labelBar}>
        <div style={styles.labelDisplay}>DISPLAY</div>
        <div style={styles.labelSign}>SIGN</div>
      </div>

      {/* Digit groups row */}
      <div style={styles.digitGroup1}>
        {digits.slice(0, 2).map((digit, i) => (
          <div key={i} style={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      <div style={styles.digitGroup2}>
        {digits.slice(2, 6).map((digit, i) => (
          <div key={i + 2} style={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      <div style={styles.digitGroup3}>
        {digits.slice(6, 10).map((digit, i) => (
          <div key={i + 6} style={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      <div style={styles.signGroup}>
        <SignDisplay value={sign} />
      </div>

      {/* Knobs row */}
      <div style={styles.knobsRow}>
        <div style={{ gridColumn: '1 / 11', display: 'grid', gridTemplateColumns: 'subgrid', gap: '12px' }}>
          {digits.map((digit, i) => (
            <div key={i} style={styles.cell}>
              <DecimalKnob value={digit} onChange={handleStorageDigitChange(i)} />
            </div>
          ))}
        </div>
        <div style={{ gridColumn: '1 / 11', color: 'white', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2.4em', textAlign: 'center', paddingLeft: '2.4em', alignSelf: 'end' }}>
          STORAGE ⸻ ENTRY
        </div>
      </div>

      <div style={styles.signKnobCell}>
        <div style={styles.cell}>
          <LabeledKnob value={storageSign} positions={SIGN_POS} onChange={setStorageSign} />
        </div>
        <div style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', alignSelf: 'end' }}>
          SIGN
        </div>
      </div>

      {/* Second row of digits - first group (operation code display) */}
      <div style={{ ...styles.digitGroup1, gridTemplateRows: 'auto 1fr' }}>
        <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.2em', paddingLeft: '1.2em' }}>
          OPERATION
        </div>
        {[6, 9].map((digit, i) => (
          <div key={`op-${i}`} style={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      {/* Second row of digits - second group (controlled by address selection knobs) */}
      <div style={{ ...styles.digitGroup2, gridTemplateRows: 'auto 1fr' }}>
        <div style={{ gridColumn: 'span 4', textAlign: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2.4em', paddingLeft: '2.4em' }}>
          ADDRESS
        </div>
        {addressSelection.map((digit, i) => (
          <div key={`addr-${i}`} style={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      {/* Operating Box */}
      <div style={styles.operatingBox}>
        <div style={styles.operatingTitle}>OPERATING</div>
        
        <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: 'subgrid', gap: '12px', paddingTop: '12px' }}>
          {Array.from({ length: 3 }).map((_, colIndex) => (
            <div key={colIndex} style={styles.ledColumn}>
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <div key={rowIndex} style={styles.ledUnit}>
                  <div style={styles.bulb}>{unlitBulb}</div>
                  <div style={styles.ledLabel}>{OPERATING_LABELS[rowIndex][colIndex]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Checking Box */}
      <div style={styles.checkingBox}>
        <div style={styles.checkingTitle}>CHECKING</div>
        
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'subgrid', gap: '12px' }}>
          {Array.from({ length: 2 }).map((_, colIndex) => (
            <div key={colIndex} style={styles.ledColumn}>
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <div key={rowIndex} style={styles.checkingUnit}>
                  <div style={styles.bulb}>{unlitBulb}</div>
                  <div style={styles.checkingLabel}>{CHECKING_LABELS[rowIndex][colIndex]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Final Knobs Row */}
      <div style={styles.finalKnobsRow}>
        <LabeledKnob value={programmed} positions={STOP_RUN_POS} onChange={setProgrammed} />
        <LabeledKnob value={halfCycle} positions={HALF_RUN_POS} onChange={setHalfCycle} />
        <DecimalKnob value={addressSelection[0]} onChange={handleAddressChange(0)} />
        <DecimalKnob value={addressSelection[1]} onChange={handleAddressChange(1)} />
        <DecimalKnob value={addressSelection[2]} onChange={handleAddressChange(2)} />
        <DecimalKnob value={addressSelection[3]} onChange={handleAddressChange(3)} />
        <LabeledKnob value={control} positions={CONTROL_POS} onChange={setControl} />
        <LabeledKnob value={display} positions={DISPLAY_POS} onChange={setDisplay} style={{ gridColumn: 'span 2' }} />
        <LabeledKnob value={overflow} positions={OVERFLOW_POS} onChange={setOverflow} />
        <LabeledKnob value={error} positions={ERROR_POS} onChange={setError} />
        <div style={{ ...styles.knobLabel, gridColumn: '1 / 2' }}>PROGRAMMED</div>
        <div style={{ ...styles.knobLabel, gridColumn: '2 / 3' }}>HALF CYCLE</div>
        <div style={{ ...styles.knobLabel, gridColumn: '3 / 7', letterSpacing: '1.2em' }}>ADDRESS SELECTION</div>
        <div style={{ ...styles.knobLabel, gridColumn: '7 / 8' }}>CONTROL</div>
        <div style={{ ...styles.knobLabel, gridColumn: '8 / 10' }}>DISPLAY</div>
        <div style={{ ...styles.knobLabel, gridColumn: '10 / 11' }}>OVERFLOW</div>
        <div style={{ ...styles.knobLabel, gridColumn: '11 / 12' }}>ERROR</div>
      </div>

      {/* Buttons Row */}
      <div style={styles.buttonsRow}>
        {BUTTON_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex} style={groupIndex === 2 ? styles.buttonGroupRed : styles.buttonGroup}>
            {group.map((label, buttonIndex) => {
              const isRedButton = label === "MASTER POWER";
              return (
                <button key={buttonIndex} style={isRedButton ? styles.buttonRed : styles.button}>
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrontPanel;
