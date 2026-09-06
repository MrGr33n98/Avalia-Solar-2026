'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, ListFilter, FileSpreadsheet } from 'lucide-react';

interface AudienceNavigationProps {
  activeTab?: 'overview' | 'lists' | 'import';
}

export function AudienceNavigation({ activeTab }: AudienceNavigationProps) {
  const pathname = usePathname();

  const isTabActive = (tab: 'overview' | 'lists' | 'import') => {
    if (activeTab) return activeTab === tab;
    if (tab === 'lists') return pathname.includes('/audiences/lists');
    if (tab === 'import') return pathname.includes('/audiences/import');
    return pathname === '/dashboard/sales/campaigns/audiences';
  };

  return (
    <div className="border-b border-slate-200 mb-6">
      <nav aria-label="Abas de Audiência" className="-mb-px flex gap-6">
        <Link
          href="/dashboard/sales/campaigns/audiences"
          className={`group inline-flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors ${
            isTabActive('overview')
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Visão Geral & Filtros Dinâmicos</span>
        </Link>

        <Link
          href="/dashboard/sales/campaigns/audiences/lists"
          className={`group inline-flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors ${
            isTabActive('lists')
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <ListFilter className="h-4 w-4" />
          <span>Listas de Contatos (Estáticas)</span>
        </Link>

        <Link
          href="/dashboard/sales/campaigns/audiences/import"
          className={`group inline-flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors ${
            isTabActive('import')
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Importar CSV</span>
        </Link>
      </nav>
    </div>
  );
}
