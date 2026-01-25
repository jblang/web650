import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import SignDisplay from './SignDisplay';

interface DisplaySectionProps {
  digits: number[];
  sign: string;
}

const styles = {
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
  cell: {
    display: 'flex',
    justifyContent: 'center',
  },
};

const DisplaySection: React.FC<DisplaySectionProps> = ({ digits, sign }) => {
  return (
    <>
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
    </>
  );
};

export default DisplaySection;
