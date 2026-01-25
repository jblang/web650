'use client';

import React from 'react';
import FrontPanel from '@/components/FrontPanel';

export default function FrontPanelPage() {
  const number = 1234567890;
  const sign = '+';

  const formattedValue = `${sign}${number.toString().padStart(10, '0')}`;

  return (
    <div style={{ padding: '10px', backgroundColor: '#C0C0C0', color: 'black', display: 'inline-block' }}>
      <FrontPanel value={formattedValue} />
    </div>
  );
}
