import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * @deprecated Use ThemeProvider from next-themes directly in _app.tsx.
 * This wrapper is kept for backward compatibility with the existing useTheme hook.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      let resolved: ResolvedTheme;
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    };

    updateTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  };
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return (
    <ThemeContext.Provider value={{ 
      theme: theme as Theme, 
      setTheme: (t: Theme) => setTheme(t), 
      resolvedTheme: resolvedTheme as ResolvedTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback to next-themes directly if provider is missing
    try {
      return useNextTheme();
    } catch {
      throw new Error('useTheme must be used within a ThemeProvider');
    }
  }
  return context;
}
