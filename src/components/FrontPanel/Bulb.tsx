'use client';

import React from 'react';
import cn from 'classnames';
import { litBulb, unlitBulb } from './FrontPanel';
import styles from './Bulb.module.scss';

interface BulbProps {
  lit: boolean;
  intensity?: number;
  className?: string;
  label?: string;
}

const Bulb: React.FC<BulbProps> = ({ lit, intensity, className, label }) => {
  const clamped = intensity !== undefined ? Math.max(0, Math.min(1, intensity)) : undefined;
  const litOn = clamped !== undefined ? clamped > 0 : lit;
  const stateText = litOn ? 'lit' : 'unlit';
  const ariaLabel = label ? `${label}: ${stateText}` : stateText;
  return (
    <span className={cn(styles.bulb, className)} role="img" aria-label={ariaLabel}>
      <span className={styles.unlit}>{unlitBulb}</span>
      <span
        className={cn(styles.lit, { [styles.litOn]: litOn })}
        style={clamped !== undefined ? { opacity: clamped, transition: 'none' } : undefined}
      >
        {litBulb}
      </span>
    </span>
  );
};

export default Bulb;
