'use client';

import React, { memo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CategorySearchProps {
  value: string;
  isSearching?: boolean;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export const CategorySearch = memo(function CategorySearch({
  value,
  isSearching = false,
  onChange,
  onClear,
}: CategorySearchProps) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative group">
        <label htmlFor="mega-menu-category-search" className="sr-only">
          Buscar categorias de energia solar
        </label>
        
        <Search 
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-600" 
          aria-hidden="true"
        />

        <Input
          id="mega-menu-category-search"
          type="search"
          role="searchbox"
          autoComplete="off"
          placeholder="Buscar categoria..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-xl border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 transition-colors focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/15 touch-manipulation"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 opacity-70" aria-label="Filtrando categorias..." />
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
