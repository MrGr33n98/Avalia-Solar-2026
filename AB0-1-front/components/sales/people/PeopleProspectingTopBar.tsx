'use client';

import { useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Map,
  Plus,
  Save,
  SlidersHorizontal,
  Table,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface SavedView {
  id: string;
  name: string;
  filters: {
    query?: string;
    hasEmail?: boolean;
    hasPhone?: boolean;
    hasLinkedin?: boolean;
    jobTitle?: string;
    titleExact?: boolean;
    companyName?: string;
    state?: string;
    segment?: string;
    decisionRole?: string | null;
  };
}

const DEFAULT_PRESET_VIEWS: SavedView[] = [
  {
    id: 'default_all',
    name: 'Todas as Pessoas & Decisores',
    filters: {},
  },
  {
    id: 'sales_directors_sp',
    name: 'Diretores & Gestores Comerciais - SP',
    filters: { jobTitle: 'Comercial', state: 'SP', hasEmail: true },
  },
  {
    id: 'verified_linkedin_solar',
    name: 'Decisores Solar com LinkedIn',
    filters: { hasLinkedin: true, segment: 'Integrador Solar' },
  },
  {
    id: 'ready_outreach',
    name: 'Prontos para Cold Email (Com E-mail)',
    filters: { hasEmail: true },
  },
];

interface PeopleProspectingTopBarProps {
  currentView: SavedView | null;
  savedViews: SavedView[];
  onSelectView: (view: SavedView) => void;
  onSaveNewView: (name: string) => void;
  onDeleteView: (viewId: string) => void;
  totalCount: number;
  hasActiveFilters: boolean;
  onRemoveFilters: () => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  viewMode: 'cards' | 'table' | 'map';
  onViewModeChange: (mode: 'cards' | 'table' | 'map') => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function PeopleProspectingTopBar({
  currentView,
  savedViews,
  onSelectView,
  onSaveNewView,
  onDeleteView,
  totalCount,
  hasActiveFilters,
  onRemoveFilters,
  page,
  totalPages,
  onPageChange,
  viewMode,
  onViewModeChange,
  onToggleSidebar,
  sidebarOpen,
}: PeopleProspectingTopBarProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const activeViewName = currentView?.name || 'Visão Personalizada';

  const handleConfirmSave = () => {
    if (!newViewName.trim()) return;
    onSaveNewView(newViewName.trim());
    setNewViewName('');
    setIsSaveModalOpen(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs font-sans text-xs">
      {/* Left side: Saved Views Dropdown & Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSidebar}
          className={`h-8 text-xs font-semibold px-2.5 border-slate-200 ${
            sidebarOpen ? 'bg-sky-50 text-sky-800 border-sky-300' : 'text-slate-600 bg-white'
          }`}
          title="Alternar barra de filtros"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
          Filtros
        </Button>

        {/* Saved Views Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold bg-white text-slate-800 border-slate-300 hover:border-sky-400 hover:bg-slate-50 max-w-[220px]"
            >
              <Bookmark className="w-3.5 h-3.5 mr-1.5 text-sky-600 shrink-0" />
              <span className="truncate">{activeViewName}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 text-xs">
            <DropdownMenuLabel className="text-slate-400 text-[11px]">Listas & Filtros Salvos</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {savedViews.map((v) => {
              const isSelected = currentView?.id === v.id;
              return (
                <div key={v.id} className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 group">
                  <button
                    type="button"
                    onClick={() => onSelectView(v)}
                    className="flex-1 text-left flex items-center gap-2 text-xs truncate py-0.5"
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 font-bold" />
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className={`truncate ${isSelected ? 'font-bold text-sky-900' : 'text-slate-700'}`}>
                      {v.name}
                    </span>
                  </button>
                  {!DEFAULT_PRESET_VIEWS.some((dp) => dp.id === v.id) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteView(v.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600"
                      title="Excluir lista"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsSaveModalOpen(true)}
              className="cursor-pointer text-sky-700 font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Salvar visualização atual...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save as Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSaveModalOpen(true)}
          className="h-8 text-xs text-slate-600 hover:text-sky-700 hover:bg-sky-50 px-2 font-medium"
        >
          <Save className="w-3.5 h-3.5 mr-1" /> Save as
        </Button>

        {/* Count & Remove Filters indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
          <span className="font-bold text-slate-900">{totalCount}</span>
          <span className="text-slate-500">pessoas</span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onRemoveFilters}
              className="ml-1 text-sky-600 hover:text-sky-800 font-semibold hover:underline flex items-center gap-0.5 text-[11px]"
            >
              <X className="w-3 h-3" /> Remover filtros
            </button>
          )}
        </div>
      </div>

      {/* Right side: Top Pagination & View Mode Selector */}
      <div className="flex items-center gap-3 justify-between md:justify-end">
        {/* Top Pagination Nutshell style (< Prev 1 2 3 Next >) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 text-xs">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-7 px-2 text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
            </Button>

            <span className="px-2 text-slate-700 font-medium">
              Página <strong className="text-slate-900">{page}</strong> de {totalPages}
            </span>

            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-7 px-2 text-slate-600 disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        )}

        {/* View Mode Buttons (Cards / Table / Map) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-sky-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visualização em Cartões (Nutshell Bento)"
          >
            <Layers className="w-3.5 h-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-white text-sky-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visualização em Tabela detalhada"
          >
            <Table className="w-3.5 h-3.5" />
            Tabela
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('map')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-all ${
              viewMode === 'map'
                ? 'bg-white text-sky-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Radar no Mapa Geográfico"
          >
            <Map className="w-3.5 h-3.5" />
            Mapa
          </button>
        </div>
      </div>

      {/* Save Modal */}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Salvar Lista de Prospecção
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-600">
              Dê um nome para esta pesquisa para acessá-la rapidamente a qualquer momento no topo do CRM.
            </p>
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Ex: Diretores Comerciais - SP (Com E-mail)"
              className="text-xs"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSaveModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSave}
              disabled={!newViewName.trim()}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
            >
              Salvar Lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { DEFAULT_PRESET_VIEWS };
