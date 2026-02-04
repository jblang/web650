import React from 'react';
import { litBulb, unlitBulb } from './FrontPanel';
import styles from './OperatingStatus.module.scss';

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

const OperatingStatus: React.FC<OperatingStatusProps> = ({ state }) => {
  return (
    <div className={styles.operatingBox}>
      <div className={styles.operatingTitle}>OPERATING</div>

      <div className={styles.columnContainer}>
        {Array.from({ length: 3 }).map((_, colIndex) => (
          <div key={colIndex} className={styles.ledColumn}>
            {Array.from({ length: 3 }).map((_, rowIndex) => {
              const config = OPERATING_CONFIG[rowIndex][colIndex];
              const isLit = state[config.key];
              return (
                <div key={rowIndex} className={styles.ledUnit}>
                  <div
                    className={styles.bulb}
                    data-testid={`operating-${config.key}`}
                    data-lit={isLit ? 'true' : 'false'}
                  >
                    {isLit ? litBulb : unlitBulb}
                  </div>
                  <div className={styles.ledLabel}>{config.label}</div>
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
