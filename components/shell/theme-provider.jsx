'use client';

import * as React from 'react';
import { DEFAULT_THEME, THEME_COOKIE, THEMES, normalizeTheme } from '@/lib/themes';

const ThemeContext = React.createContext({ theme: DEFAULT_THEME, setTheme: () => {}, themes: THEMES });

export function ThemeProvider({ initialTheme = DEFAULT_THEME, children }) {
  const [theme, setThemeState] = React.useState(() => normalizeTheme(initialTheme));

  // The bootstrap script may have resolved a different theme from localStorage
  // than the cookie the server rendered with. Sync React state to the DOM once.
  React.useEffect(() => {
    const applied = document.documentElement.getAttribute('data-theme');
    if (applied && applied !== theme) setThemeState(normalizeTheme(applied));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = React.useCallback((next) => {
    const value = normalizeTheme(next);
    setThemeState(value);
    document.documentElement.setAttribute('data-theme', value);
    try {
      window.localStorage.setItem(THEME_COOKIE, value);
    } catch {
      // Private browsing can block storage; the cookie below still persists it.
    }
    document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
