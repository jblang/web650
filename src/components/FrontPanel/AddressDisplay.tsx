import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import HelpTarget from './HelpTarget';
import { normalizeAddress } from '../../lib/simh/i650/format';
import styles from './AddressDisplay.module.scss';

interface AddressDisplayProps {
  value: string | number;
  helpEnabled?: boolean;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ value, helpEnabled = false }) => {
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
      <HelpTarget
        enabled={helpEnabled}
        title="ADDRESS LIGHTS"
        description="Shows the address register. DATA ADDRESS and INSTRUCTION ADDRESS status lights indicate whether the next half-cycle is data or instruction."
      />
    </div>
  );
};

export default AddressDisplay;
