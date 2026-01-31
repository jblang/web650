import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import styles from './OperationDisplay.module.scss';

interface OperationDisplayProps {
  value: string | number;
}

const OperationDisplay: React.FC<OperationDisplayProps> = ({ value }) => {
  // Ensure value is a string and pad to 2 digits
  const displayValue = String(Math.abs(Number(value))).padStart(2, '0').slice(-2);
  const digits = displayValue.split('').map(Number);

  return (
    <div className={styles.digitGroup1}>
      <div className={styles.title}>
        OPERATION
      </div>
      {digits.map((digit, i) => (
        <div key={`op-${i}`} className={styles.cell}>
          <BiQuinaryDigit value={digit} />
        </div>
      ))}
    </div>
  );
};

export default OperationDisplay;
