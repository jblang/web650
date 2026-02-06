import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import styles from './OperationDisplay.module.scss';

interface OperationDisplayProps {
  value: string | number;
  tick: number;
}

const OperationDisplay: React.FC<OperationDisplayProps> = ({ value, tick }) => {
  return (
    <div className={styles.operationDisplay} data-testid="operation-display">
      <BiQuinaryNumber
        value={value}
        tick={tick}
        digitCount={2}
        title="OPERATION"
        testIdPrefix="operation-digit"
        className={styles.content}
      />
    </div>
  );
};

export default OperationDisplay;
