'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CategorySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategorySearch: React.FC<CategorySearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <Input
          type="text"
          placeholder="Buscar categoria..."
          aria-label="Buscar categoria"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-9 h-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-lg text-sm transition-all"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-slate-200 rounded-md"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        )}
      </div>
    </div>
  );
};
