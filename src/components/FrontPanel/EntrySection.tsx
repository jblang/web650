import React from 'react';
import DecimalKnob from './DecimalKnob';
import LabeledKnob from './LabeledKnob';
import { normalizeValue } from '../../lib/format';

const SIGN_POS = [{label: '-', angle: -30}, {label: '+', angle: 30}];

interface EntrySectionProps {
  value: string | number;
  onChange: (newValue: string) => void;
}

const styles = {
  knobsRow: {
    gridColumn: '1 / 11',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridTemplateRows: 'auto 1fr',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
    alignItems: 'stretch',
  },
  signKnobCell: {
    gridColumn: '11',
    backgroundColor: '#002244',
    padding: '12px',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    justifyContent: 'stretch',
    alignItems: 'stretch',
    gap: '12px',
  },
  cell: {
    display: 'flex',
    justifyContent: 'center',
  },
  storageEntryLabel: {
    gridColumn: '1 / 11',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    letterSpacing: '2.4em',
    textAlign: 'center' as const,
    paddingLeft: '2.4em',
    alignSelf: 'end'
  },
  signLabel: {
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    alignSelf: 'end'
  }
};

const EntrySection: React.FC<EntrySectionProps> = ({
  value,
  onChange,
}) => {
  const [normalizedValue, setNormalizedValue] = React.useState(() => normalizeValue(value));

  React.useEffect(() => {
    setNormalizedValue(normalizeValue(value));
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
    onChange(normalizeValue(newCanonicalValue));
  };

  // Handler for sign changes
  const handleSignChange = (newSign: number) => {
    const newSignChar = newSign === 0 ? '-' : '+';
    const numericPart = normalizedValue.substring(0, 10);
    onChange(normalizeValue(numericPart + newSignChar));
  };

  return (
    <>
      {/* Knobs row */}
      <div style={styles.knobsRow}>
        <div style={{ gridColumn: '1 / 11', display: 'grid', gridTemplateColumns: 'subgrid', gap: '12px' }}>
          {digits.map((digit, i) => (
            <div key={i} style={styles.cell}>
              <DecimalKnob value={digit} onChange={handleDigitChange(i)} />
            </div>
          ))}
        </div>
        <div style={styles.storageEntryLabel}>
          STORAGE ⸻ ENTRY
        </div>
      </div>

      <div style={styles.signKnobCell}>
        <div style={styles.cell}>
          <LabeledKnob position={signKnobPosition} positions={SIGN_POS} onChange={handleSignChange} />
        </div>
        <div style={styles.signLabel}>
          SIGN
        </div>
      </div>
    </>
  );
};

export default EntrySection;
