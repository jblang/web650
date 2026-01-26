import React from 'react';

interface BiQuinaryDigitProps {
  value: number; // A single digit from 0-9
}


const litBulb = '🟡';
const unlitBulb = '⚪';

const styles = {
  container: {
    display: 'inline-grid',
    gridTemplateColumns: 'auto auto auto',
    gap: '4px 4px',
    alignItems: 'center',
    fontSize: '14px',
  },
  bulb: {
    textAlign: 'center' as const,
    lineHeight: 1.4,
  },
  number: {
    textAlign: 'center' as const,
    color: 'white',
  },
};

const BiQuinaryDigit: React.FC<BiQuinaryDigitProps> = ({ value }) => {
  const isLeftColumnActive = value >= 0 && value <= 4;
  const isRightColumnActive = value >= 5 && value <= 9;
  const activeRow = value % 5;
  const rows = [0, 1, 2, 3, 4];

  return (
    <div style={styles.container}>
      {/* Bi (0-4 vs 5-9) indicator row */}
      <div style={styles.bulb}>{isLeftColumnActive ? litBulb : unlitBulb}</div>
      <div></div>
      <div style={styles.bulb}>{isRightColumnActive ? litBulb : unlitBulb}</div>

      {/* Quinary (0-4) rows */}
      {rows.map(rowIndex => (
        <React.Fragment key={rowIndex}>
          <div style={styles.number}>{rowIndex}</div>
          <div style={styles.bulb}>{activeRow === rowIndex ? litBulb : unlitBulb}</div>
          <div style={styles.number}>{rowIndex + 5}</div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default BiQuinaryDigit;
