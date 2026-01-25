import React from 'react';

// Button labels (3 groups of 3)
const BUTTON_GROUPS = [
  ["TRANSFER", "PROGRAM START", "PROGRAM STOP"],
  ["PROGRAM RESET", "COMPUTER RESET", "ACCUM RESET"],
  ["ERROR RESET", "ERROR SENSE RESET", "MASTER POWER"],
];

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
    border: 'none',
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
    border: 'none',
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
};

const ControlSection: React.FC = () => {
  return (
    <div style={styles.buttonsRow}>
      {BUTTON_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} style={groupIndex === 2 ? styles.buttonGroupRed : styles.buttonGroup}>
          {group.map((label, buttonIndex) => {
            const isRedButton = label === "MASTER POWER";
            return (
              <button key={buttonIndex} style={isRedButton ? styles.buttonRed : styles.button}>
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
