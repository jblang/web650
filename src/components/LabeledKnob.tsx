import React, { useId } from 'react';

interface KnobPosition {
  label: string;
  angle: number;
}

interface LabeledKnobProps {
  value: number; // The index of the current position
  positions: KnobPosition[];
  onChange?: (value: number) => void;
  bottomLabel?: string;
  style?: React.CSSProperties;
  labelRadius?: number;
}

const styles = {
  container: {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  knobContainer: {
    position: 'relative' as const,
    width: '82.34px',
    height: '68px',
  },
  label: {
    position: 'absolute' as const,
    color: 'white',
    fontSize: '10px',
    fontFamily: 'monospace',
    fontWeight: 'bold' as const,
    transform: 'translate(-50%, -50%)',
    whiteSpace: 'normal' as const,
    width: '50px', // Adjust as needed
    textAlign: 'center' as const,
  },
  knobWrapper: {
    position: 'absolute' as const,
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    cursor: 'pointer',
  },
  bottomLabel: {
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    letterSpacing: '0.3em',
    textAlign: 'center' as const,
  },
};

const LabeledKnob: React.FC<LabeledKnobProps> = ({ value, positions, onChange, bottomLabel, style, labelRadius }) => {
  const id = useId();
  const rotation = positions[value]?.angle ?? 0;

  const handleClick = () => {
    if (onChange) {
      onChange((value + 1) % positions.length);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onChange) {
      onChange((value + positions.length - 1) % positions.length);
    }
  };

  const currentRadius = labelRadius ?? 40;
  const centerX = 82.34 / 2;
  const knobCenterY = 34;

  return (
    <div style={{...styles.container, ...style}}>
      <div style={styles.knobContainer}>
        {positions.map((p, i) => {
          const angleRad = (p.angle - 90) * (Math.PI / 180);
          const x = Math.round(centerX + currentRadius * Math.cos(angleRad));
          const y = Math.round(knobCenterY + currentRadius * Math.sin(angleRad));
          return (
            <span key={i} style={{ ...styles.label, top: y, left: x }}>
              {p.label}
            </span>
          );
        })}
        <div
          style={styles.knobWrapper}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          title="Click to increment, right-click to decrement"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={`knobBase${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2a2a2a" />
                <stop offset="50%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
              <linearGradient id={`gripGradient${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4a4a4a" />
                <stop offset="30%" stopColor="#3a3a3a" />
                <stop offset="70%" stopColor="#2a2a2a" />
                <stop offset="100%" stopColor="#3a3a3a" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill={`url(#knobBase${id})`} />
            <g transform={`rotate(${rotation} 24 24)`}>
              <rect x="15" y="3" width="18" height="42" rx="6" fill={`url(#gripGradient${id})`} />
              <rect x="15" y="3" width="18" height="42" rx="6" fill="none" stroke="#555" strokeWidth="0.5" />
              <ellipse cx="24" cy="5" rx="7" ry="3" fill="#3a3a3a" />
              <line x1="24" y1="3" x2="24" y2="7" stroke="#d0d0d0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="14" r="1.5" fill="#e0e0e0" />
            </g>
          </svg>
        </div>
      </div>
      {bottomLabel && <span style={styles.bottomLabel}>{bottomLabel}</span>}
    </div>
  );
};

export default LabeledKnob;
