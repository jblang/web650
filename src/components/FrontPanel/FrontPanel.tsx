import React from 'react';
import OperatingStatus, { OperatingState } from './OperatingStatus';
import CheckingStatus, { CheckingState } from './CheckingStatus';
import DisplaySection from './DisplaySection';
import OperationDisplay from './OperationDisplay';
import AddressDisplay from './AddressDisplay';
import EntrySection from './EntrySection';
import ConfigSection from './ConfigSection';
import ControlSection from './ControlSection';
import styles from './FrontPanel.module.scss';
import type {
  DisplayPosition,
  ControlPosition,
  ErrorSwitchPosition,
  ProgrammedPosition,
  HalfCyclePosition,
  OverflowPosition,
} from '@/lib/simh/i650/controls';


export interface FrontPanelProps {
  // Values for displays and lights
  displayValue: string;
  entryValue: string;
  addressDisplay: string;
  operation: string;
  operatingState: OperatingState;
  checkingState: CheckingState;
  programmed: ProgrammedPosition;
  halfCycle: HalfCyclePosition;
  addressSelection: string;
  control: ControlPosition;
  display: DisplayPosition;
  overflow: OverflowPosition;
  error: ErrorSwitchPosition;

  // Callbacks for user interactions
  onEntryValueChange: (value: string) => void | Promise<void>;
  onProgrammedChange: (value: ProgrammedPosition) => void | Promise<void>;
  onHalfCycleChange: (value: HalfCyclePosition) => void | Promise<void>;
  onAddressChange: (value: string) => void | Promise<void>;
  onControlChange: (value: ControlPosition) => void;
  onDisplayChange: (value: DisplayPosition) => void;
  onOverflowChange: (value: OverflowPosition) => void | Promise<void>;
  onErrorChange: (value: ErrorSwitchPosition) => void;

  // Callbacks for control buttons
  onTransferClick?: () => void | Promise<void>;
  onProgramStartClick?: () => void | Promise<void>;
  onProgramStopClick?: () => void | Promise<void>;
  onProgramResetClick?: () => void | Promise<void>;
  onComputerResetClick?: () => void | Promise<void>;
  onAccumResetClick?: () => void | Promise<void>;
  onEmulatorResetClick?: () => void | Promise<void>;
}

const FrontPanel: React.FC<FrontPanelProps> = (props) => {
  return (
    <div className={styles.container}>
      <DisplaySection value={props.displayValue} />

      <EntrySection
        value={props.entryValue}
        onChange={props.onEntryValueChange}
      />

      <OperationDisplay value={props.operation} />
      <AddressDisplay value={props.addressDisplay} />
      <OperatingStatus state={props.operatingState} />
      <CheckingStatus state={props.checkingState} />

      <ConfigSection
        programmed={props.programmed}
        halfCycle={props.halfCycle}
        addressSelection={props.addressSelection}
        control={props.control}
        display={props.display}
        overflow={props.overflow}
        error={props.error}
        onProgrammedChange={props.onProgrammedChange}
        onHalfCycleChange={props.onHalfCycleChange}
        onAddressChange={props.onAddressChange}
        onControlChange={props.onControlChange}
        onDisplayChange={props.onDisplayChange}
        onOverflowChange={props.onOverflowChange}
        onErrorChange={props.onErrorChange}
      />

      <ControlSection
        onTransferClick={props.onTransferClick}
        onProgramStartClick={props.onProgramStartClick}
        onProgramStopClick={props.onProgramStopClick}
        onProgramResetClick={props.onProgramResetClick}
        onComputerResetClick={props.onComputerResetClick}
        onAccumResetClick={props.onAccumResetClick}
        onEmulatorResetClick={props.onEmulatorResetClick}
      />
    </div>
  );
};

export default FrontPanel;
