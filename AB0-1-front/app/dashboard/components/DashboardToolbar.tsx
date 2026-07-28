'use client';

import { ChevronDown, HelpCircle } from 'lucide-react';
import { CommandMenu } from './CommandMenu';

interface DashboardToolbarProps {
  company: any;
  onTabChange: (tabId: string) => void;
  themeToggle?: React.ReactNode;
}

export default function DashboardToolbar({ company, onTabChange, themeToggle }: DashboardToolbarProps) {
  return (
    <header className="mb-5 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left shadow-sm transition hover:bg-slate-50"
          aria-label="Ir para visão geral"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-blue-600 text-[10px] font-black text-white">
            {company?.name?.slice(0, 2).toUpperCase() || 'AS'}
          </span>
          <span className="max-w-[180px] truncate text-xs font-bold text-slate-800 sm:max-w-[240px]">{company?.name || 'Empresa'}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        </button>
        <div className="hidden w-[280px] lg:block">
          <CommandMenu onSelectTab={onTabChange} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1 text-xs font-medium text-slate-600 sm:flex">
          <HelpCircle className="h-4 w-4" /> Ajuda
        </div>
        {themeToggle && (
          <div className="h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md px-1 hover:bg-slate-100 transition-colors">
            {themeToggle}
          </div>
        )}
      </div>
    </header>
  );
}
