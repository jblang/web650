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
  { href: '/program', text: 'Programming' },
  { href: '/punch', text: 'Reader / Punch' },
  { href: '/printer', text: 'Printer' },
  { href: '/tape', text: 'Magnetic Tape' },
  { href: '/ramac', text: 'RAMAC' },
  { href: '/emulator', text: 'Emulator' },
  { href: '/docs', text: 'Documentation' },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <Header aria-label="IBM 650">
      <HeaderName href="#" prefix="IBM">
        650
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
