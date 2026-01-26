import React from 'react';

interface SignDisplayProps {
  value: '+' | '-';
}

const litBulb = '🟡';
const unlitBulb = '⚪';

const styles = {
  container: {
    display: 'inline-grid',
    gridTemplateColumns: 'auto auto',
    gap: '4px 4px',
    alignItems: 'center',
    fontSize: '14px',
  },
  bulb: {
    textAlign: 'center' as const,
    lineHeight: 1.4,
  },
  sign: {
    textAlign: 'center' as const,
    color: 'white',
  },
  hidden: {
    visibility: 'hidden' as const,
  },
};

const SignDisplay: React.FC<SignDisplayProps> = ({ value }) => {
  const rows = [0, 1, 2, 3, 4];

  return (
    <div style={styles.container}>
      {/* Top row placeholder to align with BiQuinaryDigit */}
      <div style={{ ...styles.bulb, ...styles.hidden }}>{unlitBulb}</div>
      <div></div>

      {/* 5 rows - only show bulbs for + (row 0) and - (row 3) */}
      {rows.map(rowIndex => {
        const isPlus = rowIndex === 0;
        const isMinus = rowIndex === 3;
        const showRow = isPlus || isMinus;

        return (
          <React.Fragment key={rowIndex}>
            <div style={{ ...styles.bulb, ...(showRow ? {} : styles.hidden) }}>
              {isPlus ? (value === '+' ? litBulb : unlitBulb) :
               isMinus ? (value === '-' ? litBulb : unlitBulb) : unlitBulb}
            </div>
            <div style={{ ...styles.sign, ...(showRow ? {} : styles.hidden) }}>
              {isPlus ? '+' : isMinus ? '-' : ''}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SignDisplay;

