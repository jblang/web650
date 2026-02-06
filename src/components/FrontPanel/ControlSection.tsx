import React, { useState } from 'react';
import styles from './ControlSection.module.scss';
import cn from 'classnames';

// Button labels (3 groups of 3)
const BUTTON_GROUPS = [
  ["TRANSFER", "PROGRAM START", "PROGRAM STOP"],
  ["PROGRAM RESET", "COMPUTER RESET", "ACCUM RESET"],
  ["HELP", "CHEAT", "EMULATOR RESET"],
];

// Prop interface for button callbacks
interface ControlSectionProps {
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

// Mapping from label to prop handler key
const handlerMap: { [key: string]: keyof ControlSectionProps } = {
  "TRANSFER": "onTransferClick",
  "PROGRAM START": "onProgramStartClick",
  "PROGRAM STOP": "onProgramStopClick",
  "PROGRAM RESET": "onProgramResetClick",
  "COMPUTER RESET": "onComputerResetClick",
  "ACCUM RESET": "onAccumResetClick",
  "HELP": "onHelpClick",
  "CHEAT": "onCheatClick",
  "EMULATOR RESET": "onEmulatorResetClick",
};

const ControlSection: React.FC<ControlSectionProps> = (props) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  return (
    <div className={styles.buttonsRow}>
      {BUTTON_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className={cn(styles.buttonGroup, { [styles.red]: groupIndex === 2 })}>
          {group.map((label, buttonIndex) => {
            const isRedButton = label === "EMULATOR RESET";
            const handler = props[handlerMap[label]];
            const isPressed = pressedButton === label;
            return (
              <button
                key={buttonIndex}
                type="button"
                className={cn(styles.button, { [styles.red]: isRedButton, [styles.pressed]: isPressed })}
                onClick={handler}
                onMouseDown={() => setPressedButton(label)}
                onMouseUp={() => setPressedButton(null)}
                onMouseLeave={() => setPressedButton(null)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ControlSection;
