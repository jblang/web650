import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import SignDisplay from './SignDisplay';
import { normalizeWord } from '../../lib/simh/i650/format';
import { useDisplayDecay } from './useDisplayDecay';
import styles from './DisplaySection.module.scss';

interface DisplaySectionProps {
  value: string | number;
  tick: number;
}

const DisplaySection: React.FC<DisplaySectionProps> = ({ value, tick }) => {
  const normalizedValue = normalizeWord(value);
  const intensity = useDisplayDecay(normalizedValue, tick);
  // Extract 10 digits and sign (sign is at end: 0000000000+)
  const sign = normalizedValue.charAt(10) as '+' | '-';
  const digits = normalizedValue.substring(0, 10).split('').map(Number);

  return (
    <>
      {/* Labels row */}
      <div className={styles.labelBar} data-testid="display-section" data-display-value={normalizedValue}>
        <div className={styles.labelDisplay}>DISPLAY</div>
        <div className={styles.labelSign}>SIGN</div>
      </div>

      {/* Digits row - digits render directly on parent grid */}
      <div className={styles.digitsRow}>
        <BiQuinaryNumber
          value={digits.slice(0, 2)}
          tick={tick}
          digitCount={2}
          intensity={intensity.digits.slice(0, 2)}
          testIdPrefix="display"
          className={styles.digitGroup1}
        />

        <BiQuinaryNumber
          value={digits.slice(2, 6)}
          tick={tick}
          digitCount={4}
          intensity={intensity.digits.slice(2, 6)}
          testIdPrefix="display"
          className={styles.digitGroup2}
        />

        <BiQuinaryNumber
          value={digits.slice(6, 10)}
          tick={tick}
          digitCount={4}
          intensity={intensity.digits.slice(6, 10)}
          testIdPrefix="display"
          className={styles.digitGroup3}
        />
      </div>

      <div className={styles.signGroup}>
        <SignDisplay value={sign} intensity={intensity.sign} />
      </div>
    </>
  );
};

export default DisplaySection;
