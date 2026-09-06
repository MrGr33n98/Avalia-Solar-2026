'use client';

import type { TemplateStats as StatsType } from '../types';
import { Mail, CheckCircle2, FileEdit, Users } from 'lucide-react';

interface TemplateStatsProps {
  stats: StatsType | null;
  loading?: boolean;
}

export function TemplateStats({ stats, loading }: TemplateStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-lg border p-4" />
        ))}
      </div>
    );
  }

  const items = [
    { label: 'Total de Templates', value: stats.total, icon: Mail, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Em uso ativo', value: stats.in_use, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Rascunhos', value: stats.draft, icon: FileEdit, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Compartilhados', value: stats.shared, icon: Users, color: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
            <div className={`p-2.5 rounded-md bg-muted ${item.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold tracking-tight">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
