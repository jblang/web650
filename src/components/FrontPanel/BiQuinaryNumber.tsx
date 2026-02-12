import React from 'react';
import cn from 'classnames';
import BiQuinaryDigit from './BiQuinaryDigit';
import { normalizeAddress } from '../../lib/simh/i650/format';
import styles from './BiQuinaryNumber.module.scss';

interface BiQuinaryNumberProps {
  value: string | number | number[];
  digitCount: 2 | 4 | 10;
  title?: string;
  testIdPrefix?: string;
  className?: string;
  titleClassName?: string;
  cellClassName?: string;
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
  titleClassName,
  cellClassName,
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
      {title && <div className={titleClassName || styles.title}>{title}</div>}
      {digits.map((digit, i) => (
        <div key={i} className={cn(styles.cell, cellClassName)}>
          <BiQuinaryDigit value={digit} />
        </div>
      ))}
    </div>
  );
};

export default BiQuinaryNumber;
