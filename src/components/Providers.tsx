'use client';

import { ReactNode } from 'react';
import EmulatorProvider from './EmulatorProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return <EmulatorProvider>{children}</EmulatorProvider>;
}
