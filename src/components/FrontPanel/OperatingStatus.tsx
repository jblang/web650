import React from 'react';
import Bulb from './Bulb';
import HelpTarget from './HelpTarget';
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

const OPERATING_HELP_TEXT: Partial<Record<keyof OperatingState, string>> = {
  dataAddress: 'Indicates the data half-cycle is active; if the machine stops with this light on, the data half-cycle is ready to execute.',
  instAddress: 'Indicates the instruction half-cycle is active; if the machine stops with this light on, the instruction half-cycle is ready to execute.',
  program: 'Turns on for programmed, manual, or address-stop conditions (with the documented exceptions for certain read/punch timing cases).',
  accumulator: 'On whenever the accumulator is in use.',
  inputOutput: 'Indicates card input/output activity during applicable read/punch cycles.',
};

interface OperatingStatusProps {
  state: OperatingState;
  helpEnabled?: boolean;
}

const OperatingStatus: React.FC<OperatingStatusProps> = ({ state, helpEnabled = false }) => {
  return (
    <div className={styles.operatingBox} role="group" aria-label="Operating status">
      <div className={styles.operatingTitleWrap}>
        <div className={styles.operatingTitle}>OPERATING</div>
        <HelpTarget
          enabled={helpEnabled}
          title="OPERATING LIGHTS"
          description="Shows machine operating state: half-cycle (data or instruction), and activity in program, accumulator, and I/O units."
        />
      </div>

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
                    <Bulb lit={isLit} label={config.label} />
                  </div>
                  <div className={styles.ledLabel}>{config.label}</div>
                  <HelpTarget
                    enabled={Boolean(helpEnabled && OPERATING_HELP_TEXT[config.key])}
                    title={`${config.label} LIGHT`}
                    description={OPERATING_HELP_TEXT[config.key] ?? ''}
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

export default OperatingStatus;
