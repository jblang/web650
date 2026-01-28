'use client';

import React from 'react';
import FrontPanel from '@/components/FrontPanel';
import { useFrontPanelControls } from '@/components/FrontPanel/useFrontPanelControls';

export default function FrontPanelPage() {
  const panelControls = useFrontPanelControls();

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ padding: '10px', backgroundColor: '#C0C0C0', color: 'black', display: 'inline-block' }}>
        <FrontPanel {...panelControls} />
      </div>
    </div>
  );
}
