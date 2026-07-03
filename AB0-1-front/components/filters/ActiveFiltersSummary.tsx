'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CompanyFilters } from './types';
import { Badge } from '@/components/ui/badge';
import { useCategoriesTree } from '@/hooks/useCategoriesTree';

interface ActiveFiltersSummaryProps {
  filters: CompanyFilters;
  onRemove: (key: keyof CompanyFilters, value?: any) => void;
}

export const ActiveFiltersSummary: React.FC<ActiveFiltersSummaryProps> = ({
  filters,
  onRemove,
}) => {
  const { categories } = useCategoriesTree();

  const getCategoryName = (id: number) => {
    for (const root of categories) {
      if (root.id === id) return root.name;
      const child = root.children.find(c => c.id === id);
      if (child) return child.name;
    }
    return `Cat: ${id}`;
  };

  const activeChips: { key: keyof CompanyFilters; value: any; label: string }[] = [];

  if (filters.search) {
    activeChips.push({ key: 'search', value: filters.search, label: `Busca: "${filters.search}"` });
  }

  filters.state.forEach(s => activeChips.push({ key: 'state', value: s, label: s }));
  filters.city.forEach(c => activeChips.push({ key: 'city', value: c, label: c }));
  filters.category_ids.forEach(id => activeChips.push({ key: 'category_ids', value: id, label: getCategoryName(id) }));
  
  if (filters.min_rating) {
    activeChips.push({ key: 'min_rating', value: filters.min_rating, label: `${filters.min_rating}+ Estrelas` });
  }

  if (filters.verified) activeChips.push({ key: 'verified', value: true, label: 'Verificadas' });
  if (filters.featured) activeChips.push({ key: 'featured', value: true, label: 'Destaque' });
  if (filters.financing_enabled) activeChips.push({ key: 'financing_enabled', value: true, label: 'Crédito' });
  if (filters.whatsapp_enabled) activeChips.push({ key: 'whatsapp_enabled', value: true, label: 'WhatsApp' });

  if (activeChips.length === 0) return null;

  return (
    <div className="space-y-3 border-b border-slate-200 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Filtros ativos ({activeChips.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {activeChips.map((chip, idx) => (
          <Badge
            key={`${chip.key}-${idx}`}
            variant="secondary"
            className="flex items-center gap-1 rounded-sm border border-blue-200 bg-blue-50 py-1 pl-2 pr-1 text-blue-700 hover:bg-blue-100"
          >
            <span className="text-[11px] font-semibold">{chip.label}</span>
            <button
              onClick={() => onRemove(chip.key, chip.value)}
              aria-label={`Remover filtro ${chip.label}`}
              className="rounded-none p-0.5 hover:bg-blue-200"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
