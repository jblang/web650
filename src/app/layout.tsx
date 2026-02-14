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
  const themeBootstrap = `
    (function () {
      try {
        var persisted = window.localStorage.getItem('app-theme');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = persisted === 'white' || persisted === 'g100'
          ? persisted
          : (prefersDark ? 'g100' : 'white');
        var bg = theme === 'g100' ? '#161616' : '#ffffff';
        var root = document.documentElement;
        root.setAttribute('data-app-theme', theme);
        root.classList.remove('cds--white', 'cds--g100');
        root.classList.add(theme === 'g100' ? 'cds--g100' : 'cds--white', 'cds--layer-one');
        root.style.backgroundColor = bg;
        root.style.colorScheme = theme === 'g100' ? 'dark' : 'light';
        if (document.body) {
          document.body.style.backgroundColor = bg;
        } else {
          document.addEventListener('DOMContentLoaded', function () {
            document.body.style.backgroundColor = bg;
          }, { once: true });
        }
      } catch (e) {
        // no-op
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          html, body { background-color: #ffffff; }
          @media (prefers-color-scheme: dark) {
            html, body { background-color: #161616; }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppHeader />
          <Content>{children}</Content>
        </Providers>
      </body>
    </html>
  );
}
