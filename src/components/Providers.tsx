'use client';

import { ReactNode } from 'react';
import { EmulatorStateProvider } from './EmulatorStateProvider';
import { EmulatorConsoleProvider } from './EmulatorConsoleProvider';
import { EmulatorActionsProvider } from './EmulatorActionsProvider';

import CardDeckProvider from './CardDeckProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CardDeckProvider>
      <EmulatorStateProvider>
        <EmulatorConsoleProvider>
          <EmulatorActionsProvider>{children}</EmulatorActionsProvider>
        </EmulatorConsoleProvider>
      </EmulatorStateProvider>
    </CardDeckProvider>
  );
}
