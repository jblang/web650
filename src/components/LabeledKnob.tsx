import React, { useId } from 'react';

interface KnobPosition {
  label: string;
  angle: number;
}

interface LabeledKnobProps {
  value: number; // The index of the current position
  positions: KnobPosition[];
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
  labelRadius?: number;
}

// SVG cursors for clockwise and counter-clockwise rotation
const ccwCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='white' stroke='black' stroke-width='0.5' d='M12 4C7.58 4 4 7.58 4 12h2c0-3.31 2.69-6 6-6v3l4-4-4-4v3z'/%3E%3C/svg%3E") 16 16, pointer`;
const cwCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='white' stroke='black' stroke-width='0.5' d='M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6h2c0-4.42-3.58-8-8-8z'/%3E%3C/svg%3E") 16 16, pointer`;

const styles = {
  container: {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    minWidth: '85px',
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
    textAlign: 'center' as const,
    maxWidth: '60px',
    cursor: 'pointer',
  },
  knobWrapper: {
    position: 'absolute' as const,
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  knobHalf: {
    position: 'absolute' as const,
    top: 0,
    width: '50%',
    height: '100%',
  },
  tickmark: {
    position: 'absolute' as const,
    width: '2px',
    height: '6px',
    backgroundColor: 'white',
    borderRadius: '1px',
  },
};

const LabeledKnob: React.FC<LabeledKnobProps> = ({ value, positions, onChange, style, labelRadius }) => {
  const id = useId();
  const rotation = positions[value]?.angle ?? 0;

  const handleLeftClick = () => {
    onChange?.((value + positions.length - 1) % positions.length);
  };

  const handleRightClick = () => {
    onChange?.((value + 1) % positions.length);
  };

  const currentRadius = labelRadius ?? 40;
  const tickRadius = 29; // Between knob edge (24) and labels
  const centerX = 82.34 / 2;
  // Knob is 48px tall, positioned at bottom of 68px container
  // So knob center is at 68 - 24 = 44px from top
  const knobCenterY = 44;
  const showTickmarks = positions.length > 2;

  return (
    <div style={{...styles.container, ...style}}>
      <div style={styles.knobContainer}>
        {positions.map((p, i) => {
          const angleRad = (p.angle - 90) * (Math.PI / 180);
          const x = Math.round(centerX + currentRadius * Math.cos(angleRad));
          const y = Math.round(knobCenterY + currentRadius * Math.sin(angleRad));

          return (
            <span
              key={i}
              style={{ ...styles.label, top: `${y}px`, left: `${x}px` }}
              onClick={() => onChange?.(i)}
            >
              {p.label}
            </span>
          );
        })}
        {showTickmarks && positions.map((p, i) => {
          const angleRad = (p.angle - 90) * (Math.PI / 180);
          const x = centerX + tickRadius * Math.cos(angleRad);
          const y = knobCenterY + tickRadius * Math.sin(angleRad) - 2;

          return (
            <div
              key={`tick-${i}`}
              style={{
                ...styles.tickmark,
                top: `${y.toFixed(2)}px`,
                left: `${x.toFixed(2)}px`,
                transform: `translate(-50%, -50%) rotate(${p.angle}deg)`,
              }}
            />
          );
        })}
        <div style={styles.knobWrapper}>
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
          <div
            style={{ ...styles.knobHalf, left: 0, cursor: cwCursor }}
            onClick={handleLeftClick}
            title="Click to rotate counter-clockwise"
          />
          <div
            style={{ ...styles.knobHalf, right: 0, cursor: ccwCursor }}
            onClick={handleRightClick}
            title="Click to rotate clockwise"
          />
        </div>
      </div>
    </div>
  );
};

export default LabeledKnob;
