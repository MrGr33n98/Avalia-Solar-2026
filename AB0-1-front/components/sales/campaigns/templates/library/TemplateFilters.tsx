'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface TemplateFiltersProps {
  category: string;
  onCategoryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  categoriesList: string[];
  onReset: () => void;
}

export function TemplateFilters({
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  categoriesList,
  onReset,
}: TemplateFiltersProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-semibold text-sm">Filtros</h4>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-7 px-2 text-xs text-muted-foreground gap-1">
          <RotateCcw className="h-3 w-3" />
          Limpar
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Categoria</Label>
          <Select value={category || 'all'} onValueChange={(val) => onCategoryChange(val === 'all' ? '' : val)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categoriesList.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Status</Label>
          <Select value={status || 'all'} onValueChange={(val) => onStatusChange(val === 'all' ? '' : val)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Ordenação</Label>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Mais recentes</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
