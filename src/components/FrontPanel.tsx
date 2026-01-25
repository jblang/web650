import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import SignDisplay from './SignDisplay';
import DecimalKnob from './DecimalKnob';
import LabeledKnob from './LabeledKnob';

interface FrontPanelProps {
  value: string; // e.g., "+1234567890"
}

const unlitBulb = '⚪';

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
      whiteSpace: 'pre-wrap', // To handle long labels with spaces
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
  };

const FrontPanel: React.FC<FrontPanelProps> = ({ value }) => {
  const sign = value[0] === '-' ? '-' : '+';
  const digitsStr = value.substring(1).padStart(10, '0');
  const digits = digitsStr.split('').map(d => parseInt(d, 10));

  const labelsGrid = [
    ["DATA ADDRESS", "PROGRAM", "INPUT-OUTPUT"],
    ["INQUIRY", "RAMAC", "MAGNETIC TAPE"],
    ["INST ADDRESS", "ACCUMULATOR", "OVERFLOW"]
  ];

  const checkingLabels = [
    ["PROGRAM REGISTER", "CONTROL UNIT"],
    ["STORAGE SELECTION", "STORAGE UNIT"],
    ["DISTRIBUTOR", "CLOCKING"],
    ["ACCUMULATOR", "ERROR SENSE"]
  ];

  const stopRunPos = [{label: 'STOP', angle: -30}, {label: 'RUN', angle: 30}];
  const halfRunPos = [{label: 'HALF', angle: -30}, {label: 'RUN', angle: 30}];
  const controlPos = [{label: 'ADDR STOP', angle: -45}, {label: 'RUN', angle: 0}, {label: 'MANUAL OP', angle: 45}];
  const overflowPos = [{label: 'STOP', angle: -30}, {label: 'SENSE', angle: 30}];
  const signPos = [{label: '-', angle: -30}, {label: '+', angle: 30}];
  const displayLabelsPos = [
    {label: 'LOWER ACCUM', angle: -90}, // 9 o'clock
    {label: 'UPPER ACCUM', angle: -65}, // 10 o'clock
    {label: 'DISTRIBUTOR', angle: -35}, // 11 o'clock
    {label: 'PROGRAM REGISTER', angle: 35}, // 1 o'clock
    {label: 'READ-OUT STORAGE', angle: 65}, // 2 o'clock
    {label: 'READ-IN STORAGE', angle: 90}, // 3 o'clock
  ];


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
              <DecimalKnob value={digit} />
            </div>
          ))}
        </div>
        <div style={{ gridColumn: '1 / 11', color: 'white', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2.4em', textAlign: 'center', paddingLeft: '2.4em', alignSelf: 'end' }}>
          STORAGE ⸻ ENTRY
        </div>
      </div>

      <div style={styles.signKnobCell}>
        <div style={styles.cell}>
          <LabeledKnob value={sign === '+' ? 1 : 0} positions={signPos} />
        </div>
        <div style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', alignSelf: 'end' }}>
          SIGN
        </div>
      </div>

      {/* Second row of digits - first group */}
      <div style={{ ...styles.digitGroup1, gridTemplateRows: 'auto 1fr' }}>
        <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.2em', paddingLeft: '1.2em' }}>
          OPERATION
        </div>
        {digits.slice(0, 2).map((digit, i) => (
          <div key={`extra-g1-${i}`} style={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      {/* Second row of digits - second group */}
      <div style={{ ...styles.digitGroup2, gridTemplateRows: 'auto 1fr' }}>
        <div style={{ gridColumn: 'span 4', textAlign: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2.4em', paddingLeft: '2.4em' }}>
          ADDRESS
        </div>
        {digits.slice(2, 6).map((digit, i) => (
          <div key={`extra-g2-${i}`} style={styles.cell}>
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
                  <div style={styles.ledLabel}>{labelsGrid[rowIndex][colIndex]}</div>
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
                  <div style={styles.checkingLabel}>{checkingLabels[rowIndex][colIndex]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Final Knobs Row */}
      <div style={styles.finalKnobsRow}>
        <LabeledKnob value={0} positions={stopRunPos} />
        <LabeledKnob value={0} positions={halfRunPos} />
        <DecimalKnob value={0} />
        <DecimalKnob value={0} />
        <DecimalKnob value={0} />
        <DecimalKnob value={0} />
        <LabeledKnob value={0} positions={controlPos} />
        <LabeledKnob value={0} positions={displayLabelsPos} style={{ gridColumn: 'span 2' }} />
        <LabeledKnob value={0} positions={overflowPos} />
        <LabeledKnob value={0} positions={overflowPos} />
        <div style={{ gridColumn: '1 / 2', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
          PROGRAMMED
        </div>
        <div style={{ gridColumn: '2 / 3', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', paddingLeft: '1.2em' }}>
          HALF CYCLE
        </div>
        <div style={{ gridColumn: '3 / 7', color: 'white', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.2em', textAlign: 'center', paddingLeft: '1.2em' }}>
          ADDRESS SELECTION
        </div>
        <div style={{ gridColumn: '7 / 8', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', paddingLeft: '1.2em' }}>
          CONTROL
        </div>
        <div style={{ gridColumn: '8 / 10', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', paddingLeft: '1.2em' }}>
          DISPLAY
        </div>
        <div style={{ gridColumn: '10 / 11', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', paddingLeft: '1.2em' }}>
          OVERFLOW
        </div>
        <div style={{ gridColumn: '11 / 12', color: 'white', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', paddingLeft: '1.2em' }}>
          ERROR
        </div>
      </div>
    </div>
  );
};

export default FrontPanel;
