'use client';

import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface DashboardErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export function DashboardErrorState({
  title = 'Não foi possível carregar as informações',
  description,
  onRetry,
  className,
}: DashboardErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/20 px-8 py-12 text-center',
        className
      )}
    >
      <div className="rounded-2xl bg-red-50 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500 leading-5">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-none"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
