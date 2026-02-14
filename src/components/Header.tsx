'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Header,
  HeaderGlobalBar,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
} from '@carbon/react';
import { Sun, Moon } from '@carbon/icons-react';
import { useAppTheme } from './AppThemeProvider';
import styles from './Header.module.scss';

const links = [
  { href: '/front-panel', text: 'Front Panel' },
  { href: '/programming', text: 'Programming' },
  { href: '/reader', text: 'Reader' },
  { href: '/emulator', text: 'Emulator' },
  { href: '/docs', text: 'Documentation' },
];

const normalizePath = (path: string) => {
  if (path === '/') {
    return '/';
  }

  return path.replace(/\/+$/, '');
};

export default function AppHeader() {
  const pathname = usePathname();
  const normalizedPathname = normalizePath(pathname ?? '/');
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <Header aria-label="SIMH i650">
      <HeaderName as={Link} href="/" prefix="SIMH">
        i650
      </HeaderName>
      <HeaderNavigation aria-label="Navigation">
        {links.map((link) => (
          <HeaderMenuItem
            key={link.href}
            as={Link}
            href={link.href}
            isCurrentPage={normalizedPathname === normalizePath(link.href)}
          >
            {link.text}
          </HeaderMenuItem>
        ))}
      </HeaderNavigation>
      <HeaderGlobalBar className={styles.globalBar}>
        <div className={styles.themeToggle}>
          <span className={styles.themeIconSlot}>
            <Sun size={16} aria-label="Light theme" className={styles.themeIcon} />
          </span>
          <button
            id="theme-toggle"
            type="button"
            data-testid="theme-toggle"
            className={styles.themeSwitch}
            role="switch"
            data-toggled={String(isDark)}
            aria-checked={isDark}
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            <span className={styles.themeSwitchTrack}>
              <span className={styles.themeSwitchThumb} />
            </span>
          </button>
          <span className={styles.themeIconSlot}>
            <Moon size={16} aria-label="Dark theme" className={styles.themeIcon} />
          </span>
        </div>
      </HeaderGlobalBar>
    </Header>
  );
}
