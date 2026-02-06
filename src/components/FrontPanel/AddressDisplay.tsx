import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import { useDigitDecay } from './useDigitDecay';
import styles from './AddressDisplay.module.scss';

interface AddressDisplayProps {
  value: string | number;
  tick: number;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ value, tick }) => {
  // Ensure value is a string and pad to 4 digits
  const displayValue = String(Math.abs(Number(value))).padStart(4, '0').slice(-4);
  const digits = displayValue.split('').map(Number);
  const intensity = useDigitDecay(displayValue, tick);

  return (
    <div className={styles.addressDisplay} data-testid="address-display" data-address-value={displayValue}>
      <div className={styles.title}>
        ADDRESS
      </div>
      {digits.map((digit, i) => (
        <div key={`addr-${i}`} className={styles.cell}>
          <BiQuinaryDigit value={digit} intensity={intensity[i]} />
        </div>
      ))}
    </div>
  );
};

export default AddressDisplay;
