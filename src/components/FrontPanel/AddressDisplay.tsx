import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';

interface AddressDisplayProps {
  value: number;
}

const styles = {
  digitGroup2: {
    gridColumn: '3 / 7',
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    backgroundColor: '#002244',
    padding: '12px',
    gap: '12px',
  },
  cell: {
    display: 'flex',
    justifyContent: 'center',
  },
};

const AddressDisplay: React.FC<AddressDisplayProps> = ({ value }) => {
  // Extract 4 least significant digits from the integer
  const absValue = Math.abs(value);
  const paddedString = absValue.toString().padStart(4, '0').slice(-4);
  const digits = paddedString.split('').map(Number);

  return (
    <div style={{ ...styles.digitGroup2, gridTemplateRows: 'auto 1fr' }}>
      <div style={{ gridColumn: 'span 4', textAlign: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2.4em', paddingLeft: '2.4em' }}>
        ADDRESS
      </div>
      {digits.map((digit, i) => (
        <div key={`addr-${i}`} style={styles.cell}>
          <BiQuinaryDigit value={digit} />
        </div>
      ))}
    </div>
  );
};

export default AddressDisplay;
