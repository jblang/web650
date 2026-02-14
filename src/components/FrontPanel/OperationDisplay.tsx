import React from 'react';
import BiQuinaryNumber from './BiQuinaryNumber';
import HelpTarget from './HelpTarget';
import styles from './OperationDisplay.module.scss';

interface OperationDisplayProps {
  value: string | number;
  helpEnabled?: boolean;
}

const OperationDisplay: React.FC<OperationDisplayProps> = ({ value, helpEnabled = false }) => {
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
      <HelpTarget
        enabled={helpEnabled}
        title="OPERATION LIGHTS"
        description="These lights indicate the current operation during the data half-cycle. They are blank during the instruction half-cycle."
      />
    </div>
  );
};

export default OperationDisplay;
