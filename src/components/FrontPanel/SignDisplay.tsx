import React from 'react';
import Bulb from './Bulb';
import styles from './SignDisplay.module.scss';
import cn from 'classnames';

interface SignDisplayProps {
  value: '+' | '-';
  intensity?: { plus: number; minus: number };
}

const SignDisplay: React.FC<SignDisplayProps> = ({ value, intensity }) => {
  const plus = intensity?.plus;
  const minus = intensity?.minus;
  const rows = [0, 1, 2, 3, 4];

  return (
    <div className={styles.container} role="img" aria-label={`Sign: ${value === '+' ? 'plus' : 'minus'}`}>
      {/* Top row placeholder to align with BiQuinaryDigit */}
      <div className={cn(styles.bulb, styles.hidden)}><Bulb lit={false} /></div>
      <div></div>

      {/* 5 rows - only show bulbs for + (row 0) and - (row 3) */}
      {rows.map(rowIndex => {
        const isPlus = rowIndex === 0;
        const isMinus = rowIndex === 3;
        const showRow = isPlus || isMinus;

        return (
          <React.Fragment key={rowIndex}>
            <div className={cn(styles.bulb, { [styles.hidden]: !showRow })}>
              <Bulb
                lit={isPlus ? value === '+' : isMinus ? value === '-' : false}
                intensity={isPlus ? plus : isMinus ? minus : undefined}
              />
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
