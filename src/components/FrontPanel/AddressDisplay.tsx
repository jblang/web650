import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import { normalizeAddress } from '../../lib/simh/i650/format';
import styles from './AddressDisplay.module.scss';

interface AddressDisplayProps {
  value: string | number;
  tick: number;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ value, tick }) => {
  const displayValue = normalizeAddress(value);

  return (
    <div className={styles.addressDisplay} data-testid="address-display" data-address-value={displayValue}>
      <BiQuinaryNumber
        value={displayValue}
        tick={tick}
        digitCount={4}
        title="ADDRESS"
        testIdPrefix="addr"
        className={styles.content}
      />
    </div>
  );
};

export default AddressDisplay;
