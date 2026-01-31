import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';
import SignDisplay from './SignDisplay';
import { normalizeValue } from '../../lib/format';
import styles from './DisplaySection.module.scss';

interface DisplaySectionProps {
  value: string | number;
}

const DisplaySection: React.FC<DisplaySectionProps> = ({ value }) => {
  const normalizedValue = normalizeValue(value);
  // Extract 10 digits and sign (sign is at end: 0000000000+)
  const sign = normalizedValue.charAt(10) as '+' | '-';
  const digits = normalizedValue.substring(0, 10).split('').map(Number);

  return (
    <>
      {/* Labels row */}
      <div className={styles.labelBar}>
        <div className={styles.labelDisplay}>DISPLAY</div>
        <div className={styles.labelSign}>SIGN</div>
      </div>

      {/* Digit groups row */}
      <div className={styles.digitGroup1}>
        {digits.slice(0, 2).map((digit, i) => (
          <div key={i} className={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      <div className={styles.digitGroup2}>
        {digits.slice(2, 6).map((digit, i) => (
          <div key={i + 2} className={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      <div className={styles.digitGroup3}>
        {digits.slice(6, 10).map((digit, i) => (
          <div key={i + 6} className={styles.cell}>
            <BiQuinaryDigit value={digit} />
          </div>
        ))}
      </div>

      <div className={styles.signGroup}>
        <SignDisplay value={sign} />
      </div>
    </>
  );
};

export default DisplaySection;
