'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
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
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35 dark:text-white/40"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'h-11 rounded-[1.1rem] border-black/10 bg-white/82 pl-11 pr-4 text-sm text-foreground shadow-none transition-colors',
            'placeholder:text-foreground/40 hover:bg-white focus-visible:border-brand-blue/30 focus-visible:ring-brand-blue/20',
            'dark:border-white/10 dark:bg-[#081a2e]/78 dark:text-white dark:placeholder:text-white/35 dark:hover:bg-[#0b2037]',
            inputClassName
          )}
        />
      </div>
    </form>
  );
}
