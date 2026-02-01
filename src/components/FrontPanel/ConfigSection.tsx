import React from 'react';
import LabeledKnob from './LabeledKnob';
import AddressSelection from './AddressSelection';
import styles from './ConfigSection.module.scss';
import cn from 'classnames';
import { Programmed, HalfCycle, Control, Display, Overflow, ErrorSwitch } from '@/lib/simh';
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition } from '@/lib/simh';

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

// Re-export for backwards compatibility
export { Programmed, HalfCycle, Control, Display, Overflow };
export const Error = ErrorSwitch;

interface ConfigSectionProps {
  // Values
  programmed: number;
  halfCycle: number;
  addressSelection: string;
  control: ControlPosition;
  display: DisplayPosition;
  overflow: number;
  error: ErrorSwitchPosition;
  // Handlers
  onProgrammedChange: (value: number) => void;
  onHalfCycleChange: (value: number) => void;
  onAddressChange: (value: string) => void;
  onControlChange: (value: ControlPosition) => void;
  onDisplayChange: (value: DisplayPosition) => void;
  onOverflowChange: (value: number) => void;
  onErrorChange: (value: ErrorSwitchPosition) => void;
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
      <LabeledKnob position={control} positions={CONTROL_POS} onChange={(pos) => onControlChange(pos as ControlPosition)} labelRadius={48} />
      <LabeledKnob position={display} positions={DISPLAY_POS} onChange={(pos) => onDisplayChange(pos as DisplayPosition)} className={styles.displayKnob} labelRadius={56} />
      <LabeledKnob position={overflow} positions={OVERFLOW_POS} onChange={onOverflowChange} />
      <LabeledKnob position={error} positions={ERROR_POS} onChange={(pos) => onErrorChange(pos as ErrorSwitchPosition)} />
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
