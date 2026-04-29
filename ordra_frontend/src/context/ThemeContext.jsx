import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Try to load from localStorage, fallback to system preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ordra_theme');
    return saved || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Save preference
    localStorage.setItem('ordra_theme', theme);

    // Apply specific theme or listen to system
    const applyTheme = (t) => {
      let resolvedTheme = t;
      
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      root.setAttribute('data-theme', resolvedTheme);
      
      // Also handle body background to prevent flashes
      if (resolvedTheme === 'dark') {
        document.body.style.backgroundColor = '#0f172a'; // slate-950
      } else {
        document.body.style.backgroundColor = '#ffffff';
      }
    };

    applyTheme(theme);

    // Listen for system changes if mode is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
