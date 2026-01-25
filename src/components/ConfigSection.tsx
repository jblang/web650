import React from 'react';
import LabeledKnob from './LabeledKnob';
import AddressSelection from './AddressSelection';

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

interface ConfigSectionProps {
  // Values
  programmed: number;
  halfCycle: number;
  addressSelection: number[];
  control: number;
  display: number;
  overflow: number;
  error: number;
  // Handlers
  onProgrammedChange: (value: number) => void;
  onHalfCycleChange: (value: number) => void;
  onAddressChange: (index: number) => (newValue: number) => void;
  onControlChange: (value: number) => void;
  onDisplayChange: (value: number) => void;
  onOverflowChange: (value: number) => void;
  onErrorChange: (value: number) => void;
}

const styles = {
  finalKnobsRow: {
    gridColumn: '1 / 12',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridTemplateRows: 'auto auto',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
    alignItems: 'end',
  },
  knobLabel: {
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
};

const ConfigSection: React.FC<ConfigSectionProps> = ({
  programmed, halfCycle, addressSelection, control, display, overflow, error,
  onProgrammedChange, onHalfCycleChange, onAddressChange, onControlChange, onDisplayChange, onOverflowChange, onErrorChange,
}) => {
  return (
    <div style={styles.finalKnobsRow}>
      <LabeledKnob value={programmed} positions={STOP_RUN_POS} onChange={onProgrammedChange} />
      <LabeledKnob value={halfCycle} positions={HALF_RUN_POS} onChange={onHalfCycleChange} />
      <AddressSelection addressSelection={addressSelection} onAddressChange={onAddressChange} />
      <LabeledKnob value={control} positions={CONTROL_POS} onChange={onControlChange} labelRadius={43} />
      <LabeledKnob value={display} positions={DISPLAY_POS} onChange={onDisplayChange} style={{ gridColumn: 'span 2' }} labelRadius={56} />
      <LabeledKnob value={overflow} positions={OVERFLOW_POS} onChange={onOverflowChange} />
      <LabeledKnob value={error} positions={ERROR_POS} onChange={onErrorChange} />
      <div style={{ ...styles.knobLabel, gridColumn: '1 / 2' }}>PROGRAMMED</div>
      <div style={{ ...styles.knobLabel, gridColumn: '2 / 3' }}>HALF CYCLE</div>
      <div style={{ ...styles.knobLabel, gridColumn: '3 / 7', letterSpacing: '0.6em' }}>ADDRESS SELECTION</div>
      <div style={{ ...styles.knobLabel, gridColumn: '7 / 8' }}>CONTROL</div>
      <div style={{ ...styles.knobLabel, gridColumn: '8 / 10' }}>DISPLAY</div>
      <div style={{ ...styles.knobLabel, gridColumn: '10 / 11' }}>OVERFLOW</div>
      <div style={{ ...styles.knobLabel, gridColumn: '11 / 12' }}>ERROR</div>
    </div>
  );
};

export default ConfigSection;
