import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FilterPanel({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn('border border-slate-200 bg-white shadow-none rounded-none', className)}>{children}</div>;
}

export function FilterIconBox({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-slate-900 rounded-none', className)}><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></span>;
}

export function FilterSection({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <section className={cn('border-b border-slate-200 px-5 py-4 last:border-b-0', className)}>{children}</section>;
}

export function FilterChip({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={cn('inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 rounded-sm', className)}>{children}</span>;
}

export function SearchStatusCard({ active }: { active: boolean }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-4 rounded-none">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status da busca</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-950">{active ? 'Filtros aplicados' : 'Busca sem restrições'}</span>
        <span className={cn('h-2 w-2 shrink-0', active ? 'bg-blue-600' : 'bg-slate-300')} aria-hidden="true" />
      </div>
    </div>
  );
}
