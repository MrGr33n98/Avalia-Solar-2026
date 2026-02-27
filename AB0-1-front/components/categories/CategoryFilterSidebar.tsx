'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X, ShieldCheck, MapPin, Star, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  verified?: boolean;
  minRating?: number;
  state?: string;
  projectType?: string; // US: Adição de filtro de tipo de projeto
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
    <aside className="hidden lg:block w-[300px] sticky top-24 space-y-6 shrink-0">
      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-black text-slate-950 uppercase text-xs tracking-[0.2em]">
              Filtros
            </h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-7 px-3 text-[10px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-50 tracking-tighter rounded-full transition-all"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="space-y-8">
          {/* Grupo: Confiança */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Nível de Confiança
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 group cursor-pointer p-1">
                <Checkbox
                  id="verified"
                  checked={filters.verified || false}
                  onCheckedChange={(checked) => onFilterChange('verified', checked)}
                  className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label
                  htmlFor="verified"
                  className="text-sm font-bold text-slate-600 cursor-pointer group-hover:text-slate-900 transition-colors"
                >
                  Empresas Verificadas
                </Label>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Avaliação Mínima
                  </Label>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
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
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Localização
            </p>
            <div className="relative">
              <select
                value={filters.state || ''}
                onChange={(e) => onFilterChange('state', e.target.value || undefined)}
                className="w-full px-4 py-3 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none transition-all outline-none"
              >
                <option value="">Brasil (Todos)</option>
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="BA">Bahia</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="PR">Paraná</option>
                <option value="SC">Santa Catarina</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Grupo: Tipo de Projeto (V1 Restore) */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Tipo de Projeto
            </p>
            <div className="grid grid-cols-1 gap-2">
              {['Residencial', 'Comercial', 'Industrial', 'Agronegócio'].map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange('projectType', filters.projectType === type ? undefined : type)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border",
                    filters.projectType === type 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                      : "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sugestão / Ajuda */}
      <div className="bg-blue-600 rounded-[2rem] p-8 text-white space-y-4">
        <p className="text-sm font-black leading-tight">Precisa de ajuda para escolher?</p>
        <p className="text-xs text-blue-100 leading-relaxed">Nossos especialistas podem te ajudar a encontrar a melhor empresa gratuitamente.</p>
        <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black rounded-xl">
          Falar com Consultor
        </Button>
      </div>
    </aside>
  );
}
