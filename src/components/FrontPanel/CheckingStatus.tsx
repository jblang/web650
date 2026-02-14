import React from 'react';
import Bulb from './Bulb';
import HelpTarget from './HelpTarget';
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

const CHECKING_HELP_TEXT: Partial<Record<keyof CheckingState, string>> = {
  programRegister: 'Indicates a validity error detected at the output of the program register.',
  storageSelection: 'Indicates storage-selection faults, including invalid addresses, illegal 8000-series store usage, writing to multiple/no locations on store, or invalid manual entry targets.',
  distributor: 'Indicates a validity error detected at the output of the distributor.',
  clocking: 'Indicates a clocking/timing circuitry error.',
  accumulator: 'Indicates a validity error detected at the output of the accumulator.',
  errorSense: 'With ERROR switch in SENSE, this turns on when validity or clocking errors are detected and remains on until reset.',
};

interface CheckingStatusProps {
  state: CheckingState;
  helpEnabled?: boolean;
}

const CheckingStatus: React.FC<CheckingStatusProps> = ({ state, helpEnabled = false }) => {
  return (
    <div className={styles.checkingBox} role="group" aria-label="Checking status">
      <div className={styles.checkingTitleWrap}>
        <div className={styles.checkingTitle}>CHECKING</div>
        <HelpTarget
          enabled={helpEnabled}
          title="CHECKING LIGHTS"
          description="On a real 650, these lights report fault conditions such as validity, storage-selection, distributor, clocking, accumulator, and error-sense events. SIMH does not simulate hardware faults, so if any of these lights ever come on, you should be worried."
        />
      </div>

      <div className={styles.columnContainer}>
        {Array.from({ length: 2 }).map((_, colIndex) => (
          <div key={colIndex} className={styles.ledColumn}>
            {Array.from({ length: 4 }).map((_, rowIndex) => {
              const config = CHECKING_CONFIG[rowIndex][colIndex];
              const isLit = state[config.key];
              return (
                <div key={rowIndex} className={styles.checkingUnit}>
                  <div className={styles.bulb}><Bulb lit={isLit} label={config.label} /></div>
                  <div className={styles.checkingLabel}>{config.label}</div>
                  <HelpTarget
                    enabled={Boolean(helpEnabled && CHECKING_HELP_TEXT[config.key])}
                    title={`${config.label} LIGHT`}
                    description={CHECKING_HELP_TEXT[config.key] ?? ''}
                  />
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
