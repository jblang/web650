import React, { useId } from 'react';

interface DecimalKnobProps {
  value: number; // 0-9
  onChange?: (value: number) => void;
}

const styles = {
  container: {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  display: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    padding: '2px 6px',
    borderRadius: '2px',
    minWidth: '16px',
    textAlign: 'center' as const,
    border: '1px solid #333',
  },
  knobWrapper: {
    cursor: 'pointer',
  },
};

const DecimalKnob: React.FC<DecimalKnobProps> = ({ value, onChange }) => {
  const id = useId();
  // Each digit is 36 degrees apart (360 / 10)
  // Position 0 is at top, rotating clockwise
  const rotation = value * 36;

  const handleClick = () => {
    if (onChange) {
      onChange((value + 1) % 10);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onChange) {
      onChange((value + 9) % 10); // Go backwards
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.display}>{value}</div>
      <div
        style={styles.knobWrapper}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title="Click to increment, right-click to decrement"
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
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

          {/* Main knob base (dark circle) */}
          <circle
            cx="24"
            cy="24"
            r="22"
            fill={`url(#knobBase${id})`}
          />

          {/* Rotating group */}
          <g transform={`rotate(${rotation} 24 24)`}>
            {/* Center raised grip - rounded rectangle */}
            <rect
              x="15"
              y="5"
              width="18"
              height="38"
              rx="4"
              fill={`url(#gripGradient${id})`}
            />

            {/* Grip edge highlight */}
            <rect
              x="15"
              y="5"
              width="18"
              height="38"
              rx="4"
              fill="none"
              stroke="#555"
              strokeWidth="0.5"
            />

            {/* Sloped top face */}
            <ellipse
              cx="24"
              cy="7"
              rx="7"
              ry="2"
              fill="#3a3a3a"
            />

            {/* White indicator groove on top */}
            <line
              x1="24"
              y1="3"
              x2="24"
              y2="7"
              stroke="#d0d0d0"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* White dot on grip face */}
            <circle
              cx="24"
              cy="14"
              r="3"
              fill="#e0e0e0"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DecimalKnob;
