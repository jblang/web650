import React, { useState } from 'react';
import styles from './ButtonSection.module.scss';
import cn from 'classnames';
import HelpTarget from './HelpTarget';
import { Toggletip, ToggletipButton, ToggletipContent } from '@carbon/react';

// Button labels (2 groups of 3, 1 group of 3)
const BUTTON_GROUPS = [
  ["TRANSFER", "PROGRAM START", "PROGRAM STOP"],
  ["PROGRAM RESET", "COMPUTER RESET", "ACCUM RESET"],
  ["HELP", "CHEAT", "EMULATOR RESET"],
];

const BUTTON_HELP_TEXT: Record<string, string> = {
  "TRANSFER": "MANUAL mode only. Copies the address from ADDRESS SELECTION into the address register.",
  "PROGRAM START": "With CONTROL in RUN or ADDRESS STOP, starts execution at the current address register location. With HALF CYCLE at HALF, each press advances one half-cycle. It is also pressed as the final step of storage read-in/read-out operations while CONTROL is in MANUAL.",
  "PROGRAM STOP": "Stops the machine at completion of the current half-cycle.",
  "PROGRAM RESET": "Resets the program register to zeros and clears program-register validity, storage-selection, and clocking error circuits. With CONTROL in MANUAL, it blanks the operation and address registers; with CONTROL in RUN or ADDRESS STOP, it blanks the operation register and loads address 8000 into the address register.",
  "COMPUTER RESET": "Resets the program register, distributor, and full accumulator to zeros and clears all error circuits (destroying current distributor, accumulator, and program register contents). With CONTROL in MANUAL, it blanks the operation and address registers; with CONTROL in RUN or ADDRESS STOP, it blanks the operation register and loads address 8000 into the address register.",
  "ACCUM RESET": "Resets distributor and full accumulator to zeros (destroying those contents). Clears overflow, accumulator and distributor validity, clocking, and most storage-selection error circuits, but does not change the program register, operation register, or address register.",
  "HELP": "Toggles help mode. In help mode, click any control to see its function.",
  "CHEAT": "Displays an additional front-panel section with text boxes to allow easy reading and modification of registers and memory locations.",
  "EMULATOR RESET": "Resets emulator state to startup condition. Unlike the similarly situated MASTER POWER switch on a real 650, pressing this button does not require a visit from an IBM customer engineer to get your 650 operational again. Still, it will cause you to lose any unsaved data in the emulator, so don't press it unless you really mean it.",
};

// Prop interface for button callbacks
interface ButtonSectionProps {
  onTransferClick?: () => void;
  onProgramStartClick?: () => void;
  onProgramStopClick?: () => void;
  onProgramResetClick?: () => void;
  onComputerResetClick?: () => void;
  onAccumResetClick?: () => void;
  onEmulatorResetClick?: () => void;
  onHelpClick?: () => void;
  helpEnabled?: boolean;
  showHelpIntroTip?: boolean;
}

type ButtonClickHandlerKey =
  | 'onTransferClick'
  | 'onProgramStartClick'
  | 'onProgramStopClick'
  | 'onProgramResetClick'
  | 'onComputerResetClick'
  | 'onAccumResetClick'
  | 'onHelpClick'
  | 'onEmulatorResetClick';

// Mapping from label to prop handler key
const handlerMap: Record<string, ButtonClickHandlerKey> = {
  "TRANSFER": "onTransferClick",
  "PROGRAM START": "onProgramStartClick",
  "PROGRAM STOP": "onProgramStopClick",
  "PROGRAM RESET": "onProgramResetClick",
  "COMPUTER RESET": "onComputerResetClick",
  "ACCUM RESET": "onAccumResetClick",
  "HELP": "onHelpClick",
  "EMULATOR RESET": "onEmulatorResetClick",
};

const ButtonSection: React.FC<ButtonSectionProps> = (props) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const helpToggleTitle = props.helpEnabled ? 'Toggle help mode off' : 'Toggle help mode on';

  return (
    <div className={cn(styles.buttonsRow, { [styles.helpMode]: props.helpEnabled })}>
      {BUTTON_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className={cn(styles.buttonGroup, { [styles.red]: groupIndex === 2 })}>
          {group.map((label, buttonIndex) => {
            const isRedButton = label === "EMULATOR RESET";
            const isHelpButton = label === "HELP";
            const handler = props[handlerMap[label]];
            const isPressed = pressedButton === label;
            return (
              <div key={buttonIndex} className={styles.buttonWrapper}>
                <button
                  type="button"
                  className={cn(styles.button, {
                    [styles.red]: isRedButton,
                    [styles.pressed]: isPressed,
                    [styles.active]: isHelpButton && props.helpEnabled,
                    [styles.helpToggle]: isHelpButton,
                  })}
                  title={isHelpButton ? helpToggleTitle : undefined}
                  onClick={handler}
                  onMouseDown={() => setPressedButton(label)}
                  onMouseUp={() => setPressedButton(null)}
                  onMouseLeave={() => setPressedButton(null)}
                >
                  {label}
                </button>
                <HelpTarget
                  enabled={Boolean(props.helpEnabled) && !isHelpButton}
                  title={label}
                  description={BUTTON_HELP_TEXT[label]}
                />
                {isHelpButton && props.helpEnabled && props.showHelpIntroTip && (
                  <Toggletip
                    align="left"
                    autoAlign
                    defaultOpen
                    className={styles.helpIntroPopover}
                  >
                    <ToggletipButton
                      className={styles.helpIntroAnchor}
                      label="Help mode instructions"
                      aria-label="Help mode instructions"
                    />
                    <ToggletipContent>
                      <p className={styles.helpIntroTitle}>HELP MODE</p>
                      <p className={styles.helpIntroBody}>Help mode is on. Click anywhere you see a ? cursor to view contextual help. Click HELP again to exit help mode.</p>
                    </ToggletipContent>
                  </Toggletip>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ButtonSection;
