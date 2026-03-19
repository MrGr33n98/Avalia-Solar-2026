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
      <div className="relative flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/96 px-2.5 py-1 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.35)] transition-colors hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-[#081a2e]/82 dark:hover:bg-[#0b2037]">
        <Search className="ml-2 h-5 w-5 text-foreground/45 dark:text-white/50" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className={cn(
            'h-11 flex-1 border-0 bg-transparent px-0 text-[15px] font-medium text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
            'placeholder:text-foreground/45',
            'dark:text-white dark:placeholder:text-white/40',
            inputClassName
          )}
        />
        <Button
          type="submit"
          size="sm"
          className="h-10 rounded-full border border-slate-200/70 bg-slate-50 px-4 text-[12px] font-semibold tracking-[0.08em] text-foreground/80 shadow-[0_10px_20px_-16px_rgba(15,23,42,0.25)] transition-colors hover:border-slate-300 hover:bg-white hover:text-foreground dark:border-white/10 dark:bg-white/8 dark:text-white/80 dark:hover:bg-white/14"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </div>
    </form>
  );
}
