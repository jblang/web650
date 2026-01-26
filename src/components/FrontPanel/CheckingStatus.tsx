import React from 'react';

const unlitBulb = '⚪';
const litBulb = '🟡';

export interface CheckingState {
  programRegister: boolean;
  controlUnit: boolean;
  storageSelection: boolean;
  storageUnit: boolean;
  distributor: boolean;
  clocking: boolean;
  accumulator: boolean;
  errorSense: boolean;
}

// Indicator labels and corresponding state keys
const CHECKING_CONFIG: Array<Array<{ label: string; key: keyof CheckingState }>> = [
  [
    { label: "PROGRAM REGISTER", key: "programRegister" },
    { label: "CONTROL UNIT", key: "controlUnit" },
  ],
  [
    { label: "STORAGE SELECTION", key: "storageSelection" },
    { label: "STORAGE UNIT", key: "storageUnit" },
  ],
  [
    { label: "DISTRIBUTOR", key: "distributor" },
    { label: "CLOCKING", key: "clocking" },
  ],
  [
    { label: "ACCUMULATOR", key: "accumulator" },
    { label: "ERROR SENSE", key: "errorSense" },
  ],
];

interface CheckingStatusProps {
  state: CheckingState;
}

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

const CheckingStatus: React.FC<CheckingStatusProps> = ({ state }) => {
  return (
    <div style={styles.checkingBox}>
      <div style={styles.checkingTitle}>CHECKING</div>

      <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'subgrid', gap: '12px' }}>
        {Array.from({ length: 2 }).map((_, colIndex) => (
          <div key={colIndex} style={styles.ledColumn}>
            {Array.from({ length: 4 }).map((_, rowIndex) => {
              const config = CHECKING_CONFIG[rowIndex][colIndex];
              const isLit = state[config.key];
              return (
                <div key={rowIndex} style={styles.checkingUnit}>
                  <div style={styles.bulb}>{isLit ? litBulb : unlitBulb}</div>
                  <div style={styles.checkingLabel}>{config.label}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckingStatus;
