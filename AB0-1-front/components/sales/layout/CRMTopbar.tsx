'use client';

import {
  Bell,
  Building2,
  CalendarClock,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
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

interface CRMTopbarProps {
  onOpenSearch?: () => void;
  onOpenAddModal?: (type: string) => void;
}

export default function CRMTopbar({ onOpenSearch, onOpenAddModal }: CRMTopbarProps) {
  return (
    <header className="h-14 min-w-0 bg-[#0c1a30] border-b border-slate-800 text-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 select-none font-sans">
      {/* Left: Search & + Add new button aligned side-by-side like Nutshell */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900/90 hover:bg-slate-800/90 rounded-md border border-slate-750 transition-colors w-56 md:w-64"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search or press Ctrl K...</span>
        </button>

        {/* + Add new Dropdown Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-medium text-xs h-8 px-3 gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add new</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-slate-900 text-slate-100 border-slate-800">
            <DropdownMenuLabel className="text-xs text-slate-400">Criar Novo Registro</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={() => onOpenAddModal?.('company')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Building2 className="w-4 h-4 mr-2 text-blue-400" /> Empresa (Company)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('contact')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Users className="w-4 h-4 mr-2 text-emerald-400" /> Pessoa (Contact)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('opportunity')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Target className="w-4 h-4 mr-2 text-amber-400" /> Oportunidade / Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('quote')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <FileText className="w-4 h-4 mr-2 text-indigo-400" /> Proposta Solar / Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('task')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <CalendarClock className="w-4 h-4 mr-2 text-sky-400" /> Tarefa / Compromisso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('activity')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Phone className="w-4 h-4 mr-2 text-rose-400" /> Atividade / Chamada
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('email')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Mail className="w-4 h-4 mr-2 text-purple-400" /> Enviar E-mail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('import')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-teal-400" /> Importar Leads (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Quick actions & User badge */}
      <div className="flex items-center gap-3 text-xs">
        <span className="hidden lg:flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer transition-colors">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-semibold text-slate-300">Avalia Solar CRM</span>
        </span>

        <button className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-800/60">
          <HelpCircle className="w-4 h-4" />
        </button>

        <button className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-800/60 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        <div className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-700">
          F
        </div>

        <button className="text-slate-400 hover:text-purple-300 transition-colors p-1.5 rounded-md hover:bg-slate-800/60">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </button>
      </div>
    </header>
  );
}
