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
import type { DisplayPosition, ControlPosition, ErrorSwitchPosition } from '@/lib/simh/i650/controls';

export const litBulb = '🟡';
export const unlitBulb = '⚫';

export interface FrontPanelProps {
  // Values for displays and lights
  displayValue: string;
  entryValue: string;
  addressDisplay: string;
  operation: string;
  stateStreamTick: number;
  operatingState: OperatingState;
  checkingState: CheckingState;
  programmed: number;
  halfCycle: number;
  addressSelection: string;
  control: ControlPosition;
  display: DisplayPosition;
  overflow: number;
  error: ErrorSwitchPosition;

  // Callbacks for user interactions
  onEntryValueChange: (value: string) => void;
  onProgrammedChange: (value: number) => void;
  onHalfCycleChange: (value: number) => void;
  onAddressChange: (value: string) => void;
  onControlChange: (value: ControlPosition) => void;
  onDisplayChange: (value: DisplayPosition) => void;
  onOverflowChange: (value: number) => void;
  onErrorChange: (value: ErrorSwitchPosition) => void;

  // Callbacks for control buttons
  onTransferClick?: () => void;
  onProgramStartClick?: () => void;
  onProgramStopClick?: () => void;
  onProgramResetClick?: () => void;
  onComputerResetClick?: () => void;
  onAccumResetClick?: () => void;
  onHelpClick?: () => void;
  onCheatClick?: () => void;
  onEmulatorResetClick?: () => void;
}

const FrontPanel: React.FC<FrontPanelProps> = (props) => {
  return (
    <div className={styles.container}>
      <DisplaySection value={props.displayValue} tick={props.stateStreamTick} />

      <EntrySection
        value={props.entryValue}
        onChange={props.onEntryValueChange}
      />

      <OperationDisplay value={props.operation} tick={props.stateStreamTick} />
      <AddressDisplay value={props.addressDisplay} tick={props.stateStreamTick} />
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
        onHelpClick={props.onHelpClick}
        onCheatClick={props.onCheatClick}
        onEmulatorResetClick={props.onEmulatorResetClick}
      />
    </div>
  );
};

export default FrontPanel;
