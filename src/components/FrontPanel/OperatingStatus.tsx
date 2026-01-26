import React from 'react';

const unlitBulb = '⚪';
const litBulb = '🟡';

export interface OperatingState {
  dataAddress: boolean;
  program: boolean;
  inputOutput: boolean;
  inquiry: boolean;
  ramac: boolean;
  magneticTape: boolean;
  instAddress: boolean;
  accumulator: boolean;
  overflow: boolean;
}

// Indicator labels and corresponding state keys
const OPERATING_CONFIG: Array<Array<{ label: string; key: keyof OperatingState }>> = [
  [
    { label: "DATA ADDRESS", key: "dataAddress" },
    { label: "PROGRAM", key: "program" },
    { label: "INPUT-OUTPUT", key: "inputOutput" },
  ],
  [
    { label: "INQUIRY", key: "inquiry" },
    { label: "RAMAC", key: "ramac" },
    { label: "MAGNETIC TAPE", key: "magneticTape" },
  ],
  [
    { label: "INST ADDRESS", key: "instAddress" },
    { label: "ACCUMULATOR", key: "accumulator" },
    { label: "OVERFLOW", key: "overflow" },
  ],
];

interface OperatingStatusProps {
  state: OperatingState;
}

const styles = {
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
};

const OperatingStatus: React.FC<OperatingStatusProps> = ({ state }) => {
  return (
    <div style={styles.operatingBox}>
      <div style={styles.operatingTitle}>OPERATING</div>

      <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: 'subgrid', gap: '12px', paddingTop: '12px' }}>
        {Array.from({ length: 3 }).map((_, colIndex) => (
          <div key={colIndex} style={styles.ledColumn}>
            {Array.from({ length: 3 }).map((_, rowIndex) => {
              const config = OPERATING_CONFIG[rowIndex][colIndex];
              const isLit = state[config.key];
              return (
                <div key={rowIndex} style={styles.ledUnit}>
                  <div style={styles.bulb}>{isLit ? litBulb : unlitBulb}</div>
                  <div style={styles.ledLabel}>{config.label}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatingStatus;
