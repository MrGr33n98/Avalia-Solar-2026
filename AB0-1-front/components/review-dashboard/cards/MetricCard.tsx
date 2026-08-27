'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
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
  unavailableLabel?: string;
  href?: string;
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
  unavailableLabel = 'Indisponível',
  href,
  className,
}: MetricCardProps) {
  // O estado "indisponível" é ativado se for explicitamente marcado ou se o valor for nulo/indisponível
  const isUnavailable =
    unavailable || value === null || value === undefined || value === 'Indisponível';

  const displayValue = isUnavailable
    ? value && typeof value === 'string' && value !== 'Indisponível'
      ? value
      : unavailableLabel
    : value;

  const card = (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-4 transition-all min-w-0 flex items-center gap-3.5 shadow-[0_10px_30px_-24px_rgb(15_23_42_/_0.5)] hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_32px_-22px_rgb(37_99_235_/_0.35)] min-h-[80px] md:h-[88px]',
        highlight && 'border-blue-200 bg-blue-50/20',
        className
      )}
      aria-label={`${label}: ${displayValue}`}
      role="group"
    >
      {/* Icon on the left */}
      {Icon && (
        <div
          className={cn(
            'rounded-xl p-2.5 shrink-0 flex items-center justify-center w-10 h-10 ring-1 ring-black/[0.03]',
            iconBgColor
          )}
        >
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

  return href ? (
    <Link href={href} className="block min-w-0">
      {card}
    </Link>
  ) : (
    card
  );
}
