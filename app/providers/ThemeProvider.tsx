'use client';

import { createContext, useContext, useMemo, useState } from 'react';

import type { Theme } from '@/entities/user';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_COOKIE = 'wanda-theme';
const DEFAULT_THEME: Theme = 'dark';
const ONE_YEAR_SECONDS = 31_536_000;

async function persistThemeCookie(value: Theme) {
  if ('cookieStore' in globalThis) {
    await (
      globalThis as unknown as {
        cookieStore: { set: (opts: Record<string, unknown>) => Promise<void> };
      }
    ).cookieStore.set({
      name: THEME_COOKIE,
      value,
      path: '/',
      sameSite: 'lax',
      maxAge: ONE_YEAR_SECONDS,
    });
  }
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? DEFAULT_THEME);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    void persistThemeCookie(next);
    document.documentElement.dataset.theme = next;
  };

  const value = useMemo(() => {
    return { theme, setTheme };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
