'use client';

import { cn } from '@/lib/utils';

type CompanyPlanBadgeProps = {
  planTier?: string | null;
  compact?: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  essential: 'Essential',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export function CompanyPlanBadge({ planTier, compact = false }: CompanyPlanBadgeProps) {
  const normalizedTier = planTier?.toLowerCase() || 'free';
  const label = PLAN_LABELS[normalizedTier] || normalizedTier;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border font-bold uppercase tracking-[0.08em]',
        compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[9px]',
        normalizedTier === 'pro' && 'border-amber-300/40 bg-amber-400/15 text-amber-200',
        normalizedTier === 'essential' && 'border-sky-300/40 bg-sky-400/15 text-sky-200',
        normalizedTier === 'enterprise' && 'border-violet-300/40 bg-violet-400/15 text-violet-200',
        normalizedTier === 'free' && 'border-white/20 bg-white/10 text-slate-300',
        !['free', 'essential', 'pro', 'enterprise'].includes(normalizedTier) &&
          'border-white/20 bg-white/10 text-slate-300'
      )}
      title={`Plano ${label}`}
    >
      {label}
    </span>
  );
}