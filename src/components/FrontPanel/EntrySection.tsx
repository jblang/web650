import React from 'react';
import DecimalKnob from './DecimalKnob';
import LabeledKnob from './LabeledKnob';

const SIGN_POS = [{label: '-', angle: -30}, {label: '+', angle: 30}];

interface EntrySectionProps {
  value: number;
  onChange: (newValue: number) => void;
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
  // Extract sign and 10 least significant digits from the integer
  const isNegative = value < 0;
  const storageSign = isNegative ? 0 : 1; // 0 = minus, 1 = plus
  const absValue = Math.abs(value);
  const paddedString = absValue.toString().padStart(10, '0').slice(-10);
  const digits = paddedString.split('').map(Number);

  // Handler for digit changes
  const handleDigitChange = (index: number) => (newDigit: number) => {
    const newDigits = [...digits];
    newDigits[index] = newDigit;
    const newAbsValue = parseInt(newDigits.join(''), 10);
    onChange(isNegative ? -newAbsValue : newAbsValue);
  };

  // Handler for sign changes
  const handleSignChange = (newSign: number) => {
    const newIsNegative = newSign === 0;
    onChange(newIsNegative ? -absValue : absValue);
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
          <LabeledKnob value={storageSign} positions={SIGN_POS} onChange={handleSignChange} />
        </div>
        <div style={styles.signLabel}>
          SIGN
        </div>
      </div>
    </>
  );
};

export default EntrySection;
