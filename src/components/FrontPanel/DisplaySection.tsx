import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import SignDisplay from './SignDisplay';
import {
  normalizeWord,
  extractSign,
  extractOperationCode,
  extractDataAddress,
  extractInstructionAddress,
} from '../../lib/simh/i650/format';
import styles from './DisplaySection.module.scss';

interface DisplaySectionProps {
  value: string | number;
}

const DisplaySection: React.FC<DisplaySectionProps> = ({ value }) => {
  // Extract fields and sign (sign is at end: 0000000000+)
  const sign = extractSign(value);
  const opCode = extractOperationCode(value);
  const dataAddress = extractDataAddress(value);
  const instructionAddress = extractInstructionAddress(value);

  return (
    <>
      {/* Labels row */}
      <div
        className={styles.labelBar}
        data-testid="display-section"
        data-display-value={normalizeWord(value)}
      >
        <div className={styles.labelDisplay}>DISPLAY</div>
        <div className={styles.labelSign}>SIGN</div>
      </div>

      {/* Digits row - digits render directly on parent grid */}
      <div className={styles.digitsRow}>
        <BiQuinaryNumber
          value={opCode}
          digitCount={2}
          testIdPrefix="display"
          className={styles.opCodeGroup}
          cellClassName={styles.digitCell}
        />

        <BiQuinaryNumber
          value={dataAddress}
          digitCount={4}
          testIdPrefix="display"
          className={styles.dataAddressGroup}
          cellClassName={styles.digitCell}
        />

        <BiQuinaryNumber
          value={instructionAddress}
          digitCount={4}
          testIdPrefix="display"
          className={styles.instructionAddressGroup}
          cellClassName={styles.digitCell}
        />
      </div>

      <div className={styles.signGroup}>
        <SignDisplay value={sign} />
      </div>
    </>
  );
};

export default DisplaySection;
