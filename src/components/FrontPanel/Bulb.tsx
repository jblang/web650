'use client';

import React from 'react';
import cn from 'classnames';
import { litBulb, unlitBulb } from './FrontPanel';
import styles from './Bulb.module.scss';

interface BulbProps {
  lit: boolean;
  className?: string;
  label?: string;
}

const Bulb: React.FC<BulbProps> = ({ lit, className, label }) => {
  const stateText = lit ? 'lit' : 'unlit';
  const ariaLabel = label ? `${label}: ${stateText}` : stateText;
  return (
    <span className={cn(styles.bulb, className)} role="img" aria-label={ariaLabel}>
      {lit ? litBulb : unlitBulb}
    </span>
  );
};

export default Bulb;
