'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavbarSearchProps = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
};

export default function NavbarSearch({
  className,
  inputClassName,
  placeholder = 'Sugestões aqui'
}: NavbarSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}&sort=rating&page=1`);
  };

  return (
    <form onSubmit={submit} className={cn('w-full', className)} role="search" aria-label="Buscar">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40 dark:text-white/45"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className={cn(
            'h-14 rounded-[1.4rem] border-slate-200/80 bg-white/96 pl-12 pr-28 text-[15px] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-colors',
            'placeholder:text-foreground/45 hover:border-slate-300 hover:bg-white focus-visible:border-brand-blue/30 focus-visible:ring-brand-blue/20',
            'dark:border-white/10 dark:bg-[#081a2e]/82 dark:text-white dark:placeholder:text-white/40 dark:hover:bg-[#0b2037]',
            inputClassName
          )}
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-full bg-brand-blue px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_20px_-12px_rgba(0,86,210,0.8)] hover:bg-brand-blue-light"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </div>
    </form>
  );
}
