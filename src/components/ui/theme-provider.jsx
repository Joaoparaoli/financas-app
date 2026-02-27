import { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const themes = {
  light: {
    name: 'Light',
    colors: {
      background: '0 0% 98%',
      foreground: '222.2 47.4% 11.2%',
      card: '0 0% 100%',
      'card-foreground': '222.2 47.4% 11.2%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 47.4% 11.2%',
      primary: '142 76% 36%',
      'primary-foreground': '0 0% 100%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 47.4% 11.2%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 100%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '142 76% 36%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
      info: '199 89% 48%',
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '142 70% 45%',
      'primary-foreground': '222.2 84% 4.9%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '142 70% 45%',
      success: '142 70% 45%',
      warning: '38 92% 50%',
      info: '199 89% 48%',
    }
  },
  ocean: {
    name: 'Ocean',
    colors: {
      background: '210 40% 96%',
      foreground: '217.2 32.6% 17.5%',
      card: '210 40% 98%',
      'card-foreground': '217.2 32.6% 17.5%',
      popover: '210 40% 98%',
      'popover-foreground': '217.2 32.6% 17.5%',
      primary: '199 89% 48%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 94%',
      'secondary-foreground': '217.2 32.6% 17.5%',
      muted: '210 40% 92%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '210 40% 94%',
      'accent-foreground': '217.2 32.6% 17.5%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '199 89% 48%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
      info: '199 89% 48%',
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      background: '120 20% 95%',
      foreground: '142 76% 15%',
      card: '120 20% 98%',
      'card-foreground': '142 76% 15%',
      popover: '120 20% 98%',
      'popover-foreground': '142 76% 15%',
      primary: '142 76% 36%',
      'primary-foreground': '120 20% 98%',
      secondary: '120 20% 90%',
      'secondary-foreground': '142 76% 15%',
      muted: '120 20% 85%',
      'muted-foreground': '142 76% 45%',
      accent: '120 20% 90%',
      'accent-foreground': '142 76% 15%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '120 20% 98%',
      border: '120 20% 80%',
      input: '120 20% 80%',
      ring: '142 76% 36%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
      info: '199 89% 48%',
    }
  },
  sunset: {
    name: 'Sunset',
    colors: {
      background: '15 40% 96%',
      foreground: '15 20% 15%',
      card: '15 40% 98%',
      'card-foreground': '15 20% 15%',
      popover: '15 40% 98%',
      'popover-foreground': '15 20% 15%',
      primary: '15 76% 50%',
      'primary-foreground': '15 40% 98%',
      secondary: '15 40% 92%',
      'secondary-foreground': '15 20% 15%',
      muted: '15 40% 88%',
      'muted-foreground': '15 20% 50%',
      accent: '15 40% 92%',
      'accent-foreground': '15 20% 15%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '15 40% 98%',
      border: '15 40% 85%',
      input: '15 40% 85%',
      ring: '15 76% 50%',
      success: '142 76% 36%',
      warning: '38 92% 50%',
      info: '199 89% 48%',
    }
  }
};

const ThemeContext = createContext({});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [themeConfig, setThemeConfig] = useState(themes.light);

  const setTheme = (themeName) => {
    const theme = themes[themeName];
    if (theme) {
      setCurrentTheme(themeName);
      setThemeConfig(theme);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', themeName);
      }
      
      // Apply theme to CSS variables
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value);
        });

        // Remove dark class if switching away from dark theme
        if (themeName !== 'dark') {
          root.classList.remove('dark');
        } else {
          root.classList.add('dark');
        }
      }
    }
  };

  useEffect(() => {
    // Load saved theme or default to light
    if (typeof window === 'undefined') return;
    const savedTheme = window.localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  const availableThemes = Object.keys(themes);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      themeConfig, 
      setTheme, 
      availableThemes,
      themes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeSelector({ className }) {
  const { currentTheme, setTheme, availableThemes, themes } = useTheme();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {availableThemes.map((themeName) => (
        <button
          key={themeName}
          onClick={() => setTheme(themeName)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
            currentTheme === themeName
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {themes[themeName].name}
        </button>
      ))}
    </div>
  );
}
