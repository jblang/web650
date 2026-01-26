import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import SignDisplay from './SignDisplay';
import DecimalKnob from './DecimalKnob';
import SignKnob from './SignKnob';

interface DisplayRegisterProps {
  value: string; // e.g., "+1234567890"
}

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
    gridTemplateRows: 'auto auto',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
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
    display: 'flex',
    justifyContent: 'center',
  },
  cell: {
    display: 'flex',
    justifyContent: 'center',
  },
};

const DisplayRegister: React.FC<DisplayRegisterProps> = ({ value }) => {
  const sign = value[0] === '-' ? '-' : '+';
  const digitsStr = value.substring(1).padStart(10, '0');
  const digits = digitsStr.split('').map(d => parseInt(d, 10));

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
        {digits.map((digit, i) => (
          <div key={i} style={styles.cell}>
            <DecimalKnob value={digit} />
          </div>
        ))}
      </div>

      <div style={styles.signKnobCell}>
        <SignKnob value={sign} />
      </div>
    </div>
  );
};

export default DisplayRegister;
