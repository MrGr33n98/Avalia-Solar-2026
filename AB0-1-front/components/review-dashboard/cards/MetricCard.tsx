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
        'rounded-xl border border-slate-200 bg-white p-4 transition-all min-w-0 overflow-hidden shadow-none hover:border-slate-350',
        highlight && 'border-blue-200 bg-blue-50/20',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2.5 min-w-0">
        <div className="min-w-0 flex-1">
          {/* Label do Card */}
          <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 leading-4 line-clamp-2 break-words">
            {label}
          </p>

          {/* Valor Principal (KPI) */}
          <p
            className={cn(
              'mt-1 font-semibold tracking-[-0.02em] break-words min-w-0 max-w-full overflow-hidden',
              highlight ? 'text-blue-600' : 'text-slate-900',
              isUnavailable
                ? 'text-[15px] sm:text-[16px] lg:text-[18px] leading-5 text-slate-400 font-semibold'
                : typeof displayValue === 'string' && displayValue.length > 8
                ? 'text-[16px] sm:text-[18px] lg:text-[20px] leading-6 font-bold'
                : 'text-[22px] sm:text-[24px] lg:text-[26px] leading-8 font-bold'
            )}
          >
            {displayValue}
          </p>

          {/* Legenda/Caption */}
          {caption && (
            <p className="mt-1 text-[11px] sm:text-[12px] text-slate-400 leading-4 line-clamp-2 break-words">
              {caption}
            </p>
          )}
        </div>

        {/* Ícone */}
        {Icon && (
          <div className={cn('rounded-lg p-2 shrink-0', iconBgColor)}>
            <Icon className={cn('h-4.5 w-4.5 sm:h-5 sm:w-5', iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
