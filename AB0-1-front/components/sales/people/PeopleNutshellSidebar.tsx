'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Filter,
  Globe,
  Users,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PeopleNutshellSidebarProps {
  filters: {
    query: string;
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedin: boolean;
    jobTitle: string;
    titleExact: boolean;
    companyName: string;
    state: string;
    segment: string;
  };
  onFilterChange: (updates: Partial<PeopleNutshellSidebarProps['filters']>) => void;
  onClearFilters: () => void;
  totalCount: number;
}

export default function PeopleNutshellSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  totalCount,
}: PeopleNutshellSidebarProps) {
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [companyOpen, setCompanyOpen] = useState(true);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-120px)] flex flex-col font-sans select-none text-xs">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-500 text-white flex items-center justify-center font-bold shadow-2xs">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 text-xs tracking-tight">Filtros de Prospecção</span>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold hover:underline"
        >
          Limpar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* SECTION 1: PEOPLE */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPeopleOpen(!peopleOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider py-1 hover:text-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              People (Pessoas)
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${peopleOpen ? '' : '-rotate-90'}`} />
          </button>

          {peopleOpen && (
            <div className="space-y-2.5 pl-1 pt-1 text-slate-700">
              {/* Checkboxes: Has Email, Phone, Linkedin */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 font-medium">
                  <input
                    type="checkbox"
                    checked={filters.hasEmail}
                    onChange={(e) => onFilterChange({ hasEmail: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-500"
                  />
                  <span>Com E-mail verificado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 font-medium">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone}
                    onChange={(e) => onFilterChange({ hasPhone: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-500"
                  />
                  <span>Com Telefone / WhatsApp</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 font-medium">
                  <input
                    type="checkbox"
                    checked={filters.hasLinkedin}
                    onChange={(e) => onFilterChange({ hasLinkedin: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-sky-500"
                  />
                  <span>Com Perfil do LinkedIn</span>
                </label>
              </div>

              {/* Title / Cargo Filter with Chips */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="font-semibold text-slate-600 block text-[11px]">Cargo / Função</span>
                <div className="relative">
                  <Input
                    placeholder="Ex: Diretor, Engenheiro..."
                    value={filters.jobTitle}
                    onChange={(e) => onFilterChange({ jobTitle: e.target.value })}
                    className="h-7 text-xs pr-6"
                  />
                  {filters.jobTitle && (
                    <button
                      type="button"
                      onClick={() => onFilterChange({ jobTitle: '' })}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={filters.titleExact}
                    onChange={(e) => onFilterChange({ titleExact: e.target.checked })}
                    className="h-3 w-3 rounded border-slate-300 accent-sky-500"
                  />
                  <span>Exatamente igual (Exact match)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: COMPANY */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setCompanyOpen(!companyOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider py-1 hover:text-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Company (Empresa Solar)
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${companyOpen ? '' : '-rotate-90'}`} />
          </button>

          {companyOpen && (
            <div className="space-y-2.5 pl-1 pt-1 text-slate-700">
              {/* Company Name */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-600 block text-[11px]">Nome da Empresa</span>
                <Input
                  placeholder="Ex: Solfacil, Weg..."
                  value={filters.companyName}
                  onChange={(e) => onFilterChange({ companyName: e.target.value })}
                  className="h-7 text-xs"
                />
              </div>

              {/* State (UF) */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-600 block text-[11px]">Estado (UF)</span>
                <select
                  value={filters.state}
                  onChange={(e) => onFilterChange({ state: e.target.value })}
                  className="w-full h-7 rounded border border-slate-300 px-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Todos os Estados</option>
                  <option value="SP">São Paulo (SP)</option>
                  <option value="MG">Minas Gerais (MG)</option>
                  <option value="RJ">Rio de Janeiro (RJ)</option>
                  <option value="PR">Paraná (PR)</option>
                  <option value="RS">Rio Grande do Sul (RS)</option>
                  <option value="BA">Bahia (BA)</option>
                  <option value="GO">Goiás (GO)</option>
                  <option value="SC">Santa Catarina (SC)</option>
                </select>
              </div>

              {/* Segment */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-600 block text-[11px]">Segmento da Usina</span>
                <select
                  value={filters.segment}
                  onChange={(e) => onFilterChange({ segment: e.target.value })}
                  className="w-full h-7 rounded border border-slate-300 px-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Todos os Segmentos</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Residencial">Residencial</option>
                  <option value="Agronegócio">Agronegócio</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Total Result Pill */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Resultados:</span>
        <Badge variant="secondary" className="font-bold text-slate-800 bg-white border border-slate-200">
          {totalCount} contatos
        </Badge>
      </div>
    </aside>
  );
}
