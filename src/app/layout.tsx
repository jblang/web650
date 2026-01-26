import type { Metadata } from 'next';
import AppHeader from '@/components/Header';
import { Content } from '@carbon/react';
import './globals.scss';

export const metadata: Metadata = {
  title: 'IBM 650',
  description: 'IBM 650 Simulator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <Content>{children}</Content>
      </body>
    </html>
  );
}
