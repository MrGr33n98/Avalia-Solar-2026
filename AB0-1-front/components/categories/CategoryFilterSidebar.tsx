'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, ShieldCheck, MapPin, Star, Settings2, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationData } from '@/hooks/useLocationData';
import ConsultantHelpCard from '@/components/ConsultantHelpCard';
import { openLeadModal } from '@/lib/lead-engine';

interface FilterState {
  verified?: boolean;
  minRating?: number;
  state?: string;
  projectType?: string;
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
  const { states, loadingStates, fetchStates } = useLocationData();

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return (
    <aside className="sticky top-24 hidden w-[300px] shrink-0 space-y-6 lg:block">
      <div className="rounded-none border border-slate-200 bg-white shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 bg-slate-50"><Settings2 className="h-5 w-5 text-slate-900" /></span>
            <h3 className="text-base font-semibold text-slate-950">
              Filtros
            </h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 rounded-none px-3 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div>
          {/* Grupo: Confiança */}
          <div className="space-y-4 border-b border-slate-200 px-5 py-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <ShieldCheck className="w-3 h-3" />
              Nível de Confiança
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 group cursor-pointer p-1">
                <Checkbox
                  id="verified"
                  checked={filters.verified || false}
                  onCheckedChange={(checked) => onFilterChange('verified', checked)}
                  className="rounded-none border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                <Label
                  htmlFor="verified"
                  className="cursor-pointer text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-950"
                >
                  Empresas Verificadas
                </Label>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Avaliação Mínima
                  </Label>
                  <span className="rounded-sm border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                    {filters.minRating || 0}★
                  </span>
                </div>
                <Slider
                  value={[filters.minRating || 0]}
                  onValueChange={(value) => onFilterChange('minRating', value[0])}
                  min={0}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Grupo: Localização */}
          <div className="space-y-4 border-b border-slate-200 px-5 py-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <MapPin className="w-3 h-3" />
              Localização
            </p>
            <div className="relative">
              <label htmlFor="state-filter" className="sr-only">Filtrar por Estados</label>
              <select
                id="state-filter"
                value={filters.state || ''}
                onChange={(e) => onFilterChange('state', e.target.value || undefined)}
                aria-label="Selecionar estado"
                className="w-full appearance-none rounded-none border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-50 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Brasil (Todos)</option>
                {loadingStates ? (
                  <option disabled>Carregando...</option>
                ) : (
                  states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Grupo: Tipo de Projeto */}
          <div className="space-y-4 px-5 py-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Zap className="w-3 h-3" />
              Tipo de Projeto
            </p>
            <div className="grid grid-cols-1 gap-2">
              {['Residencial', 'Comercial', 'Industrial', 'Agronegócio'].map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange('projectType', filters.projectType === type ? undefined : type)}
                  className={cn(
                    "w-full rounded-none border px-4 py-3 text-left text-xs font-medium transition-colors",
                    filters.projectType === type 
                      ? "border-blue-600 bg-blue-600 text-white" 
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConsultantHelpCard
        onAction={() => openLeadModal({ source: 'category-filter-consultant', type: 'quick' })}
      />
    </aside>
  );
}
