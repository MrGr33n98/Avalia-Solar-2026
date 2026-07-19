'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type NavbarSearchProps = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  defaultValue?: string;
  onSearch: (query: string) => void;
};

export default function NavbarSearch({
  className,
  inputClassName,
  placeholder = 'Buscar produtos, marcas e muito mais...',
  defaultValue = '',
  onSearch
}: NavbarSearchProps) {
  const [query, setQuery] = useState(defaultValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch(q);
  };

  return (
    <form onSubmit={submit} className={cn('w-full', className)} role="search" aria-label="Buscar">
      <div className="flex h-[40px] w-full items-center rounded-lg border border-brand-border bg-white px-1.5 transition-colors hover:border-slate-400 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20 dark:border-white/10 dark:bg-[#081a2e]/82 dark:hover:border-white/30">
        <button
          type="submit"
          className="ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
        <Input
          id="navbar-search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className={cn(
            'h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 text-sm text-slate-900 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-slate-500',
            'dark:text-white dark:placeholder:text-white/50',
            inputClassName
          )}
        />
      </div>
    </form>
  );
}
