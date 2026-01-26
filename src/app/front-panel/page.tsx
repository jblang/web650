'use client';

import React, { useState, useEffect } from 'react';
import DisplayRegister from '@/components/DisplayRegister';

export default function FrontPanelPage() {
  const [number, setNumber] = useState(1234567890);
  const [sign, setSign] = useState<'+' | '-'>('+');

  useEffect(() => {
    const interval = setInterval(() => {
      setNumber(n => (n + 1111111111) % 10000000000);
      setSign(s => s === '+' ? '-' : '+');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedValue = `${sign}${number.toString().padStart(10, '0')}`;

  return (
    <div style={{ padding: '20px', backgroundColor: '#C0C0C0', color: 'black' }}>
      <DisplayRegister value={formattedValue} />
    </div>
  );
}
