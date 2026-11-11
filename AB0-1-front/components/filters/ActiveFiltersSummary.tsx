'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CompanyFilters } from './types';
import { Badge } from '@/components/ui/badge';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';

interface ActiveFiltersSummaryProps {
  filters: CompanyFilters;
  onRemove: (key: keyof CompanyFilters, value?: unknown) => void;
}

export const ActiveFiltersSummary: React.FC<ActiveFiltersSummaryProps> = ({
  filters,
  onRemove,
}) => {
  const { categories } = useCategoriesTree();

  const getCategoryName = (id: number) => {
    for (const root of categories) {
      if (root.id === id) return root.name;
      const child = root.children.find((c) => c.id === id);
      if (child) return child.name;
    }
    return 'Categoria selecionada';
  };

  const activeChips: { key: keyof CompanyFilters; value: unknown; label: string }[] = [];

  if (filters.search) {
    activeChips.push({ key: 'search', value: filters.search, label: `Busca: "${filters.search}"` });
  }

  filters.state.forEach((s) => activeChips.push({ key: 'state', value: s, label: s }));
  filters.city.forEach((c) => activeChips.push({ key: 'city', value: c, label: c }));
  filters.category_ids.forEach((id) =>
    activeChips.push({ key: 'category_ids', value: id, label: getCategoryName(id) })
  );

  if (filters.min_rating) {
    activeChips.push({
      key: 'min_rating',
      value: filters.min_rating,
      label: `${filters.min_rating}+ Estrelas`,
    });
  }

  if (filters.verified) activeChips.push({ key: 'verified', value: true, label: 'Verificadas' });
  if (filters.featured) activeChips.push({ key: 'featured', value: true, label: 'Destaque' });
  if (filters.financing_enabled)
    activeChips.push({ key: 'financing_enabled', value: true, label: 'Crédito' });
  if (filters.whatsapp_enabled)
    activeChips.push({ key: 'whatsapp_enabled', value: true, label: 'WhatsApp' });
  if (filters.has_reviews)
    activeChips.push({ key: 'has_reviews', value: true, label: 'Com avaliações' });

  if (activeChips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto select-none no-scrollbar px-3 py-1.5 md:space-y-3 md:flex-col md:items-start md:overflow-visible md:px-5 md:py-4 border-b border-slate-200">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Filtros ativos ({activeChips.length})
        </span>
      </div>
      <div className="flex items-center gap-1.5 md:flex-wrap shrink-0 md:shrink">
        {activeChips.map((chip, idx) => (
          <Badge
            key={`${chip.key}-${idx}`}
            variant="secondary"
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-0 text-blue-700 hover:bg-blue-100 shrink-0"
          >
            <span className="text-xs font-semibold">{chip.label}</span>
            <button
              type="button"
              onClick={() => onRemove(chip.key, chip.value)}
              aria-label={`Remover filtro ${chip.label}`}
              className="relative flex h-5 w-5 min-h-5 min-w-5 items-center justify-center rounded-sm hover:bg-blue-200 touch-manipulation focus:outline-none focus:ring-1 focus:ring-blue-500 after:absolute after:-inset-2.5 after:content-['']"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
