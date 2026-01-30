import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Knob } from './Knob';
import './Knob.scss';

interface DecimalKnobProps {
  value: number; // 0-9
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
}

// SVG cursors for clockwise and counter-clockwise rotation
const ccwCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 18 18'%3E%3Cpath d='M9 3v12M3 9h12' stroke='black' stroke-width='4.5' fill='none'/%3E%3Cpath d='M9 3v12M3 9h12' stroke='white' stroke-width='3' fill='none'/%3E%3C/svg%3E") 12 12, pointer`;
const cwCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 18 18'%3E%3Cpath d='M3 9h12' stroke='black' stroke-width='4.5' fill='none'/%3E%3Cpath d='M3 9h12' stroke='white' stroke-width='3' fill='none'/%3E%3C/svg%3E") 12 12, pointer`;

const DecimalKnob: React.FC<DecimalKnobProps> = ({ value, onChange, style }) => {
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
    <div className="knob-container decimal-knob" style={style}>
      <div className="display-wrapper" ref={wrapperRef}>
        <div
          className="display"
          onClick={() => setShowPopup(!showPopup)}
          title="CHOOSE"
        >
          {value}
        </div>
        {showPopup && (
          <div ref={popupRef} className="popup" style={{ marginLeft: popupOffset }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <div
                key={digit}
                className={`popup-digit ${digit === value ? 'selected' : ''}`}
                onClick={() => handleDigitSelect(digit)}
              >
                {digit}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="knob-wrapper">
        <Knob rotation={rotation} />
        <div
          className="knob-half"
          style={{ left: 0, cursor: cwCursor }}
          onClick={handleLeftClick}
          title="DECREMENT"
        />
        <div
          className="knob-half"
          style={{ right: 0, cursor: ccwCursor }}
          onClick={handleRightClick}
          title="INCREMENT"
        />
      </div>
    </div>
  );
};

export default DecimalKnob;
