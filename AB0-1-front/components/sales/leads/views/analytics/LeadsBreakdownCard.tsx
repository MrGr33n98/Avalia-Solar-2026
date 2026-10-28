'use client';

import React from 'react';
import type { LeadsBreakdownItem } from '@/lib/api/sales/types';

interface LeadsBreakdownCardProps {
  title: string;
  items: LeadsBreakdownItem[];
  emptyMessage?: string;
  isLoading?: boolean;
}

export function LeadsBreakdownCard({
  title,
  items,
  emptyMessage = "We couldn't find anything with these filters",
  isLoading,
}: LeadsBreakdownCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm flex flex-col min-h-[140px]">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
          {title}
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">
          {items.length > 0 ? `${items.length} ${items.length === 1 ? 'item' : 'itens'}` : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2 animate-pulse">
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 justify-center flex flex-col">
          {items.map((item, idx) => {
            const barColor = item.color || '#3B82F6';
            const pct = Math.min(Math.max(item.percentage || 0, 0), 100);

            return (
              <div key={idx} className="flex items-center gap-3 text-xs">
                {/* Rótulo */}
                <div
                  className="w-32 shrink-0 truncate text-slate-700 dark:text-slate-300 font-medium"
                  title={item.label}
                >
                  {item.label}
                </div>

                {/* Barra horizontal proporcional */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>

                {/* Contagem e % */}
                <div className="w-16 shrink-0 text-right font-medium text-slate-600 dark:text-slate-400 flex items-center justify-end gap-1">
                  <span>({item.count})</span>
                  <span className="text-[10px] text-slate-400 w-8">{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
