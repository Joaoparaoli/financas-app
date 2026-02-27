"use client";

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === 'system' ? resolvedTheme : theme;

  const order = ['light', 'dark'];
  const currentIndex = order.indexOf(current ?? 'light');
  const nextTheme = order[(currentIndex + 1) % order.length];

  const iconMap = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={() => setTheme(nextTheme)}
      title={`Tema atual: ${current}. Clique para alternar.`}
    >
      {iconMap[current]}
      <span className="text-sm capitalize">{current}</span>
    </Button>
  );
}
