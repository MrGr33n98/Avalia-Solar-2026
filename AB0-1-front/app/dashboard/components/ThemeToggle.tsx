'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    onThemeChange?.(nextTheme);
  };

  // Evitar estado intermediário enquanto next-themes resolve o tema real.
  const isDark = resolvedTheme === 'dark';
  const isLoading = !resolvedTheme;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      disabled={isLoading}
      className="relative overflow-hidden transition-all duration-300"
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <Sun
        className={`h-5 w-5 absolute transition-all duration-300 ${
          !isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        }`}
        aria-hidden="true"
      />
      <Moon
        className={`h-5 w-5 absolute transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
        aria-hidden="true"
      />
    </Button>
  );
}
