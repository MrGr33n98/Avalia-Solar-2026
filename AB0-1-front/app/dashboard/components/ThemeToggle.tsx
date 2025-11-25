'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage or system preference
    const savedTheme = localStorage.getItem('dashboard-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      onThemeChange?.(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      onThemeChange?.(systemTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
    onThemeChange?.(newTheme);
    
    // Update document class for global theming
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden transition-all duration-300"
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      <Sun
        className={`h-5 w-5 absolute transition-all duration-300 ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />
      <Moon
        className={`h-5 w-5 absolute transition-all duration-300 ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </Button>
  );
}
