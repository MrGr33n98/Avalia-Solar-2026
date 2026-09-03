'use client';

import {
  Building2,
  ChevronDown,
  Columns,
  Copy,
  Download,
  Filter,
  Plus,
  Search,
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

interface CompaniesToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  count: number;
  selectedOwnerId: string | null;
  onOwnerSelect: (ownerId: string | null) => void;
  selectedType: string | null;
  onTypeSelect: (type: string | null) => void;
  onOpenColumnsDialog: () => void;
  onCreateCompany: () => void;
  onExportCsv: () => void;
  onManageDuplicates: () => void;
}

export default function CompaniesToolbar({
  query,
  onQueryChange,
  count,
  selectedOwnerId,
  onOwnerSelect,
  selectedType,
  onTypeSelect,
  onOpenColumnsDialog,
  onCreateCompany,
  onExportCsv,
  onManageDuplicates,
}: CompaniesToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Top Action Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-900" />
            <span>Companies</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento central de contas comerciais B2B, empresas e parceiros.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onCreateCompany}
            size="sm"
            className="h-8 text-xs bg-blue-900 hover:bg-blue-950 text-white font-bold px-3 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Add a new company
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onManageDuplicates}
            className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Manage duplicates
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
                className={`h-7 text-xs ${selectedOwnerId ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <Filter className="w-3 h-3 mr-1.5 text-sky-600 fill-sky-600" />
                <span>{selectedOwnerId ? 'Assigned: Me' : 'Assigned to'}</span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuLabel className="text-slate-400 text-[11px]">Filtrar por Responsável</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOwnerSelect(null)} className="cursor-pointer">
                Todos os Responsáveis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOwnerSelect('me')} className="cursor-pointer font-bold text-blue-900">
                Felipe (You)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Company Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={`h-7 text-xs ${selectedType ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <span>{selectedType ? `Type: ${selectedType}` : 'Company type'}</span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuLabel className="text-slate-400 text-[11px]">Filtrar por Tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTypeSelect(null)} className="cursor-pointer">
                Todos os Tipos
              </DropdownMenuItem>
              {['Prospect', 'Customer', 'Installer', 'Manufacturer', 'Partner'].map((type) => (
                <DropdownMenuItem key={type} onClick={() => onTypeSelect(type)} className="cursor-pointer">
                  {type}
                </DropdownMenuItem>
              ))}
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
              placeholder="Search companies..."
            />
          </div>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{count} companies</span>
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
