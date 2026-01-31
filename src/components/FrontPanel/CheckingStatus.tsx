import React from 'react';
import { litBulb, unlitBulb } from './FrontPanel';
import styles from './CheckingStatus.module.scss';

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

const CheckingStatus: React.FC<CheckingStatusProps> = ({ state }) => {
  return (
    <div className={styles.checkingBox}>
      <div className={styles.checkingTitle}>CHECKING</div>

      <div className={styles.columnContainer}>
        {Array.from({ length: 2 }).map((_, colIndex) => (
          <div key={colIndex} className={styles.ledColumn}>
            {Array.from({ length: 4 }).map((_, rowIndex) => {
              const config = CHECKING_CONFIG[rowIndex][colIndex];
              const isLit = state[config.key];
              return (
                <div key={rowIndex} className={styles.checkingUnit}>
                  <div className={styles.bulb}>{isLit ? litBulb : unlitBulb}</div>
                  <div className={styles.checkingLabel}>{config.label}</div>
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
