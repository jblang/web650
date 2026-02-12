import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import { normalizeAddress } from '../../lib/simh/i650/format';
import styles from './BiQuinaryNumber.module.scss';

interface BiQuinaryNumberProps {
  value: string | number | number[];
  tick: number;
  digitCount: 2 | 4 | 10;
  title?: string;
  testIdPrefix?: string;
  className?: string;
}

/**
 * Displays a number using bi-quinary encoded digits.
 * Used for operation codes (2 digits), addresses (4 digits), and data words (10 digits).
 */
const BiQuinaryNumber: React.FC<BiQuinaryNumberProps> = ({
  value,
  digitCount,
  title,
  testIdPrefix = 'digit',
  className,
}) => {
  // Handle array input (for DisplaySection digit slices)
  const digits = Array.isArray(value)
    ? value
    : (() => {
        // Format value based on digit count
        const displayValue =
          digitCount === 10
            ? String(value).padStart(10, '0')
            : digitCount === 4
              ? normalizeAddress(value)
              : String(value).padStart(2, '0');
        return displayValue.split('').map(Number);
      })();

  return (
    <div className={className || styles.container} data-testid={`${testIdPrefix}-container`}>
      {title && <div className={title ? 'title' : styles.title}>{title}</div>}
      {digits.map((digit, i) => (
        <div key={i} className={className ? 'cell' : styles.cell}>
          <BiQuinaryDigit value={digit} />
        </div>
      ))}
    </div>
  );
};

export default BiQuinaryNumber;
