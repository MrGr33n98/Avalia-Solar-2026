'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number | null | undefined;
  caption?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  highlight?: boolean;
  unavailable?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  iconColor = 'text-slate-500',
  iconBgColor = 'bg-slate-50',
  highlight = false,
  unavailable = false,
  className,
}: MetricCardProps) {
  // O estado "indisponível" é ativado se for explicitamente marcado ou se o valor for nulo/indisponível
  const isUnavailable =
    unavailable ||
    value === null ||
    value === undefined ||
    value === 'Indisponível';

  const displayValue = isUnavailable
    ? value && typeof value === 'string' && value !== 'Indisponível'
      ? value
      : 'Indisponível'
    : value;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-3.5 transition-all min-w-0 flex items-center gap-3.5 shadow-none hover:border-slate-350 min-h-[72px] md:h-[80px]',
        highlight && 'border-blue-100 bg-blue-50/20',
        className
      )}
    >
      {/* Icon on the left */}
      {Icon && (
        <div className={cn('rounded-lg p-2.5 shrink-0 flex items-center justify-center w-9 h-9', iconBgColor)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      )}

      <div className="min-w-0 flex-1 flex flex-col justify-center">
        {/* Label */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>

        {/* Value and caption */}
        <div className="flex items-baseline gap-2 mt-1 flex-wrap md:flex-nowrap">
          <p
            className={cn(
              'font-bold tracking-tight leading-none',
              highlight ? 'text-blue-600' : 'text-slate-900',
              isUnavailable ? 'text-xs text-slate-400 font-semibold' : 'text-lg md:text-xl'
            )}
          >
            {displayValue}
          </p>
          {caption && (
            <span className="text-[10px] text-slate-400 font-normal truncate leading-none">
              {caption}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
