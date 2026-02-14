'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
} from '@carbon/react';

const links = [
  { href: '/front-panel', text: 'Front Panel' },
  { href: '/programming', text: 'Programming' },
  { href: '/reader', text: 'Reader' },
  { href: '/emulator', text: 'Emulator' },
  { href: '/docs', text: 'Documentation' },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <Header aria-label="SIMH i650">
      <HeaderName href="/" prefix="SIMH">
        i650
      </HeaderName>
      <HeaderNavigation aria-label="Navigation">
        {links.map((link) => (
          <HeaderMenuItem
            key={link.href}
            as={Link}
            href={link.href}
            isCurrentPage={pathname === link.href}
          >
            {link.text}
          </HeaderMenuItem>
        ))}
      </HeaderNavigation>
    </Header>
  );
}
