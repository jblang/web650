import React from 'react';
import LabeledKnob from './LabeledKnob';
import AddressSelection from './AddressSelection';
import styles from './ConfigSection.module.scss';
import cn from 'classnames';

// Knob position configurations
const STOP_RUN_POS = [{label: 'STOP', angle: -30}, {label: 'RUN', angle: 30}];
const HALF_RUN_POS = [{label: 'HALF', angle: -30}, {label: 'RUN', angle: 30}];
const CONTROL_POS = [{label: 'ADDRESS STOP', angle: -45}, {label: 'RUN', angle: 0}, {label: 'MANUAL OP', angle: 45}];
const OVERFLOW_POS = [{label: 'STOP', angle: -30}, {label: 'SENSE', angle: 30}];
const ERROR_POS = [{label: 'STOP', angle: -30}, {label: 'SENSE', angle: 30}];
const DISPLAY_POS = [
  {label: 'LOWER ACCUM', angle: -90},
  {label: 'UPPER ACCUM', angle: -65},
  {label: 'DISTRIBUTOR', angle: -35},
  {label: 'PROGRAM REGISTER', angle: 35},
  {label: 'READ‑OUT STORAGE', angle: 65},
  {label: 'READ‑IN STORAGE', angle: 90},
];

// Programmed switch positions
export const Programmed = {
  STOP: 0,
  RUN: 1,
} as const;

// Half Cycle switch positions
export const HalfCycle = {
  HALF: 0,
  RUN: 1,
} as const;

// Control switch positions
export const Control = {
  ADDRESS_STOP: 0,
  RUN: 1,
  MANUAL_OP: 2,
} as const;

// Display switch positions
export const Display = {
  LOWER_ACCUM: 0,
  UPPER_ACCUM: 1,
  DISTRIBUTOR: 2,
  PROGRAM_REGISTER: 3,
  READ_OUT_STORAGE: 4,
  READ_IN_STORAGE: 5,
} as const;

// Overflow switch positions
export const Overflow = {
  STOP: 0,
  SENSE: 1,
} as const;

// Error switch positions
export const Error = {
  STOP: 0,
  SENSE: 1,
} as const;

interface ConfigSectionProps {
  // Values
  programmed: number;
  halfCycle: number;
  addressSelection: string;
  control: number;
  display: number;
  overflow: number;
  error: number;
  // Handlers
  onProgrammedChange: (value: number) => void;
  onHalfCycleChange: (value: number) => void;
  onAddressChange: (value: string) => void;
  onControlChange: (value: number) => void;
  onDisplayChange: (value: number) => void;
  onOverflowChange: (value: number) => void;
  onErrorChange: (value: number) => void;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  programmed, halfCycle, addressSelection, control, display, overflow, error,
  onProgrammedChange, onHalfCycleChange, onAddressChange, onControlChange, onDisplayChange, onOverflowChange, onErrorChange,
}) => {
  return (
    <div className={styles.finalKnobsRow}>
      <LabeledKnob position={programmed} positions={STOP_RUN_POS} onChange={onProgrammedChange} />
      <LabeledKnob position={halfCycle} positions={HALF_RUN_POS} onChange={onHalfCycleChange} />
      <AddressSelection value={addressSelection} onChange={onAddressChange} />
      <LabeledKnob position={control} positions={CONTROL_POS} onChange={onControlChange} labelRadius={48} />
      <LabeledKnob position={display} positions={DISPLAY_POS} onChange={onDisplayChange} className={styles.displayKnob} labelRadius={56} />
      <LabeledKnob position={overflow} positions={OVERFLOW_POS} onChange={onOverflowChange} />
      <LabeledKnob position={error} positions={ERROR_POS} onChange={onErrorChange} />
      <div className={cn(styles.knobLabel, styles.programmed)}>PROGRAMMED</div>
      <div className={cn(styles.knobLabel, styles.halfCycle)}>HALF CYCLE</div>
      <div className={cn(styles.knobLabel, styles.addressSelection)}>ADDRESS SELECTION</div>
      <div className={cn(styles.knobLabel, styles.control)}>CONTROL</div>
      <div className={cn(styles.knobLabel, styles.display)}>DISPLAY</div>
      <div className={cn(styles.knobLabel, styles.overflow)}>OVERFLOW</div>
      <div className={cn(styles.knobLabel, styles.error)}>ERROR</div>
    </div>
  );
};

export default ConfigSection;
