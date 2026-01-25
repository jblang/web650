import React, { useId, useState, useRef, useEffect, useLayoutEffect } from 'react';

interface DecimalKnobProps {
  value: number; // 0-9
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
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
    position: 'relative' as const,
  },
  knobHalf: {
    position: 'absolute' as const,
    top: 0,
    width: '50%',
    height: '100%',
  },
  displayWrapper: {
    position: 'relative' as const,
  },
  popup: {
    position: 'absolute' as const,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'row' as const,
    backgroundColor: '#2a2a2a',
    border: '1px solid #555',
    borderRadius: '4px',
    padding: '4px',
    gap: '2px',
    zIndex: 100,
    marginTop: '2px',
  },
  popupDigit: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    borderRadius: '2px',
    cursor: 'pointer',
    border: '1px solid #333',
  },
};

const DecimalKnob: React.FC<DecimalKnobProps> = ({ value, onChange, style }) => {
  const id = useId();
  const [showPopup, setShowPopup] = useState(false);
  const [popupOffset, setPopupOffset] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Each digit is 36 degrees apart (360 / 10)
  // Position 0 is at top, rotating clockwise
  const rotation = value * 36;

  const handleLeftClick = () => {
    onChange?.((value + 9) % 10);
  };

  const handleRightClick = () => {
    onChange?.((value + 1) % 10);
  };

  const handleDigitSelect = (digit: number) => {
    onChange?.(digit);
    setShowPopup(false);
  };

  useEffect(() => {
    if (!showPopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  useLayoutEffect(() => {
    if (showPopup && popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      let newOffset = 0;
      if (rect.left < 0) {
        newOffset = -rect.left + 4;
      } else if (rect.right > viewportWidth) {
        newOffset = viewportWidth - rect.right - 4;
      }

      setPopupOffset(prevOffset => {
        if (newOffset !== prevOffset) {
          return newOffset;
        }
        return prevOffset;
      });
    }
  }, [showPopup]);

  return (
    <div style={{...styles.container, ...style}}>
      <div style={styles.displayWrapper} ref={wrapperRef}>
        <div
          style={{ ...styles.display, cursor: 'pointer' }}
          onClick={() => setShowPopup(!showPopup)}
          title="Click to select digit"
        >
          {value}
        </div>
        {showPopup && (
          <div ref={popupRef} style={{ ...styles.popup, marginLeft: popupOffset }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <div
                key={digit}
                style={{
                  ...styles.popupDigit,
                  backgroundColor: digit === value ? '#444' : '#1a1a1a',
                }}
                onClick={() => handleDigitSelect(digit)}
              >
                {digit}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={styles.knobWrapper}>
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
  );
};

export default DecimalKnob;
