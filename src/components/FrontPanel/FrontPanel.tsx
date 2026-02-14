import React, { useState } from 'react';
import OperatingStatus, { OperatingState } from './OperatingStatus';
import CheckingStatus, { CheckingState } from './CheckingStatus';
import DisplaySection from './DisplaySection';
import OperationDisplay from './OperationDisplay';
import AddressDisplay from './AddressDisplay';
import EntrySection from './EntrySection';
import ControlSection from './ControlSection';
import ButtonSection from './ButtonSection';
import styles from './FrontPanel.module.scss';
import cn from 'classnames';
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
  const [helpEnabled, setHelpEnabled] = useState(false);
  const [showHelpIntroTip, setShowHelpIntroTip] = useState(false);

  const handleHelpToggle = () => {
    setHelpEnabled((enabled) => {
      const nextEnabled = !enabled;
      if (nextEnabled) {
        setShowHelpIntroTip(true);
      }
      if (!nextEnabled) {
        setShowHelpIntroTip(false);
      }
      return nextEnabled;
    });
  };

  return (
    <div className={styles.scrollContainer}>
      <div className={styles.contentWidth}>
        <div className={cn(styles.container, { [styles.helpEnabled]: helpEnabled })}>
          <DisplaySection value={props.displayValue} helpEnabled={helpEnabled} />

          <EntrySection
            value={props.entryValue}
            onChange={props.onEntryValueChange}
            helpEnabled={helpEnabled}
          />

          <OperationDisplay value={props.operation} helpEnabled={helpEnabled} />
          <AddressDisplay value={props.addressDisplay} helpEnabled={helpEnabled} />
          <OperatingStatus state={props.operatingState} helpEnabled={helpEnabled} />
          <CheckingStatus state={props.checkingState} helpEnabled={helpEnabled} />

          <ControlSection
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
            helpEnabled={helpEnabled}
          />

          <ButtonSection
            onTransferClick={props.onTransferClick}
            onProgramStartClick={props.onProgramStartClick}
            onProgramStopClick={props.onProgramStopClick}
            onProgramResetClick={props.onProgramResetClick}
            onComputerResetClick={props.onComputerResetClick}
            onAccumResetClick={props.onAccumResetClick}
            onEmulatorResetClick={props.onEmulatorResetClick}
            onHelpClick={handleHelpToggle}
            helpEnabled={helpEnabled}
            showHelpIntroTip={showHelpIntroTip}
          />
        </div>
      </div>
    </div>
  );
};

export default FrontPanel;
