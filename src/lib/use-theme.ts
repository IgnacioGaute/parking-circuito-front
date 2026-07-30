'use client';

import { useEffect, useState } from 'react';

export type ThemeName = 'dark' | 'light';

const STORAGE_KEY = 'theme';

function readStoredTheme(): ThemeName {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function useTheme(): { theme: ThemeName; toggleTheme: () => void } {
  const [theme, setTheme] = useState<ThemeName>('dark');

  useEffect(() => {
    // The blocking script in <head> (see layout.tsx) already set the DOM
    // attribute before hydration to avoid a flash of the wrong theme; this
    // just syncs React state to match what's already on the page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readStoredTheme());
  }, []);

  const toggleTheme = () => {
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / storage disabled — theme just won't persist.
    }
    setTheme(next);
  };

  return { theme, toggleTheme };
}
