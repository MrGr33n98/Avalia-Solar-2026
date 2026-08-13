'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  highlight?: boolean;
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
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 transition-colors',
        highlight && 'border-blue-200 bg-blue-50/30',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500 truncate">{label}</p>
          <p
            className={cn(
              'mt-1 text-[32px] font-bold leading-10',
              highlight ? 'text-blue-600' : 'text-slate-900'
            )}
          >
            {value}
          </p>
          {caption && (
            <p className="mt-1 text-[12px] text-slate-400 truncate">{caption}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2.5', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
