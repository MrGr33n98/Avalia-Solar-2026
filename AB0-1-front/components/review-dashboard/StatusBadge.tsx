'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'pending' | 'draft' | 'approved' | 'rejected' | 'in_analysis' | 'archived' | string;
  label?: string;
  className?: string;
}

const statusStyles: Record<string, { bg: string; text: string; defaultLabel: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-700', defaultLabel: 'Ativa' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', defaultLabel: 'Aprovada' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', defaultLabel: 'Pendente' },
  in_analysis: { bg: 'bg-blue-50', text: 'text-blue-700', defaultLabel: 'Em análise' },
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', defaultLabel: 'Rascunho' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', defaultLabel: 'Rejeitada' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600', defaultLabel: 'Arquivada' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = statusStyles[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    defaultLabel: status,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      {label || style.defaultLabel}
    </span>
  );
}
