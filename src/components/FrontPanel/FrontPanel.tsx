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
export const unlitBulb = '⚫';

export interface FrontPanelProps {
  // Values for displays and lights
  displayValue: string;
  entryValue: string;
  addressDisplay: string;
  operation: string;
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
  onHelpClick?: () => void;
  onCheatClick?: () => void;
  onEmulatorResetClick?: () => void;
}

const styles = {
  container: {
    display: 'inline-grid',
    gridTemplateColumns: 'repeat(10, auto) auto',
    gap: '4px',
    padding: '10px', 
    backgroundColor: '#a6a6a6', // Half-way fallback
    backgroundImage: `
      repeating-linear-gradient(to bottom, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 6%, hsla(0,0%,100%,.08) 7.5%),
      repeating-linear-gradient(to bottom, hsla(0,0%,0%,0) 0%, hsla(0,0%,0%,0) 4%, hsla(0,0%,0%,.04) 4.5%),
      repeating-linear-gradient(to bottom, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 1.2%, hsla(0,0%,100%,.1) 2.2%),
      linear-gradient(0deg, 
        hsl(0,0%,65%) 0%,   /* Mid-dark base */
        hsl(0,0%,72%) 20%, 
        hsl(0,0%,78%) 50%,  /* Balanced highlight */
        hsl(0,0%,72%) 80%, 
        hsl(0,0%,65%) 100%)
    `,
    backgroundSize: '100% 2px, 100% 8px, 100% 12px, 100% 100%',
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.2)', 
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
      onHelpClick={props.onHelpClick}
      onCheatClick={props.onCheatClick}
      onEmulatorResetClick={props.onEmulatorResetClick}
      />
    </div>
  );
};

export default FrontPanel;
