'use client';

import Link from 'next/link';
import {
  BarChart3,
  Building2,
  CalendarClock,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  Mail,
  Megaphone,
  Phone,
  Plus,
  Search,
  Settings,
  Target,
  Users,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CRMMobileMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAddModal: (type: string) => void;
  onOpenSearch: () => void;
}

export default function CRMMobileMoreSheet({
  open,
  onOpenChange,
  onOpenAddModal,
  onOpenSearch,
}: CRMMobileMoreSheetProps) {
  const handleAction = (type: string) => {
    onOpenChange(false);
    onOpenAddModal(type);
  };

  const handleSearch = () => {
    onOpenChange(false);
    onOpenSearch();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 font-sans"
      >
        <SheetHeader className="pb-3 border-b border-slate-100 text-left">
          <SheetTitle className="text-lg font-bold text-slate-900">
            Mais Ações & Módulos CRM
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            Acesse rapidamente criações, módulos e ferramentas comerciais.
          </SheetDescription>
        </SheetHeader>

        {/* Quick Search Trigger */}
        <div className="py-3">
          <button
            onClick={handleSearch}
            className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span>Buscar empresa, contato ou oportunidade...</span>
          </button>
        </div>

        {/* Global Create Actions Grid */}
        <div className="space-y-2 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Criar Novo Registro
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleAction('opportunity')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors font-medium text-slate-800"
            >
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Target className="h-4 w-4" />
              </div>
              <span className="truncate">Oportunidade</span>
            </button>

            <button
              onClick={() => handleAction('company')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors font-medium text-slate-800"
            >
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="truncate">Empresa</span>
            </button>

            <button
              onClick={() => handleAction('contact')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors font-medium text-slate-800"
            >
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
              <span className="truncate">Contato</span>
            </button>

            <button
              onClick={() => handleAction('quote')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors font-medium text-slate-800"
            >
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileText className="h-4 w-4" />
              </div>
              <span className="truncate">Proposta</span>
            </button>

            <button
              onClick={() => handleAction('activity')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors font-medium text-slate-800"
            >
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <Phone className="h-4 w-4" />
              </div>
              <span className="truncate">Ligação</span>
            </button>

            <button
              onClick={() => handleAction('task')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors font-medium text-slate-800"
            >
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                <CalendarClock className="h-4 w-4" />
              </div>
              <span className="truncate">Tarefa</span>
            </button>
          </div>
        </div>

        {/* Modules Navigation Links */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Outros Módulos
          </p>

          <Link
            href="/dashboard/sales/campaigns"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <Megaphone className="h-4 w-4 text-purple-600" />
              <span>Campanhas & Automações</span>
            </div>
          </Link>

          <Link
            href="/dashboard/sales/reports"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span>Analytics & Forecast</span>
            </div>
          </Link>

          <Link
            href="/dashboard/sales/import"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-4 w-4 text-teal-600" />
              <span>Importador de Leads CSV</span>
            </div>
          </Link>

          <Link
            href="/dashboard/sales/settings"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 text-slate-500" />
              <span>Configurações do CRM</span>
            </div>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
