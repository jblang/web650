import React from 'react';
import { litBulb, unlitBulb } from './FrontPanel';
import styles from './SignDisplay.module.scss';
import cn from 'classnames';

interface SignDisplayProps {
  value: '+' | '-';
}

const SignDisplay: React.FC<SignDisplayProps> = ({ value }) => {
  const rows = [0, 1, 2, 3, 4];

  return (
    <div className={styles.container}>
      {/* Top row placeholder to align with BiQuinaryDigit */}
      <div className={cn(styles.bulb, styles.hidden)}>{unlitBulb}</div>
      <div></div>

      {/* 5 rows - only show bulbs for + (row 0) and - (row 3) */}
      {rows.map(rowIndex => {
        const isPlus = rowIndex === 0;
        const isMinus = rowIndex === 3;
        const showRow = isPlus || isMinus;

        return (
          <React.Fragment key={rowIndex}>
            <div className={cn(styles.bulb, { [styles.hidden]: !showRow })}>
              {isPlus ? (value === '+' ? litBulb : unlitBulb) :
               isMinus ? (value === '-' ? litBulb : unlitBulb) : unlitBulb}
            </div>
            <div className={cn(styles.sign, { [styles.hidden]: !showRow })}>
              {isPlus ? '+' : isMinus ? '-' : ''}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SignDisplay;

