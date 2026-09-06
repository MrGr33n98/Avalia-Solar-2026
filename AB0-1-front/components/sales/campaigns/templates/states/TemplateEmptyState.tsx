'use client';

import { Button } from '@/components/ui/button';
import { Mail, Plus } from 'lucide-react';

interface TemplateEmptyStateProps {
  search?: string;
  onNewTemplate: () => void;
  onClearFilters?: () => void;
}

export function TemplateEmptyState({ search, onNewTemplate, onClearFilters }: TemplateEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border rounded-lg bg-card/50 space-y-4">
      <div className="p-4 rounded-full bg-muted text-muted-foreground">
        <Mail className="h-8 w-8" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="font-semibold text-lg">
          {search ? 'Nenhum template encontrado' : 'Nenhum template cadastrado'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {search
            ? `Não foram encontrados resultados para "${search}". Tente ajustar os termos ou filtros.`
            : 'Crie seu primeiro modelo de e-mail estruturado para acelerar o envio de campanhas de vendas.'}
        </p>
      </div>

      <div className="flex gap-3">
        {search && onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        )}

        <Button onClick={onNewTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo template
        </Button>
      </div>
    </div>
  );
}
