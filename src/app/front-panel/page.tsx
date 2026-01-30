'use client';

import React from 'react';
import FrontPanel from '@/components/FrontPanel';
import { useFrontPanelControls } from '@/components/FrontPanel/useFrontPanelControls';

export default function FrontPanelPage() {
  const panelControls = useFrontPanelControls();

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
        <FrontPanel {...panelControls} />
    </div>
  );
}
