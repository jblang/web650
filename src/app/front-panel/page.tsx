'use client';

import React from 'react';
import FrontPanel from '@/components/FrontPanel';
import { useFrontPanelTestMode } from '@/components/FrontPanel/useFrontPanelTestMode';

export default function FrontPanelPage() {
  const testModeProps = useFrontPanelTestMode();

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ padding: '10px', backgroundColor: '#C0C0C0', color: 'black', display: 'inline-block' }}>
        <FrontPanel {...testModeProps} />
      </div>
    </div>
  );
}
