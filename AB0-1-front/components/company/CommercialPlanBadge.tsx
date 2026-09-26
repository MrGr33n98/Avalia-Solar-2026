'use client';

import { Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommercialPlanBadgeProps {
  commercialStatus?: {
    tier?: string;
    status?: string;
    paid?: boolean;
  } | null;
  hasPaidPlan?: boolean;
  className?: string;
}

export default function CommercialPlanBadge({
  commercialStatus,
  hasPaidPlan,
  className,
}: CommercialPlanBadgeProps) {
  const isPaid = commercialStatus?.paid ?? hasPaidPlan ?? false;
  if (!isPaid) return null;

  const rawTier = (commercialStatus?.tier || '').toLowerCase();
  const tier = rawTier === 'enterprise' ? 'enterprise' : 'pro';

  if (tier === 'enterprise') {
    return (
      <span
        className={cn(
          'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[10px] font-black uppercase tracking-wider',
          'border border-slate-700 bg-slate-900 text-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm',
          className
        )}
        aria-label="Plano Comercial Enterprise"
        title="Plano Comercial Enterprise"
      >
        <Crown className="h-3 w-3 text-amber-400 shrink-0" aria-hidden="true" />
        ENTERPRISE
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[10px] font-black uppercase tracking-wider',
        'border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300',
        className
      )}
      aria-label="Plano Comercial Pro"
      title="Plano Comercial Pro"
    >
      <Sparkles className="h-3 w-3 text-violet-500 shrink-0" aria-hidden="true" />
      PRO
    </span>
  );
}
