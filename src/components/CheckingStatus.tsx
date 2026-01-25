import React from 'react';

const unlitBulb = '⚪';

const CHECKING_LABELS = [
  ["PROGRAM REGISTER", "CONTROL UNIT"],
  ["STORAGE SELECTION", "STORAGE UNIT"],
  ["DISTRIBUTOR", "CLOCKING"],
  ["ACCUMULATOR", "ERROR SENSE"]
];

const styles = {
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
  ledColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  checkingUnit: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  bulb: {
    textAlign: 'center' as const,
    lineHeight: 1.4,
  },
  checkingLabel: {
    color: 'white',
    fontSize: '8px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    whiteSpace: 'pre-wrap' as const,
  },
};

const CheckingStatus: React.FC = () => {
  return (
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
  );
};

export default CheckingStatus;
