'use client';

import { ReactNode } from 'react';
import EmulatorProvider from './EmulatorProvider';

import CardDeckProvider from './CardDeckProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CardDeckProvider>
      <EmulatorProvider>{children}</EmulatorProvider>
    </CardDeckProvider>
  );
}
