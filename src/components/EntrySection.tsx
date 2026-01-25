import React from 'react';
import DecimalKnob from './DecimalKnob';
import LabeledKnob from './LabeledKnob';

const SIGN_POS = [{label: '-', angle: -30}, {label: '+', angle: 30}];

interface EntrySectionProps {
  digits: number[];
  storageSign: number;
  onStorageDigitChange: (index: number) => (newValue: number) => void;
  onSignChange: (newValue: number) => void;
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
  digits,
  storageSign,
  onStorageDigitChange,
  onSignChange,
}) => {
  return (
    <>
      {/* Knobs row */}
      <div style={styles.knobsRow}>
        <div style={{ gridColumn: '1 / 11', display: 'grid', gridTemplateColumns: 'subgrid', gap: '12px' }}>
          {digits.map((digit, i) => (
            <div key={i} style={styles.cell}>
              <DecimalKnob value={digit} onChange={onStorageDigitChange(i)} />
            </div>
          ))}
        </div>
        <div style={styles.storageEntryLabel}>
          STORAGE ⸻ ENTRY
        </div>
      </div>

      <div style={styles.signKnobCell}>
        <div style={styles.cell}>
          <LabeledKnob value={storageSign} positions={SIGN_POS} onChange={onSignChange} />
        </div>
        <div style={styles.signLabel}>
          SIGN
        </div>
      </div>
    </>
  );
};

export default EntrySection;
