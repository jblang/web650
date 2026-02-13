import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Knob } from './Knob';
import styles from './Knob.module.scss';
import cn from 'classnames';

interface DecimalKnobProps {
  style?: React.CSSProperties;
  value: number; // 0-9
  onChange?: (value: number) => void;
  scaleFactor?: number;
  testId?: string;
}

const DEFAULT_SCALE = 1.5;
const BASE_KNOB_SIZE = 48;
const BASE_CONTAINER_HEIGHT = 68;

const DecimalKnob: React.FC<DecimalKnobProps> = ({ value, onChange, style, scaleFactor = DEFAULT_SCALE, testId }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupOffset, setPopupOffset] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Each digit is 36 degrees apart (360 / 10)
  // Position 0 is at top, rotating clockwise
  const rotation = value * 36;
  const scale = scaleFactor > 0 ? scaleFactor : DEFAULT_SCALE;
  const scaledKnobSize = BASE_KNOB_SIZE * scale;
  const scaledContainerHeight = BASE_CONTAINER_HEIGHT * scale;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        e.preventDefault();
        onChange?.((value + 1) % 10);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        e.preventDefault();
        onChange?.((value + 9) % 10);
        break;
      case 'Escape':
        setShowPopup(false);
        break;
      default:
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          onChange?.(parseInt(e.key, 10));
        }
        break;
    }
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
    <div
      className={cn(styles.knobContainer, styles.decimalKnobContainer)}
      style={{ height: `${scaledContainerHeight}px`, ...style }}
      data-testid={testId}
      role="spinbutton"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={9}
      aria-label="Digit selector"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.decimalDisplayWrapper} ref={wrapperRef}>
        <div
          className={styles.decimalDisplay}
          onClick={() => setShowPopup(!showPopup)}
          title="CHOOSE"
        >
          {value}
        </div>
        {showPopup && (
          <div ref={popupRef} className={styles.decimalPopup} style={{ marginLeft: popupOffset }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <div
                key={digit}
                className={cn(styles.decimalPopupDigit, { [styles.decimalPopupDigitSelected]: digit === value })}
                onClick={() => handleDigitSelect(digit)}
              >
                {digit}
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className={cn(styles.knobWrapper, styles.decimalKnobWrapper)}
        style={{ width: `${scaledKnobSize}px`, height: `${scaledKnobSize}px` }}
      >
        <Knob rotation={rotation} size={scaledKnobSize} />
        <div
          className={cn(styles.knobHalf, styles.knobHalfLeft, styles.decimalDecCursor)}
          onClick={handleLeftClick}
          title="DECREMENT"
          data-testid={testId ? `${testId}-dec` : undefined}
        />
        <div
          className={cn(styles.knobHalf, styles.knobHalfRight, styles.decimalIncCursor)}
          onClick={handleRightClick}
          title="INCREMENT"
          data-testid={testId ? `${testId}-inc` : undefined}
        />
      </div>
    </div>
  );
};

export default DecimalKnob;
