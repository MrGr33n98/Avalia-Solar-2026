'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotificationStore, NotificationFilter } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

export const NotificationFilters: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilterParam = (searchParams.get('filter') as NotificationFilter) || 'all';

  const { activeFilter, setActiveFilter, filterCounts } = useNotificationStore();

  const filterOptions: { id: NotificationFilter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'unread', label: 'Não lidas' },
    { id: 'quotes', label: 'Orçamentos' },
    { id: 'reviews', label: 'Avaliações' },
    { id: 'messages', label: 'Mensagens' },
    { id: 'companies', label: 'Empresas' },
    { id: 'system', label: 'Sistema' },
  ];

  const handleSelectFilter = (id: NotificationFilter) => {
    setActiveFilter(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', id);
    }
    router.push(`/review-dashboard/notifications?${params.toString()}`, { scroll: false });
  };

  const selectedFilter = activeFilter || currentFilterParam;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none font-sans">
      {filterOptions.map((opt) => {
        const count = filterCounts[opt.id] || 0;
        const isSelected = selectedFilter === opt.id;
        const isQuotes = opt.id === 'quotes';

        return (
          <button
            key={opt.id}
            onClick={() => handleSelectFilter(opt.id)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors rounded-none border-b-2 -mb-px',
              isSelected
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            {/* Yellow Dot Indicator on Orçamentos for Commercial Relevance */}
            {isQuotes && count > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="Novos orçamentos disponíveis" />
            )}

            <span>{opt.label}</span>

            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-bold rounded-none',
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
