import React from 'react';
import BiQuinaryDigit from './BiQuinaryDigit';

interface OperationDisplayProps {
  value: number;
}

const styles = {
  digitGroup1: {
    gridColumn: '1 / 3',
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

const OperationDisplay: React.FC<OperationDisplayProps> = ({ value }) => {
  // Extract 2 least significant digits from the integer
  const absValue = Math.abs(value);
  const paddedString = absValue.toString().padStart(2, '0').slice(-2);
  const digits = paddedString.split('').map(Number);

  return (
    <div style={{ ...styles.digitGroup1, gridTemplateRows: 'auto 1fr' }}>
      <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.2em', paddingLeft: '1.2em' }}>
        OPERATION
      </div>
      {digits.map((digit, i) => (
        <div key={`op-${i}`} style={styles.cell}>
          <BiQuinaryDigit value={digit} />
        </div>
      ))}
    </div>
  );
};

export default OperationDisplay;
