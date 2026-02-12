import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import { normalizeAddress } from '../../lib/simh/i650/format';
import styles from './AddressDisplay.module.scss';

interface AddressDisplayProps {
  value: string | number;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ value }) => {
  const displayValue = normalizeAddress(value);

  return (
    <div className={styles.addressDisplay} data-testid="address-display" data-address-value={displayValue}>
      <BiQuinaryNumber
        value={displayValue}
        digitCount={4}
        title="ADDRESS"
        testIdPrefix="addr"
        className={styles.content}
        titleClassName={styles.title}
        cellClassName={styles.cell}
      />
    </div>
  );
};

export default AddressDisplay;
