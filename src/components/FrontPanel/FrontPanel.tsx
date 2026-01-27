import React from 'react';
import OperatingStatus, { OperatingState } from './OperatingStatus';
import CheckingStatus, { CheckingState } from './CheckingStatus';
import DisplaySection from './DisplaySection';
import OperationDisplay from './OperationDisplay';
import AddressDisplay from './AddressDisplay';
import EntrySection from './EntrySection';
import ConfigSection from './ConfigSection';
import ControlSection from './ControlSection';

export const litBulb = '🟡';
export const unlitBulb = '⚪';

export interface FrontPanelProps {
  // Values for displays and lights
  displayValue: string;
  entryValue: string;
  addressDisplay: string;
  operation: number;
  operatingState: OperatingState;
  checkingState: CheckingState;
  programmed: number;
  halfCycle: number;
  addressSelection: string;
  control: number;
  display: number;
  overflow: number;
  error: number;

  // Callbacks for user interactions
  onEntryValueChange: (value: string) => void;
  onProgrammedChange: (value: number) => void;
  onHalfCycleChange: (value: number) => void;
  onAddressChange: (value: string) => void;
  onControlChange: (value: number) => void;
  onDisplayChange: (value: number) => void;
  onOverflowChange: (value: number) => void;
  onErrorChange: (value: number) => void;

  // Callbacks for control buttons
  onTransferClick?: () => void;
  onProgramStartClick?: () => void;
  onProgramStopClick?: () => void;
  onProgramResetClick?: () => void;
  onComputerResetClick?: () => void;
  onAccumResetClick?: () => void;
  onErrorResetClick?: () => void;
  onErrorSenseResetClick?: () => void;
  onMasterPowerClick?: () => void;
}

const styles = {
  container: {
    display: 'inline-grid',
    gridTemplateColumns: 'repeat(10, auto) auto',
    gap: '4px',
  },
};

const FrontPanel: React.FC<FrontPanelProps> = (props) => {
  return (
    <div style={styles.container}>
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
        onErrorResetClick={props.onErrorResetClick}
        onErrorSenseResetClick={props.onErrorSenseResetClick}
        onMasterPowerClick={props.onMasterPowerClick}
      />
    </div>
  );
};

export default FrontPanel;