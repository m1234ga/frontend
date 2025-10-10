'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('chat-app-theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Save theme to localStorage and apply to document
    localStorage.setItem('chat-app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    console.log('Theme changed to:', theme); // Debug log
    
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    if (theme === 'light') {
      // Fancy Light Theme - Pure Black and White
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f8f8');
      root.style.setProperty('--bg-tertiary', '#f0f0f0');
      root.style.setProperty('--bg-quaternary', '#e8e8e8');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#333333');
      root.style.setProperty('--text-tertiary', '#666666');
      root.style.setProperty('--text-accent', '#000000');
      root.style.setProperty('--border-primary', '#e0e0e0');
      root.style.setProperty('--border-secondary', '#d0d0d0');
      root.style.setProperty('--border-accent', '#000000');
      root.style.setProperty('--accent-primary', '#000000');
      root.style.setProperty('--accent-secondary', '#333333');
      root.style.setProperty('--accent-tertiary', '#666666');
      root.style.setProperty('--shadow-primary', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--shadow-secondary', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-glow', '0 0 20px rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #000000 0%, #333333 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)');
      root.style.setProperty('--gradient-tertiary', 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)');
    } else {
      // Fancy Dark Theme - Pure Black and White
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#1a1a1a');
      root.style.setProperty('--bg-tertiary', '#2a2a2a');
      root.style.setProperty('--bg-quaternary', '#3a3a3a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#e0e0e0');
      root.style.setProperty('--text-tertiary', '#a0a0a0');
      root.style.setProperty('--text-accent', '#ffffff');
      root.style.setProperty('--border-primary', '#404040');
      root.style.setProperty('--border-secondary', '#606060');
      root.style.setProperty('--border-accent', '#ffffff');
      root.style.setProperty('--accent-primary', '#ffffff');
      root.style.setProperty('--accent-secondary', '#e0e0e0');
      root.style.setProperty('--accent-tertiary', '#c0c0c0');
      root.style.setProperty('--shadow-primary', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--shadow-secondary', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--shadow-glow', '0 0 20px rgba(255, 255, 255, 0.3)');
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)');
      root.style.setProperty('--gradient-tertiary', 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)');
    }
    
    console.log('CSS variables applied for theme:', theme); // Debug log
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
