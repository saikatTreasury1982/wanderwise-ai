'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { THEMES, DEFAULT_THEME, isValidTheme, type ThemeKey } from '../lib/config/theme';

const STORAGE_KEY = 'wl-theme';

type ThemeContextValue = {
  theme: ThemeKey;
  setTheme: (next: ThemeKey) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const [theme, setThemeState] = useState<ThemeKey>(
    isValidTheme(initialTheme) ? initialTheme : DEFAULT_THEME
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(stored) && stored !== theme) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeKey) => {
    if (!isValidTheme(next)) return;
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}