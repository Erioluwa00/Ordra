import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Try to load from localStorage, fallback to system preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ordra_theme');
    return saved || 'light';
  });

  const location = useLocation();

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
      
      // Force light mode on non-app routes
      const isAppRoute = location.pathname.startsWith('/app');
      if (!isAppRoute) {
        resolvedTheme = 'light';
      }
      
      root.setAttribute('data-theme', resolvedTheme);
      
      // Also handle body and html background to prevent flashes and fix overscroll
      if (resolvedTheme === 'dark') {
        document.body.style.backgroundColor = '#0f172a'; // slate-950
        document.documentElement.style.backgroundColor = '#0f172a';
      } else {
        document.body.style.backgroundColor = '#fafafa';
        document.documentElement.style.backgroundColor = '#fafafa';
      }

      // Update theme-color meta tag for mobile status bar and overscroll
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.content = resolvedTheme === 'dark' ? '#0f172a' : '#fafafa';
    };

    applyTheme(theme);

    // Listen for system changes if mode is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, location.pathname]);

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
