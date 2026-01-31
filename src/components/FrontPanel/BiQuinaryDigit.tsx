import React from 'react';
import { litBulb, unlitBulb } from './FrontPanel';
import styles from './BiQuinaryDigit.module.scss';

interface BiQuinaryDigitProps {
  value: number; // A single digit from 0-9
}

const BiQuinaryDigit: React.FC<BiQuinaryDigitProps> = ({ value }) => {
  const isLeftColumnActive = value >= 0 && value <= 4;
  const isRightColumnActive = value >= 5 && value <= 9;
  const activeRow = value % 5;
  const rows = [0, 1, 2, 3, 4];

  return (
    <div className={styles.container}>
      {/* Bi (0-4 vs 5-9) indicator row */}
      <div className={styles.bulb}>{isLeftColumnActive ? litBulb : unlitBulb}</div>
      <div></div>
      <div className={styles.bulb}>{isRightColumnActive ? litBulb : unlitBulb}</div>

      {/* Quinary (0-4) rows */}
      {rows.map(rowIndex => (
        <React.Fragment key={rowIndex}>
          <div className={styles.number}>{rowIndex}</div>
          <div className={styles.bulb}>{activeRow === rowIndex ? litBulb : unlitBulb}</div>
          <div className={styles.number}>{rowIndex + 5}</div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default BiQuinaryDigit;
