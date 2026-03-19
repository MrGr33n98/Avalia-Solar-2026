'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
      <div className="flex h-12 w-full items-center rounded-2xl border border-[#ededed] bg-white px-2 transition-colors hover:border-[#999] focus-within:ring-2 focus-within:ring-brand-blue/30 dark:border-white/10 dark:bg-[#081a2e]/82 dark:hover:border-white/30">
        <Search className="ml-2 h-5 w-5 text-slate-500" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className={cn(
            'h-full flex-1 rounded-none border-0 bg-transparent px-3 text-[16px] text-slate-900 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-slate-500',
            'dark:text-white dark:placeholder:text-white/50',
            inputClassName
          )}
        />
        <Button
          type="submit"
          size="sm"
          className="h-10 rounded-xl bg-brand-blue px-4 text-[12px] font-semibold tracking-[0.08em] text-white shadow-[0_12px_24px_-18px_rgba(45,106,224,0.6)] transition-colors hover:bg-brand-blue-light"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </div>
    </form>
  );
}
