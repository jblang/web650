import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import styles from './OperationDisplay.module.scss';

interface OperationDisplayProps {
  value: string | number;
}

const OperationDisplay: React.FC<OperationDisplayProps> = ({ value }) => {
  return (
    <div className={styles.operationDisplay} data-testid="operation-display">
      <BiQuinaryNumber
        value={value}
        digitCount={2}
        title="OPERATION"
        testIdPrefix="operation-digit"
        className={styles.content}
        titleClassName={styles.title}
        cellClassName={styles.cell}
      />
    </div>
  );
};

export default OperationDisplay;
