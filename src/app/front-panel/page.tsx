'use client';

import React from 'react';
import FrontPanel from '@/components/FrontPanel';
import { useFrontPanelEmulator } from '@/components/FrontPanel/useFrontPanelEmulator';

export default function FrontPanelPage() {
  const emulatorProps = useFrontPanelEmulator();

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ padding: '10px', backgroundColor: '#C0C0C0', color: 'black', display: 'inline-block' }}>
        <FrontPanel {...emulatorProps} />
      </div>
    </div>
  );
}
