import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import styles from './AddressDisplay.module.scss';

interface AddressDisplayProps {
  value: string | number;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ value }) => {
  // Ensure value is a string and pad to 4 digits
  const displayValue = String(Math.abs(Number(value))).padStart(4, '0').slice(-4);
  const digits = displayValue.split('').map(Number);

  return (
    <div className={styles.addressDisplay} data-testid="address-display" data-address-value={displayValue}>
      <div className={styles.title}>
        ADDRESS
      </div>
      {digits.map((digit, i) => (
        <div key={`addr-${i}`} className={styles.cell}>
          <BiQuinaryDigit value={digit} />
        </div>
      ))}
    </div>
  );
};

export default AddressDisplay;
