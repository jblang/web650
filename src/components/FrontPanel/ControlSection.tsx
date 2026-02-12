import React from 'react';
import LabeledKnob from './LabeledKnob';
import AddressSelection from './AddressSelection';
import styles from './ControlSection.module.scss';
import cn from 'classnames';
import type {
  DisplayPosition,
  ControlPosition,
  ErrorSwitchPosition,
  ProgrammedPosition,
  HalfCyclePosition,
  OverflowPosition,
} from '@/lib/simh/i650/controls';

// Knob position configurations
const STOP_RUN_POS = [{label: 'STOP', angle: -30}, {label: 'RUN', angle: 30}];
const HALF_RUN_POS = [{label: 'HALF', angle: -30}, {label: 'RUN', angle: 30}];
const CONTROL_POS = [{label: 'ADDRESS STOP', angle: -45}, {label: 'RUN', angle: 0}, {label: 'MANUAL OPERATION', angle: 45}];
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

interface ControlSectionProps {
  // Values
  programmed: ProgrammedPosition;
  halfCycle: HalfCyclePosition;
  addressSelection: string;
  control: ControlPosition;
  display: DisplayPosition;
  overflow: OverflowPosition;
  error: ErrorSwitchPosition;
  // Handlers
  onProgrammedChange: (value: ProgrammedPosition) => void | Promise<void>;
  onHalfCycleChange: (value: HalfCyclePosition) => void | Promise<void>;
  onAddressChange: (value: string) => void | Promise<void>;
  onControlChange: (value: ControlPosition) => void | Promise<void>;
  onDisplayChange: (value: DisplayPosition) => void | Promise<void>;
  onOverflowChange: (value: OverflowPosition) => void | Promise<void>;
  onErrorChange: (value: ErrorSwitchPosition) => void | Promise<void>;
}

const ControlSection: React.FC<ControlSectionProps> = ({
  programmed, halfCycle, addressSelection, control, display, overflow, error,
  onProgrammedChange, onHalfCycleChange, onAddressChange, onControlChange, onDisplayChange, onOverflowChange, onErrorChange,
}) => {
  // Helper functions to safely convert knob positions (indices) to typed positions
  // These casts are safe because the positions arrays define exactly the valid range
  const handleProgrammedChange = (pos: number) => {
    if (pos >= 0 && pos < STOP_RUN_POS.length) {
      onProgrammedChange(pos as ProgrammedPosition);
    }
  };

  const handleHalfCycleChange = (pos: number) => {
    if (pos >= 0 && pos < HALF_RUN_POS.length) {
      onHalfCycleChange(pos as HalfCyclePosition);
    }
  };

  const handleControlChange = (pos: number) => {
    if (pos >= 0 && pos < CONTROL_POS.length) {
      onControlChange(pos as ControlPosition);
    }
  };

  const handleDisplayChange = (pos: number) => {
    if (pos >= 0 && pos < DISPLAY_POS.length) {
      onDisplayChange(pos as DisplayPosition);
    }
  };

  const handleOverflowChange = (pos: number) => {
    if (pos >= 0 && pos < OVERFLOW_POS.length) {
      onOverflowChange(pos as OverflowPosition);
    }
  };

  const handleErrorChange = (pos: number) => {
    if (pos >= 0 && pos < ERROR_POS.length) {
      onErrorChange(pos as ErrorSwitchPosition);
    }
  };

  return (
    <div className={styles.finalKnobsRow}>
      <LabeledKnob position={programmed} positions={STOP_RUN_POS} onChange={handleProgrammedChange} testId="programmed-knob" label="Programmed" />
      <LabeledKnob position={halfCycle} positions={HALF_RUN_POS} onChange={handleHalfCycleChange} testId="half-cycle-knob" label="Half cycle" />
      <AddressSelection value={addressSelection} onChange={onAddressChange} />
      <LabeledKnob position={control} positions={CONTROL_POS} onChange={handleControlChange} labelRadius={48} testId="control-knob" label="Control" />
      <LabeledKnob position={display} positions={DISPLAY_POS} onChange={handleDisplayChange} className={styles.displayKnob} labelRadius={56} testId="display-knob" label="Display" />
      <LabeledKnob position={overflow} positions={OVERFLOW_POS} onChange={handleOverflowChange} testId="overflow-knob" label="Overflow" />
      <LabeledKnob position={error} positions={ERROR_POS} onChange={handleErrorChange} testId="error-knob" label="Error" />
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

export default ControlSection;
