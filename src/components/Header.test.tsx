import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import AppHeader from './Header';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mockPathname = vi.hoisted(() => ({ value: '/' }));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname.value,
}));

// Mock Carbon components
vi.mock('@carbon/react', () => ({
  Header: ({ children, 'aria-label': ariaLabel }: { children: React.ReactNode; 'aria-label': string }) =>(
    <header data-testid="header" aria-label={ariaLabel}>
      {children}
    </header>
  ),
  HeaderName: ({ href, prefix, children }: { href: string; prefix: string; children: React.ReactNode }) =>(
    <a data-testid="header-name" href={href} data-prefix={prefix}>
      {children}
    </a>
  ),
  HeaderNavigation: ({ children, 'aria-label': ariaLabel }: { children: React.ReactNode; 'aria-label': string }) =>(
    <nav data-testid="header-navigation" aria-label={ariaLabel}>
      {children}
    </nav>
  ),
  HeaderMenuItem: ({ href, isCurrentPage, children }: { href: string; isCurrentPage?: boolean; children: React.ReactNode }) =>(
    <a
      data-testid="header-menu-item"
      href={href}
      data-is-current={String(isCurrentPage)}
    >
      {children}
    </a>
  ),
}));

const render = (ui: React.ReactElement) => {
  act(() => {
    root.render(ui);
  });
};

describe('Header', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockPathname.value = '/';
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders Header with correct aria-label', () => {
    render(<AppHeader />);

    const header = container.querySelector('[data-testid="header"]');
    expect(header).not.toBeNull();
    expect(header?.getAttribute('aria-label')).toBe('SIMH i650');
  });

  it('renders HeaderName with correct prefix and text', () => {
    render(<AppHeader />);

    const headerName = container.querySelector('[data-testid="header-name"]');
    expect(headerName).not.toBeNull();
    expect(headerName?.getAttribute('href')).toBe('/');
    expect(headerName?.getAttribute('data-prefix')).toBe('SIMH');
    expect(headerName?.textContent).toBe('i650');
  });

  it('renders HeaderNavigation with correct aria-label', () => {
    render(<AppHeader />);

    const navigation = container.querySelector('[data-testid="header-navigation"]');
    expect(navigation).not.toBeNull();
    expect(navigation?.getAttribute('aria-label')).toBe('Navigation');
  });

  it('renders all 9 navigation links', () => {
    render(<AppHeader />);

    const menuItems = container.querySelectorAll('[data-testid="header-menu-item"]');
    expect(menuItems.length).toBe(9);
  });

  it('renders Front Panel link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/front-panel'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Front Panel');
  });

  it('renders Programming link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/programming'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Programming');
  });

  it('renders Reader link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/reader'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Reader');
  });

  it('renders Punch link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/punch'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Punch');
  });

  it('renders Printer link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/printer'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Printer');
  });

  it('renders Tape link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/tape'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Tape');
  });

  it('renders Disk link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/ramac'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Disk');
  });

  it('renders Emulator link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/emulator'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Emulator');
  });

  it('renders Documentation link', () => {
    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/docs'
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('Documentation');
  });

  it('marks Front Panel as current page when pathname matches', () => {
    mockPathname.value = '/front-panel';

    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/front-panel'
    );
    expect(link?.getAttribute('data-is-current')).toBe('true');
  });

  it('does not mark Front Panel as current page when pathname does not match', () => {
    mockPathname.value = '/emulator';

    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/front-panel'
    );
    expect(link?.getAttribute('data-is-current')).toBe('false');
  });

  it('marks Programming as current page when pathname matches', () => {
    mockPathname.value = '/programming';

    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/programming'
    );
    expect(link?.getAttribute('data-is-current')).toBe('true');
  });

  it('marks Emulator as current page when pathname matches', () => {
    mockPathname.value = '/emulator';

    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/emulator'
    );
    expect(link?.getAttribute('data-is-current')).toBe('true');
  });

  it('marks Documentation as current page when pathname matches', () => {
    mockPathname.value = '/docs';

    render(<AppHeader />);

    const link = Array.from(container.querySelectorAll('[data-testid="header-menu-item"]')).find(
      (el) => el.getAttribute('href') === '/docs'
    );
    expect(link?.getAttribute('data-is-current')).toBe('true');
  });

  it('marks no page as current when on home page', () => {
    mockPathname.value = '/';

    render(<AppHeader />);

    const menuItems = container.querySelectorAll('[data-testid="header-menu-item"]');
    const currentItems = Array.from(menuItems).filter(
      (el) => el.getAttribute('data-is-current') === 'true'
    );
    expect(currentItems.length).toBe(0);
  });
});

/* @vitest-environment jsdom */
