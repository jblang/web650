import React, { useState } from 'react';

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


const styles = {
  buttonsRow: {
    gridColumn: '1 / 12',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
    backgroundColor: 'transparent',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0',
    background: 'linear-gradient(to bottom, #888888 0%, #b0b0b0 20%, #d0d0d0 40%, #eeeeee 50%, #d0d0d0 60%, #b0b0b0 80%, #888888 100%)',
    borderRadius: '0',
    padding: '4px',
  },
  button: {
    width: '80px',
    height: '64px',
    background: 'linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 20%, #353535 40%, #404040 50%, #353535 60%, #2a2a2a 80%, #1a1a1a 100%)',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: '1px solid #1a1a1a',
    borderRight: '1px solid #3a3a3a',
    borderRadius: '0',
    cursor: 'pointer',
    color: '#e0e0e0',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '4px',
    lineHeight: 1.2,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  buttonRed: {
    width: '80px',
    height: '64px',
    background: 'linear-gradient(to bottom, #aa2222 0%, #cc3333 20%, #dd4444 40%, #ee5555 50%, #dd4444 60%, #cc3333 80%, #aa2222 100%)',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: '1px solid #aa2222',
    borderRight: '1px solid #ff5555',
    borderRadius: '0',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '4px',
    lineHeight: 1.2,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  },
  buttonGroupRed: {
    display: 'flex',
    gap: '0',
    background: 'linear-gradient(to bottom, #888888 0%, #b0b0b0 20%, #d0d0d0 40%, #eeeeee 50%, #d0d0d0 60%, #b0b0b0 80%, #888888 100%)',
    borderRadius: '0',
    padding: '4px',
  },
  buttonPressed: {
    width: '80px',
    height: '64px',
    background: 'linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 20%, #353535 40%, #404040 50%, #353535 60%, #2a2a2a 80%, #1a1a1a 100%)',
    borderTop: '2px solid #0a0a0a',
    borderLeft: '2px solid #0a0a0a',
    borderBottom: '1px solid #3a3a3a',
    borderRight: '1px solid #3a3a3a',
    borderRadius: '0',
    cursor: 'pointer',
    color: '#c0c0c0',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '6px 4px 2px 4px',
    lineHeight: 1.2,
    textShadow: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.3)',
  },
  buttonRedPressed: {
    width: '80px',
    height: '64px',
    background: 'linear-gradient(to bottom, #aa2222 0%, #cc3333 20%, #dd4444 40%, #ee5555 50%, #dd4444 60%, #cc3333 80%, #aa2222 100%)',
    borderTop: '2px solid #661111',
    borderLeft: '2px solid #661111',
    borderBottom: '1px solid #cc4444',
    borderRight: '1px solid #cc4444',
    borderRadius: '0',
    cursor: 'pointer',
    color: '#f0d0d0',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '6px 4px 2px 4px',
    lineHeight: 1.2,
    textShadow: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.3)',
  },
};

const ControlSection: React.FC<ControlSectionProps> = (props) => {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const getButtonStyle = (isRedButton: boolean, isPressed: boolean) => {
    if (isRedButton) {
      return isPressed ? styles.buttonRedPressed : styles.buttonRed;
    }
    return isPressed ? styles.buttonPressed : styles.button;
  };

  return (
    <div style={styles.buttonsRow}>
      {BUTTON_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} style={groupIndex === 2 ? styles.buttonGroupRed : styles.buttonGroup}>
          {group.map((label, buttonIndex) => {
            const isRedButton = label === "EMULATOR RESET";
            const handler = props[handlerMap[label]];
            const isPressed = pressedButton === label;
            return (
              <button
                key={buttonIndex}
                style={getButtonStyle(isRedButton, isPressed)}
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
