import React, { useId } from 'react';

interface KnobProps {
  rotation: number;
}

export const Knob: React.FC<KnobProps> = ({ rotation }) => {
  const id = useId();

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`knobBase${id}`} cx="50%" cy="50%" r="65%" fx="35%" fy="35%">
          <stop offset="0%" stopColor="#0a0a0a" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </radialGradient>
        <linearGradient id={`gripGradient${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#373737" />
          <stop offset="30%" stopColor="#2a2a2a" />
          <stop offset="70%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#373737" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="22" fill={`url(#knobBase${id})`} />

      <g transform={`rotate(${rotation} 24 24)`}>
        <path d="M 15,9 C 15,5.6863 17.6863,3 21,3 L 27,3 C 30.3137,3 33,5.6863 33,9 C 32,15 32,33 33,38 A 8,6 0 0 1 26,45 L 22,45 A 8,6 0 0 1 15,38 C 16,33 16,15 15,9 Z" fill={`url(#gripGradient${id})`} />
                    <path d="M 15,9 C 15,5.6863 17.6863,3 21,3 L 27,3 C 30.3137,3 33,5.6863 33,9 C 32,15 32,33 33,38 A 8,6 0 0 1 26,45 L 22,45 A 8,6 0 0 1 15,38 C 16,33 16,15 15,9 Z" fill="none" stroke="#343434" strokeWidth="0.5" />        <ellipse cx="24" cy="5" rx="7" ry="3" fill="#3a3a3a" />
        <line x1="24" y1="3" x2="24" y2="7" stroke="#d0d0d0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="14" r="1.5" fill="#e0e0e0" />
      </g>
    </svg>
  );
};
