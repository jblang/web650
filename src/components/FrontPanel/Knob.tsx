import React from 'react';

interface KnobProps {
  rotation: number;
  size?: number;
}

export const Knob: React.FC<KnobProps> = ({ rotation, size = 48 }) => {
  const gripHighlightId = React.useId().replace(/:/g, '');
  const faceConcavityId = `${gripHighlightId}-face`;
  const gripShadowId = `${gripHighlightId}-shadow`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={gripHighlightId} cx="24" cy="14.2" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cfcfcf" stopOpacity="0.075" />
          <stop offset="50%" stopColor="#cfcfcf" stopOpacity="0.025" />
          <stop offset="100%" stopColor="#cfcfcf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={faceConcavityId} cx="24" cy="24" r="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.06" />
          <stop offset="55%" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="82%" stopColor="#e6e6e6" stopOpacity="0.022" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </radialGradient>
        <linearGradient id={gripShadowId} x1="24" y1="4.2" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f0f0f" stopOpacity="0" />
          <stop offset="18%" stopColor="#0f0f0f" stopOpacity="0.45" />
          <stop offset="34%" stopColor="#0f0f0f" stopOpacity="1" />
          <stop offset="100%" stopColor="#0f0f0f" stopOpacity="1" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="21" fill="#0f0f0f" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="#111" strokeWidth="0.9" />
      <circle cx="24" cy="24" r="19" fill="#202020" />
      <circle cx="24" cy="24" r="19" fill={`url(#${faceConcavityId})`} />
      <circle cx="24" cy="24" r="19" fill="none" stroke="#303030" strokeWidth="0.9" />

      <g transform={`rotate(${rotation} 24 24)`}>
        <g transform="translate(24 0) scale(0.9 1) translate(-24 0)">
          <path
            d="M 13.1,37.5 C 12.8,41 16.9,43.2 21.1,44 C 23.1,44.2 24.9,44.2 26.9,44 C 31.1,43.2 35.2,41 34.9,37.5 C 34.4,31 34.5,19 34.8,14.4 L 35.3,7.55 A 20 20 0 0 0 12.7,7.55 L 13.2,14.4 C 13.5,19 13.6,31 13.1,37.5 Z"
            fill={`url(#${gripShadowId})`}
          />
          <path
            d="M 16.5,41.45 A 19 19 0 0 0 31.5,41.45 C 34.6,40.8 34.2,38.2 34,36.5 C 33.2,31 33.3,19 33.6,14.5 L 35.3,7.55 A 20 20 0 0 0 12.7,7.55 L 14.4,14.5 C 14.7,19 14.8,31 14,36.5 C 13.8,38.2 13.4,40.8 16.5,41.45 Z"
            fill="#303030"
          />
          <path
            d="M 16.5,41.45 A 19 19 0 0 0 31.5,41.45 C 34.6,40.8 34.2,38.2 34,36.5 C 33.2,31 33.3,19 33.6,14.5 L 35.3,7.55 A 20 20 0 0 0 12.7,7.55 L 14.4,14.5 C 14.7,19 14.8,31 14,36.5 C 13.8,38.2 13.4,40.8 16.5,41.45 Z"
            fill={`url(#${gripHighlightId})`}
          />
          <path d="M 14.6,14.2 C 17.5,12.4 20.5,11.7 24,11.7 C 27.5,11.7 30.5,12.4 33.4,14.2" fill="none" stroke="#5a5a5a" strokeWidth="0.675" strokeLinecap="butt" />
        </g>
        <rect x="23.265" y="5.1" width="1.47" height="5.5" rx="0.735" fill="#f0f0f0" />
        <circle cx="24" cy="14.1" r="1.3125" fill="#f0f0f0" />
      </g>
    </svg>
  );
};
