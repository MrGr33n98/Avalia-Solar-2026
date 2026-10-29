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
import CRMUserPopover from '@/components/sales/layout/CRMUserPopover';

interface CRMTopbarProps {
  onOpenSearch?: () => void;
  onOpenAddModal?: (type: string) => void;
}

export default function CRMTopbar({ onOpenSearch, onOpenAddModal }: CRMTopbarProps) {
  return (
    <header className="h-14 min-w-0 bg-[#0c1a30] border-b border-slate-800 text-slate-200 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-20 select-none font-sans">
      {/* Left: Search & + Add new button */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Search Bar */}
        <button
          onClick={onOpenSearch}
          aria-label="Abrir busca global do CRM"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-slate-300 bg-slate-900/90 hover:bg-slate-800/90 rounded-md border border-slate-700 transition-colors w-32 sm:w-56 md:w-64 truncate"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">Buscar ou Ctrl K...</span>
        </button>

        {/* + Add new Dropdown Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              aria-label="Criar novo registro no CRM"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-medium text-xs h-8 px-2.5 sm:px-3 gap-1 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Novo</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 sm:ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-slate-900 text-slate-100 border-slate-800">
            <DropdownMenuLabel className="text-xs text-slate-400">Criar Novo Registro</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem onClick={() => onOpenAddModal?.('company')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Building2 className="w-4 h-4 mr-2 text-blue-400" /> Empresa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('contact')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Users className="w-4 h-4 mr-2 text-emerald-400" /> Contato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('opportunity')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <Target className="w-4 h-4 mr-2 text-amber-400" /> Oportunidade / Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAddModal?.('quote')} className="cursor-pointer hover:bg-slate-800 text-xs">
              <FileText className="w-4 h-4 mr-2 text-indigo-400" /> Proposta Comercial
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
      <div className="flex items-center gap-2 sm:gap-3 text-xs">
        <span className="hidden lg:flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">Avalia Solar CRM</span>
        </span>

        <button
          aria-label="Ajuda e suporte do CRM"
          className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-800/60"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          aria-label="Notificações do sistema"
          className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-800/60 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        <CRMUserPopover onOpenInbox={() => onOpenAddModal?.('email')} />

        <button
          aria-label="Recursos inteligentes e IA"
          className="text-slate-400 hover:text-purple-300 transition-colors p-1.5 rounded-md hover:bg-slate-800/60"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
        </button>
      </div>
    </header>
  );
}
