import type { Metadata } from 'next';
import AppHeader from '@/components/Header';
import Providers from '@/components/Providers';
import { Content } from '@carbon/react';
import './globals.scss';

export const metadata: Metadata = {
  title: 'SIMH i650',
  description: 'IBM 650 Simulator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <AppHeader />
          <Content>{children}</Content>
        </Providers>
      </body>
    </html>
  );
}
