'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from 'react';
import styles from './AppThemeProvider.module.scss';

type CarbonTheme = 'white' | 'g100';
const THEME_STORAGE_KEY = 'app-theme';
const THEME_STORAGE_EVENT = 'app-theme-change';
const THEME_COOKIE_KEY = 'app-theme';

interface AppThemeContextValue {
  theme: CarbonTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);
const isCarbonTheme = (value: string): value is CarbonTheme => value === 'white' || value === 'g100';

const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getPersistedTheme = (): CarbonTheme | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const persistedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return persistedTheme && isCarbonTheme(persistedTheme) ? persistedTheme : null;
  } catch {
    return null;
  }
};

const applyDocumentTheme = (theme: CarbonTheme) => {
  const root = document.documentElement;
  root.setAttribute('data-app-theme', theme);
  root.classList.remove('cds--white', 'cds--g100');
  root.classList.add(theme === 'g100' ? 'cds--g100' : 'cds--white', 'cds--layer-one');
  root.style.backgroundColor = theme === 'g100' ? '#161616' : '#ffffff';
  root.style.colorScheme = theme === 'g100' ? 'dark' : 'light';
  if (document.body) {
    document.body.style.backgroundColor = theme === 'g100' ? '#161616' : '#ffffff';
  }
};

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemPrefersDark = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => onStoreChange();
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    },
    getSystemPrefersDark,
    () => false
  );
  const persistedTheme = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const handleStorage = (event: StorageEvent) => {
        if (event.key && event.key !== THEME_STORAGE_KEY) {
          return;
        }
        onStoreChange();
      };
      const handleLocalThemeChange = () => onStoreChange();

      window.addEventListener('storage', handleStorage);
      window.addEventListener(THEME_STORAGE_EVENT, handleLocalThemeChange);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(THEME_STORAGE_EVENT, handleLocalThemeChange);
      };
    },
    getPersistedTheme,
    () => null
  );
  const [sessionTheme, setSessionTheme] = useState<CarbonTheme | null>(null);

  const theme: CarbonTheme =
    sessionTheme ?? persistedTheme ?? (systemPrefersDark ? 'g100' : 'white');

  const toggleTheme = useCallback(() => {
    const nextTheme: CarbonTheme = theme === 'white' ? 'g100' : 'white';
    setSessionTheme(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      document.cookie = `${THEME_COOKIE_KEY}=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
      window.dispatchEvent(new Event(THEME_STORAGE_EVENT));
    } catch {
      // Ignore storage write failures; theme still works for this session.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'g100',
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  return (
    <AppThemeContext.Provider value={value}>
      <div className={styles.themeRoot}>{children}</div>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}
