'use client';

import { ReactNode } from 'react';

interface UIShellProps {
  children: ReactNode;
}

export default function UIShell({ children }: UIShellProps) {
  return <>{children}</>;
}
