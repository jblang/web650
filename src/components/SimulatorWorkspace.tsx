'use client';

import { useState } from 'react';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import EmulatorConsole from './EmulatorConsole';
import SimulatorDebugTab from './SimulatorDebugTab';

export default function SimulatorWorkspace() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex: nextIndex }) => setSelectedIndex(nextIndex)}>
        <TabList aria-label="Simulator tabs" contained>
          <Tab>Console</Tab>
          <Tab>Debugging</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <EmulatorConsole />
          </TabPanel>
          <TabPanel>
            <SimulatorDebugTab active={selectedIndex === 1} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
