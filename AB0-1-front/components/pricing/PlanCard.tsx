'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type PlanSlug } from '@/lib/pricing/catalog';

export interface PlanCardProps {
  slug: PlanSlug;
  name: string;
  priceLabel: string;
  billingNote: string;
  summary: string;
  badge?: string;
  featured?: boolean;
  highlights: string[];
  ctaLabel: string;
  icon: LucideIcon;
  isCurrentPlan: boolean;
  subscriptionStatus?: string;
  isLoading?: boolean;
  onCtaClick: () => void;
  yearlyPriceLabel?: string; // Ex: "ou R$ 599/ano"
  savingBadge?: string; // Ex: "Economize 2 meses"
}

interface PlanVisualConfig {
  topBar: string;
  iconBg: string;
  accentText: string;
  badgeCls: string;
  ringCls: string;
  shadowCls: string;
  ctaCls: string;
  checkBg: string;
  checkText: string;
}

const planConfig: Record<PlanSlug, PlanVisualConfig> = {
  free: {
    topBar: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
    iconBg: 'bg-slate-900',
    accentText: 'text-slate-900',
    badgeCls: '',
    ringCls: '',
    shadowCls: 'shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)]',
    ctaCls: 'clay-chip border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
    checkBg: 'bg-slate-100',
    checkText: 'text-slate-500',
  },
  essential: {
    topBar: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400',
    iconBg: 'bg-teal-600',
    accentText: 'text-teal-600',
    badgeCls: 'border border-emerald-500/25 bg-emerald-500/10 text-teal-700',
    ringCls: '',
    shadowCls: 'shadow-[0_8px_40px_-12px_rgba(13,148,136,0.12)]',
    ctaCls: 'bg-teal-600 hover:bg-teal-500 text-white border-0 shadow-[0_16px_30px_-20px_rgba(13,148,136,0.5)]',
    checkBg: 'bg-emerald-50',
    checkText: 'text-emerald-600',
  },
  pro: {
    topBar: 'bg-gradient-to-r from-brand-blue-dark via-brand-blue to-brand-blue-light',
    iconBg: 'bg-brand-blue',
    accentText: 'text-brand-blue',
    badgeCls: 'bg-brand-blue text-white border-0 shadow-[0_4px_12px_rgba(0,87,231,0.25)]',
    ringCls: 'ring-[3px] ring-brand-blue/35',
    shadowCls: 'shadow-[0_32px_64px_-16px_rgba(0,86,210,0.22)]',
    ctaCls: 'bg-brand-blue hover:bg-brand-blue-light text-white border-0 shadow-[0_16px_30px_-20px_rgba(0,86,210,0.72)]',
    checkBg: 'bg-brand-blue/10',
    checkText: 'text-brand-blue',
  },
  enterprise: {
    topBar: 'bg-gradient-to-r from-slate-900 via-brand-cyan-dark to-brand-blue',
    iconBg: 'bg-slate-900',
    accentText: 'text-slate-950',
    badgeCls: 'border border-slate-200 bg-slate-100 text-slate-700',
    ringCls: 'ring-1 ring-slate-950/5',
    shadowCls: 'shadow-[0_24px_56px_-24px_rgba(15,23,42,0.15)]',
    ctaCls: 'bg-slate-900 hover:bg-slate-850 text-white border-0 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.7)]',
    checkBg: 'bg-slate-100',
    checkText: 'text-slate-800',
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 26 },
  },
};

export function PlanCard({
  slug,
  name,
  priceLabel,
  billingNote,
  summary,
  badge,
  featured,
  highlights,
  ctaLabel,
  icon: Icon,
  isCurrentPlan,
  subscriptionStatus,
  isLoading = false,
  onCtaClick,
  yearlyPriceLabel,
  savingBadge,
}: PlanCardProps) {
  const cfg = planConfig[slug] || planConfig.free;

  // Formata o rótulo do status de assinatura para exibição amigável se for o plano atual
  const getStatusLabel = () => {
    if (!subscriptionStatus) return '';
    switch (subscriptionStatus) {
      case 'trialing':
        return ' (Período de Teste)';
      case 'past_due':
        return ' (Pagamento Pendente)';
      case 'unpaid':
        return ' (Inadimplente)';
      case 'canceled':
        return ' (Cancelada)';
      case 'enterprise_lead':
        return ' (Lead Solicitado)';
      default:
        return '';
    }
  };

  return (
    <motion.div
      variants={cardVariant}
      className={[
        'relative flex flex-col overflow-hidden rounded-[2rem] border border-white/60',
        'bg-white/95 backdrop-blur-md transition-all duration-300',
        slug === 'pro' ? 'clay-convex scale-[1.02] md:scale-[1.03] lg:scale-[1.04] z-10' : 'clay-card hover:scale-[1.01]',
        cfg.ringCls,
        cfg.shadowCls,
        isCurrentPlan ? 'ring-2 ring-brand-blue/30' : '',
      ].join(' ')}
    >
      {/* Barra de destaque superior */}
      <div className={`h-[6px] w-full ${cfg.topBar}`} />

      <div className="flex flex-1 flex-col p-7">
        {/* Cabeçalho do plano */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${cfg.iconBg} text-white shadow-lg`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-1.5">
                  {name}
                  {isCurrentPlan && (
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-blue animate-pulse" title="Seu plano ativo" />
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">{billingNote}</div>
              </div>
            </div>

            {badge && (
              <motion.div
                className="inline-block"
                animate={
                  slug === 'pro'
                    ? { scale: [1, 1.03, 1] }
                    : {}
                }
                transition={
                  slug === 'pro'
                    ? { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                    : {}
                }
              >
                <Badge
                  className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${cfg.badgeCls}`}
                >
                  {badge}
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="flex flex-col items-end">
              <div className={`text-2xl font-black tracking-tight ${cfg.accentText}`}>
                {priceLabel}
                {slug !== 'free' && slug !== 'enterprise' && (
                  <span className="text-xs font-semibold text-slate-500">/mês</span>
                )}
              </div>
              
              {yearlyPriceLabel && (
                <div className="mt-1 text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <span>{yearlyPriceLabel}</span>
                  {savingBadge && (
                    <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black px-1 rounded uppercase tracking-wider">
                      {savingBadge}
                    </span>
                  )}
                </div>
              )}

              {!yearlyPriceLabel && (
                <div className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                  {slug === 'free' ? 'Para sempre' : 'Personalizado'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="my-5 h-px bg-slate-100/80" />

        {/* Resumo */}
        <p className="text-sm leading-relaxed text-slate-600 min-h-[48px]">{summary}</p>

        {/* Destaques (Highlights) */}
        <ul className="mt-5 flex-1 space-y-3">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cfg.checkBg} ${cfg.checkText}`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {/* Botão de Chamada para Ação (CTA) */}
        <Button
          onClick={onCtaClick}
          disabled={isLoading}
          size="lg"
          className={[
            'mt-7 h-12 w-full rounded-full font-bold text-sm transition-all',
            isCurrentPlan ? 'bg-slate-200 text-slate-500 hover:bg-slate-200 border-0 cursor-default shadow-none' : cfg.ctaCls,
          ].join(' ')}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              Carregando...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              {isCurrentPlan ? `Plano Atual${getStatusLabel()}` : ctaLabel}
              {!isCurrentPlan && <ChevronRight className="ml-2 h-4 w-4" />}
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 backdrop-blur-md shadow-sm h-[500px]">
      <div className="h-[6px] w-full bg-slate-200 animate-pulse" />
      <div className="flex flex-1 flex-col p-7 space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-24 bg-slate-200 animate-pulse rounded" />
              <div className="h-3 w-32 bg-slate-200 animate-pulse rounded" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="h-5 w-20 bg-slate-200 animate-pulse rounded ml-auto" />
            <div className="h-3 w-12 bg-slate-200 animate-pulse rounded ml-auto" />
          </div>
        </div>
        <div className="h-px bg-slate-100/80" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-200 animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="space-y-3 flex-1 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="h-4 w-3/4 bg-slate-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-slate-200 animate-pulse rounded-full" />
      </div>
    </div>
  );
}
