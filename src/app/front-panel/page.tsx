'use client';

import React, { useEffect } from 'react';
import FrontPanel from '@/components/FrontPanel';
import { useFrontPanelControls } from '@/components/FrontPanel/useFrontPanelControls';
import { setStateStreamActive } from '@/lib/simh/i650/service';

export default function FrontPanelPage() {
  const panelControls = useFrontPanelControls();

  useEffect(() => {
    void setStateStreamActive(true);
    return () => {
      void setStateStreamActive(false);
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
        <FrontPanel {...panelControls} />
    </div>
  );
}
