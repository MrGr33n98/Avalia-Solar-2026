'use client';

import * as React from 'react';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeToggleProps {
  onThemeChange?: (theme: 'light' | 'darkmodern' | 'monokai') => void;
}

export default function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();

  const handleSelectTheme = (newTheme: 'light' | 'darkmodern' | 'monokai') => {
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  const getThemeIcon = (currentTheme?: string) => {
    switch (currentTheme) {
      case 'monokai':
        return <Palette className="h-4 w-4 text-pink-500" />;
      case 'darkmodern':
        return <Moon className="h-4 w-4 text-blue-500" />;
      case 'light':
      default:
        return <Sun className="h-4 w-4 text-amber-500" />;
    }
  };

  const getThemeLabel = (currentTheme?: string) => {
    switch (currentTheme) {
      case 'monokai':
        return 'Monokai';
      case 'darkmodern':
        return 'Dark Modern';
      case 'light':
      default:
        return 'Claro';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 transition-all duration-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Alterar tema"
          aria-label="Alterar tema"
        >
          {getThemeIcon(theme)}
          <span className="text-xs font-medium">{getThemeLabel(theme)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-lg p-1 z-50">
        <DropdownMenuItem
          onClick={() => handleSelectTheme('light')}
          className="flex items-center justify-between px-3 py-2 text-xs rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Claro</span>
          </div>
          {theme === 'light' && <Check className="h-3.5 w-3.5 text-blue-600" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelectTheme('darkmodern')}
          className="flex items-center justify-between px-3 py-2 text-xs rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-blue-500" />
            <span>Dark Modern</span>
          </div>
          {theme === 'darkmodern' && <Check className="h-3.5 w-3.5 text-blue-600" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelectTheme('monokai')}
          className="flex items-center justify-between px-3 py-2 text-xs rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-pink-500" />
            <span>Monokai</span>
          </div>
          {theme === 'monokai' && <Check className="h-3.5 w-3.5 text-blue-600" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
