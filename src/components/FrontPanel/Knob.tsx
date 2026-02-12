import React, { useId } from 'react';

interface KnobProps {
  rotation: number;
}

export const Knob: React.FC<KnobProps> = ({ rotation }) => {
  const id = useId();

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs />

      <circle cx="24" cy="24" r="21" fill="#0f0f0f" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="#111" strokeWidth="0.9" />
      <circle cx="24" cy="24" r="19" fill="#202020" />
      <circle cx="24" cy="24" r="19" fill="none" stroke="#303030" strokeWidth="0.9" />

      <g transform={`rotate(${rotation} 24 24)`}>
        <path
          d="M 13.5,11 C 13.5,6 17.2,4.4 24,4.4 C 30.8,4.4 34.5,6 34.5,11 L 34.5,37.5 C 34.8,41 30.9,43.2 26.8,44 C 24.9,44.2 23.1,44.2 21.2,44 C 17.1,43.2 13.2,41 13.5,37.5 Z"
          fill="#0f0f0f"
        />
        <path
          d="M 14.5,11 C 14.5,6 18,4.6 24,4.6 C 30,4.6 33.5,6 33.5,11 C 32.6,17 32.6,31 33.5,36.5 C 33.6,40 30.2,42.6 26.5,43 C 24.9,43.2 23.1,43.2 21.5,43 C 17.8,42.6 14.4,40 14.5,36.5 C 15.4,31 15.4,17 14.5,11 Z"
          fill="#303030"
        />
        <path
          d="M 14.5,11 C 14.5,6 18,4.6 24,4.6 C 30,4.6 33.5,6 33.5,11 C 32.6,17 32.6,31 33.5,36.5 C 33.6,40 30.2,42.6 26.5,43 C 24.9,43.2 23.1,43.2 21.5,43 C 17.8,42.6 14.4,40 14.5,36.5 C 15.4,31 15.4,17 14.5,11 Z"
          fill="none"
          stroke="#101010"
          strokeWidth="0.6"
        />
        <path d="M 16,14.2 C 18.2,12.6 20.8,11.9 24,11.9 C 27.2,11.9 29.8,12.6 32,14.2" fill="none" stroke="#5a5a5a" strokeWidth="0.9" strokeLinecap="butt" />
        <rect x="23.265" y="5.6" width="1.47" height="5.5" rx="0.735" fill="#f0f0f0" />
        <circle cx="24" cy="14.8" r="1.3125" fill="#f0f0f0" />
      </g>
    </svg>
  );
};
