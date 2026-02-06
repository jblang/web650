import React from 'react';
import DecimalKnob from './DecimalKnob';
import LabeledKnob from './LabeledKnob';
import { normalizeWord } from '../../lib/simh/i650/format';
import styles from './EntrySection.module.scss';

const SIGN_POS = [{label: '-', angle: -30}, {label: '+', angle: 30}];

interface EntrySectionProps {
  value: string | number;
  onChange: (newValue: string) => void;
}

const EntrySection: React.FC<EntrySectionProps> = ({
  value,
  onChange,
}) => {
  const [normalizedValue, setNormalizedValue] = React.useState(() => normalizeWord(value));

  React.useEffect(() => {
    setNormalizedValue(normalizeWord(value));
  }, [value]);

  // Extract 10 digits and sign (sign is at end: 0000000000+)
  const isNegative = normalizedValue.endsWith('-');
  const signKnobPosition = isNegative ? 0 : 1; // 0 = minus, 1 = plus
  const digits = normalizedValue.substring(0, 10).split('').map(Number);

  // Handler for digit changes
  const handleDigitChange = (index: number) => (newDigit: number) => {
    const currentNumericPart = normalizedValue.substring(0, 10);
    const newNumericPartArray = currentNumericPart.split('');
    newNumericPartArray[index] = String(newDigit);
    const newNumericPart = newNumericPartArray.join('');

    const newCanonicalValue = newNumericPart + (isNegative ? '-' : '+');
    onChange(normalizeWord(newCanonicalValue));
  };

  // Handler for sign changes
  const handleSignChange = (newSign: number) => {
    const newSignChar = newSign === 0 ? '-' : '+';
    const numericPart = normalizedValue.substring(0, 10);
    onChange(normalizeWord(numericPart + newSignChar));
  };

  return (
    <>
      {/* Knobs row */}
      <div className={styles.knobsRow} data-testid="entry-section" data-entry-value={normalizedValue}>
        <div className={styles.digitContainer}>
          {digits.map((digit, i) => (
            <div key={i} className={styles.cell}>
              <DecimalKnob value={digit} onChange={handleDigitChange(i)} testId={`entry-digit-${i}`} />
            </div>
          ))}
        </div>
        <div className={styles.storageEntryLabel}>
          STORAGE ⸻ ENTRY
        </div>
      </div>

      <div className={styles.signKnobCell}>
        <div className={styles.cell}>
          <LabeledKnob position={signKnobPosition} positions={SIGN_POS} onChange={handleSignChange} testId="entry-sign-knob" label="Sign" />
        </div>
        <div className={styles.signLabel}>
          SIGN
        </div>
      </div>
    </>
  );
};

export default EntrySection;
