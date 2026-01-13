'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type NavbarSearchProps = {
  className?: string;
  placeholder?: string;
};

export default function NavbarSearch({ className, placeholder = 'Sugestões aqui' }: NavbarSearchProps) {
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-10 pl-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
        />
      </div>
    </form>
  );
}

