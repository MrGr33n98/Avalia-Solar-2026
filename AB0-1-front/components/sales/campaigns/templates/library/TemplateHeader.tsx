'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

interface TemplateHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onNewTemplate: () => void;
}

export function TemplateHeader({ search, onSearchChange, onNewTemplate }: TemplateHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates de E-mail</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie e componha modelos reutilizáveis para suas campanhas de vendas.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou assunto..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 text-sm"
          />
        </div>

        <Button onClick={onNewTemplate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo template
        </Button>
      </div>
    </div>
  );
}
