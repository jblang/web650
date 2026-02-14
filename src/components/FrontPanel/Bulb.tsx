'use client';

import React from 'react';
import cn from 'classnames';
import styles from './Bulb.module.scss';

interface BulbProps {
  lit: boolean;
  className?: string;
  label?: string;
}

const BulbGlyph: React.FC<{ lit: boolean }> = ({ lit }) => {
  const gradientBaseId = React.useId().replace(/:/g, '');
  const fillGradientId = `${gradientBaseId}-fill`;
  const surfaceLightId = `${gradientBaseId}-surface`;
  const rimGradientId = `${gradientBaseId}-rim`;

  return (
    <svg
      className={styles.bulbSvg}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={fillGradientId} cx="12" cy="2" r="19" gradientUnits="userSpaceOnUse">
          {lit ? (
            <>
              <stop offset="0%" stopColor="#efe391" />
              <stop offset="68%" stopColor="#e8be2a" />
              <stop offset="100%" stopColor="#d89d00" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#434343" />
              <stop offset="70%" stopColor="#1b1b1b" />
              <stop offset="100%" stopColor="#070707" />
            </>
          )}
        </radialGradient>
        <radialGradient id={surfaceLightId} cx="12" cy="2" r="18" gradientUnits="userSpaceOnUse">
          {lit ? (
            <>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </>
          )}
        </radialGradient>
        <radialGradient id={rimGradientId} cx="12" cy="12" r="10" gradientUnits="userSpaceOnUse">
          {lit ? (
            <>
              <stop offset="78%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#7b5300" stopOpacity="0.26" />
            </>
          ) : (
            <>
              <stop offset="76%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.42" />
            </>
          )}
        </radialGradient>
      </defs>

      <circle cx="12" cy="12" r="10" fill={`url(#${fillGradientId})`} />
      <circle cx="12" cy="12" r="10" fill={`url(#${surfaceLightId})`} />
      <circle cx="12" cy="12" r="10" fill={`url(#${rimGradientId})`} />
      <circle cx="12" cy="12" r="10" fill="none" stroke="#000000" strokeOpacity="0.9" strokeWidth="0.28" />
    </svg>
  );
};

const Bulb: React.FC<BulbProps> = ({ lit, className, label }) => {
  const stateText = lit ? 'lit' : 'unlit';
  const ariaLabel = label ? `${label}: ${stateText}` : stateText;
  return (
    <span className={cn(styles.bulb, className)} role="img" aria-label={ariaLabel}>
      <BulbGlyph lit={lit} />
    </span>
  );
};

export default Bulb;
