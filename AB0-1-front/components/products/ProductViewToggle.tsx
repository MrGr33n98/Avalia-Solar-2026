'use client';

import { Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ProductViewMode = 'list' | 'grid';

interface ProductViewToggleProps {
  viewMode: ProductViewMode;
  onViewModeChange: (mode: ProductViewMode) => void;
}

/**
 * O seletor ocupa 48px e seus botões 44px.
 * Sobrescreve localmente o mínimo global de 48px do PWA,
 * evitando que o estado selecionado ultrapasse a borda do grupo.
 */
export function ProductViewToggle({ viewMode, onViewModeChange }: ProductViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Modo de visualização dos produtos"
      data-testid="products-view-toggle"
      className="inline-flex h-12 shrink-0 items-center gap-0 rounded-xl border border-slate-200 bg-white p-px shadow-sm"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Visualização em lista"
        aria-pressed={viewMode === 'list'}
        onClick={() => onViewModeChange('list')}
        className={cn(
          'h-11 w-11 !min-h-11 !min-w-11 shrink-0 rounded-lg p-0 transition-colors',
          viewMode === 'list'
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-700'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        )}
      >
        <List className="h-[18px] w-[18px]" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Visualização em grade"
        aria-pressed={viewMode === 'grid'}
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'h-11 w-11 !min-h-11 !min-w-11 shrink-0 rounded-lg p-0 transition-colors',
          viewMode === 'grid'
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-700'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        )}
      >
        <Grid className="h-[18px] w-[18px]" aria-hidden="true" />
      </Button>
    </div>
  );
}
