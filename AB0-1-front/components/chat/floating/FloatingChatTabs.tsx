'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChatTabType = 'priority' | 'budgets' | 'other';

interface FloatingChatTabsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: ChatTabType;
  onTabChange: (tab: ChatTabType) => void;
  counts?: {
    priority?: number;
    budgets?: number;
    other?: number;
  };
  className?: string;
}

export function FloatingChatTabs({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  counts,
  className,
}: FloatingChatTabsProps) {
  const tabs: { id: ChatTabType; label: string; count?: number }[] = [
    { id: 'priority', label: 'Prioritárias', count: counts?.priority },
    { id: 'budgets', label: 'Orçamentos', count: counts?.budgets },
    { id: 'other', label: 'Outras', count: counts?.other },
  ];

  return (
    <div className={cn('flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 pt-3 pb-0', className)}>
      {/* Campo de Busca */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar mensagens..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
        />
      </div>

      {/* Abas */}
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative pb-2.5 text-xs font-bold transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              )}
            >
              <div className="flex items-center gap-1.5">
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-extrabold',
                    isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}>
                    {tab.count}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
