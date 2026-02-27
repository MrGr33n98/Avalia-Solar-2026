'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface FilterState {
  verified?: boolean;
  minRating?: number;
  state?: string;
}

interface CategoryFilterSidebarProps {
  filters: FilterState;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function CategoryFilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: CategoryFilterSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 sticky top-24 space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-950 uppercase text-sm tracking-wider">
            Filtros
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 px-2 text-xs text-slate-500 hover:text-red-600"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Verificadas */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verified || false}
                onCheckedChange={(checked) => onFilterChange('verified', checked)}
              />
              <Label
                htmlFor="verified"
                className="text-sm font-medium cursor-pointer"
              >
                Apenas Verificadas
              </Label>
            </div>
          </div>

          {/* Rating mínima */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-950">
              Rating Mínimo: {filters.minRating || 0}★
            </label>
            <Slider
              value={[filters.minRating || 0]}
              onValueChange={(value) => onFilterChange('minRating', value[0])}
              min={0}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-950">Estado</label>
            <select
              value={filters.state || ''}
              onChange={(e) => onFilterChange('state', e.target.value || undefined)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              <option value="BA">Bahia</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="PR">Paraná</option>
              <option value="SC">Santa Catarina</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
