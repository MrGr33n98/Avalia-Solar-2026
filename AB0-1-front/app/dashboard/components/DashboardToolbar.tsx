'use client';

import { ChevronDown, HelpCircle, Menu } from 'lucide-react';
import { CommandMenu } from './CommandMenu';

interface DashboardToolbarProps {
  company: { name?: string } | null;
  onTabChange: (tabId: string) => void;
  onOpenNavigation?: () => void;
  themeToggle?: React.ReactNode;
}

export default function DashboardToolbar({
  company,
  onTabChange,
  onOpenNavigation,
  themeToggle,
}: DashboardToolbarProps) {
  return (
    <header className="sticky top-0 z-30 mb-4 flex min-h-[56px] flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-3 py-2 pt-[var(--safe-area-inset-top)] sm:px-4 md:static md:mb-5 md:pt-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Menu mobile */}
        <button
          type="button"
          onClick={onOpenNavigation}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Empresa ativa */}
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left shadow-sm transition hover:bg-slate-50"
          aria-label="Ir para visão geral"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-blue-600 text-[10px] font-black text-white">
            {company?.name?.slice(0, 2).toUpperCase() || 'AS'}
          </span>
          <span className="max-w-[140px] truncate text-xs font-bold text-slate-800 sm:max-w-[200px]">
            {company?.name || 'Empresa'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        </button>

        {/* Busca global do dashboard — uma por viewport */}
        <div className="hidden w-full max-w-[280px] sm:block lg:max-w-[320px]">
          <CommandMenu onSelectTab={onTabChange} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" /> Ajuda
        </button>
        {themeToggle && (
          <div className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1 transition-colors hover:bg-slate-100">
            {themeToggle}
          </div>
        )}
      </div>
    </header>
  );
}
