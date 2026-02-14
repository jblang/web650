import React from 'react';
import LabeledKnob from './LabeledKnob';
import AddressSelection from './AddressSelection';
import HelpTarget from './HelpTarget';
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

const PROGRAMMED_SWITCH_HELP = {
  title: 'PROGRAMMED SWITCH',
  description: 'RUN bypasses stop code 01 (treating it like no-op). STOP halts execution whenever a programmed stop code is encountered.',
} as const;

const HALF_CYCLE_SWITCH_HELP = {
  title: 'HALF-CYCLE SWITCH',
  description: 'RUN executes continuously once started. HALF executes one half-cycle per PROGRAM START press (CONTROL must be RUN or ADDRESS STOP): first the data half-cycle, then the instruction half-cycle on the next press.',
} as const;

const ADDRESS_SELECTION_SWITCHES_HELP = {
  title: 'ADDRESS SELECTION SWITCHES',
  description: 'Sets the console address target for ADDRESS STOP and READ-IN/OUT STORAGE operations.\n\nTo start execution at a chosen address, set the address here, set CONTROL to MANUAL, press TRANSFER to load that value into the address register, then set CONTROL to RUN (or ADDRESS STOP) and press PROGRAM START.',
} as const;

const CONTROL_SWITCH_HELP = {
  title: 'CONTROL SWITCH',
  description: 'ADDRESS STOP runs until ADDRESS SELECTION matches the address register, then stops. RUN executes continuously. MANUAL enables console read-in/read-out and is used when loading an address from ADDRESS SELECTION to start at a specific location.',
} as const;

const DISPLAY_SWITCH_DESCRIPTION =
  "Selects LOWER ACCUM, UPPER ACCUM, DISTRIBUTOR, or PROGRAM REGISTER display.\n\n"
  + "READ-OUT STORAGE causes the DISPLAY LIGHTS to show the word at the location indicated by the ADDRESS LIGHTS. "
  + "READ-IN STORAGE writes the value set in the STORAGE ENTRY switches into the location indicated by the ADDRESS LIGHTS.\n\n"
  + "Both STORAGE modes operate only when the CONTROL switch is in MANUAL. Press TRANSFER to set the target location for STORAGE operations using ADDRESS SELECTION.";

const DISPLAY_SWITCH_HELP = {
  title: 'DISPLAY SWITCH',
  description: DISPLAY_SWITCH_DESCRIPTION,
} as const;

const OVERFLOW_SWITCH_HELP = {
  title: 'OVERFLOW SWITCH',
  description: 'STOP halts on overflow. SENSE records overflow without stopping (except quotient overflow), enabling branch-on-overflow handling.',
} as const;

const ERROR_SWITCH_HELP = {
  title: 'ERROR SWITCH',
  description: "As with the CHECKING lights, SIMH does not simulate hardware faults, so this knob doesn't do anything. On a real 650, STOP halts on program-register, accumulator, and distributor validity errors, or on clocking error. SENSE turns on ERROR SENSE, zeros program register, distributor, and accumulator, sets address register to 8000, then takes the next instruction from STORAGE ENTRY switches for recovery logic.",
} as const;

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
  helpEnabled?: boolean;
}

const ControlSection: React.FC<ControlSectionProps> = ({
  programmed, halfCycle, addressSelection, control, display, overflow, error,
  onProgrammedChange, onHalfCycleChange, onAddressChange, onControlChange, onDisplayChange, onOverflowChange, onErrorChange,
  helpEnabled = false,
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
    <div className={cn(styles.finalKnobsRow, { [styles.helpLayer]: helpEnabled })}>
      <div className={styles.programmedCell}>
        <LabeledKnob position={programmed} positions={STOP_RUN_POS} onChange={handleProgrammedChange} testId="programmed-knob" label="Programmed" />
        <HelpTarget
          enabled={helpEnabled}
          title={PROGRAMMED_SWITCH_HELP.title}
          description={PROGRAMMED_SWITCH_HELP.description}
        />
      </div>
      <div className={styles.halfCycleCell}>
        <LabeledKnob position={halfCycle} positions={HALF_RUN_POS} onChange={handleHalfCycleChange} testId="half-cycle-knob" label="Half cycle" />
        <HelpTarget
          enabled={helpEnabled}
          title={HALF_CYCLE_SWITCH_HELP.title}
          description={HALF_CYCLE_SWITCH_HELP.description}
        />
      </div>
      <div className={styles.addressSelectionCell}>
        <AddressSelection value={addressSelection} onChange={onAddressChange} />
        <HelpTarget
          enabled={helpEnabled}
          title={ADDRESS_SELECTION_SWITCHES_HELP.title}
          description={ADDRESS_SELECTION_SWITCHES_HELP.description}
        />
      </div>
      <div className={styles.controlCell}>
        <LabeledKnob position={control} positions={CONTROL_POS} onChange={handleControlChange} matchTwoPositionWidth testId="control-knob" label="Control" />
        <HelpTarget
          enabled={helpEnabled}
          title={CONTROL_SWITCH_HELP.title}
          description={CONTROL_SWITCH_HELP.description}
        />
      </div>
      <div className={styles.displayCell}>
        <LabeledKnob position={display} positions={DISPLAY_POS} onChange={handleDisplayChange} className={styles.displayKnob} testId="display-knob" label="Display" />
        <HelpTarget
          enabled={helpEnabled}
          title={DISPLAY_SWITCH_HELP.title}
          description={DISPLAY_SWITCH_HELP.description}
        />
      </div>
      <div className={styles.overflowCell}>
        <LabeledKnob position={overflow} positions={OVERFLOW_POS} onChange={handleOverflowChange} testId="overflow-knob" label="Overflow" />
        <HelpTarget
          enabled={helpEnabled}
          title={OVERFLOW_SWITCH_HELP.title}
          description={OVERFLOW_SWITCH_HELP.description}
        />
      </div>
      <div className={styles.errorCell}>
        <LabeledKnob position={error} positions={ERROR_POS} onChange={handleErrorChange} testId="error-knob" label="Error" />
        <HelpTarget
          enabled={helpEnabled}
          title={ERROR_SWITCH_HELP.title}
          description={ERROR_SWITCH_HELP.description}
        />
      </div>
      <div className={cn(styles.knobLabel, styles.programmed)}>
        PROGRAMMED
        <HelpTarget
          enabled={helpEnabled}
          title={PROGRAMMED_SWITCH_HELP.title}
          description={PROGRAMMED_SWITCH_HELP.description}
        />
      </div>
      <div className={cn(styles.knobLabel, styles.halfCycle)}>
        HALF CYCLE
        <HelpTarget
          enabled={helpEnabled}
          title={HALF_CYCLE_SWITCH_HELP.title}
          description={HALF_CYCLE_SWITCH_HELP.description}
        />
      </div>
      <div className={cn(styles.knobLabel, styles.addressSelection)}>
        ADDRESS SELECTION
        <HelpTarget
          enabled={helpEnabled}
          title={ADDRESS_SELECTION_SWITCHES_HELP.title}
          description={ADDRESS_SELECTION_SWITCHES_HELP.description}
        />
      </div>
      <div className={cn(styles.knobLabel, styles.control)}>
        CONTROL
        <HelpTarget
          enabled={helpEnabled}
          title={CONTROL_SWITCH_HELP.title}
          description={CONTROL_SWITCH_HELP.description}
        />
      </div>
      <div className={cn(styles.knobLabel, styles.display)}>
        DISPLAY
        <HelpTarget
          enabled={helpEnabled}
          title={DISPLAY_SWITCH_HELP.title}
          description={DISPLAY_SWITCH_HELP.description}
        />
      </div>
      <div className={cn(styles.knobLabel, styles.overflow)}>
        OVERFLOW
        <HelpTarget
          enabled={helpEnabled}
          title={OVERFLOW_SWITCH_HELP.title}
          description={OVERFLOW_SWITCH_HELP.description}
        />
      </div>
      <div className={cn(styles.knobLabel, styles.error)}>
        ERROR
        <HelpTarget
          enabled={helpEnabled}
          title={ERROR_SWITCH_HELP.title}
          description={ERROR_SWITCH_HELP.description}
        />
      </div>
    </div>
  );
};

export default ControlSection;
