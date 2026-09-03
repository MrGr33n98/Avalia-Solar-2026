'use client';

import {
  ChevronDown,
  Columns,
  Download,
  Filter,
  Plus,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PeopleToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  count: number;
  selectedRole: string | null;
  onRoleSelect: (role: string | null) => void;
  selectedOwnerId: string | null;
  onOwnerSelect: (ownerId: string | null) => void;
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  onOpenColumnsDialog: () => void;
  onCreatePerson: () => void;
  onExportCsv: () => void;
}

export default function PeopleToolbar({
  query,
  onQueryChange,
  count,
  selectedRole,
  onRoleSelect,
  selectedOwnerId,
  onOwnerSelect,
  viewMode,
  onViewModeChange,
  onOpenColumnsDialog,
  onCreatePerson,
  onExportCsv,
}: PeopleToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Top Action Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-900" />
            <span>People & Decisores</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeamento de decisores, comitês de compra e influenciadores comerciais.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onCreatePerson}
            size="sm"
            className="h-8 text-xs bg-indigo-900 hover:bg-indigo-950 text-white font-bold px-3 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Add Person
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Export CSV
          </Button>
        </div>
      </header>

      {/* Filter Bar (Chips & Search) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Owner Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={`h-7 text-xs ${selectedOwnerId ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <Filter className="w-3 h-3 mr-1.5 text-indigo-600 fill-indigo-600" />
                <span>{selectedOwnerId === 'unassigned' ? 'Unassigned' : 'Assigned to'}</span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuLabel className="text-slate-400 text-[11px]">Filtrar por Responsável</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOwnerSelect(null)} className="cursor-pointer">
                Todas as Pessoas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOwnerSelect('unassigned')} className="cursor-pointer font-bold text-indigo-900">
                Sem responsável
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Decision Role Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={`h-7 text-xs ${selectedRole ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <UserCheck className="w-3 h-3 mr-1 text-emerald-600" />
                <span>{selectedRole ? `Role: ${selectedRole}` : 'Decision Role'}</span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuLabel className="text-slate-400 text-[11px]">Filtrar por Papel de Decisão</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRoleSelect(null)} className="cursor-pointer">
                Todos os Papéis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRoleSelect('economic_buyer')} className="cursor-pointer">
                Economic Buyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRoleSelect('champion')} className="cursor-pointer">
                Champion
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRoleSelect('technical_buyer')} className="cursor-pointer">
                Technical Buyer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRoleSelect('decision_maker')} className="cursor-pointer">
                Decision Maker
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-7 pl-8 text-xs border-slate-200 bg-slate-50/50"
              placeholder="Search people..."
            />
          </div>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{count} people</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${viewMode === 'list' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              List
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${viewMode === 'map' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Map
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenColumnsDialog}
            className="h-7 text-xs text-slate-600 px-2 hover:bg-slate-100"
          >
            <Columns className="w-3.5 h-3.5 mr-1 text-slate-400" /> Change columns
          </Button>
        </div>
      </div>
    </div>
  );
}
