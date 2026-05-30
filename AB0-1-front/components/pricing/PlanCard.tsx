'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  yearlyPriceLabel?: string;
  savingBadge?: string;
}

interface PlanVisualConfig {
  topBar: string;
  iconBg: string;
  topBadgeCls: string;
  ringCls: string;
  shadowCls: string;
  ctaCls: string;
  checkBg: string;
  checkText: string;
  priceCls: string;
}

const planConfig: Record<PlanSlug, PlanVisualConfig> = {
  free: {
    topBar: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
    iconBg: 'bg-slate-900',
    topBadgeCls: '',
    ringCls: '',
    shadowCls: 'shadow-[0_4px_24px_-8px_rgba(15,23,42,0.10)]',
    ctaCls: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
    checkBg: 'bg-slate-100',
    checkText: 'text-slate-500',
    priceCls: 'text-slate-900',
  },
  essential: {
    topBar: 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400',
    iconBg: 'bg-emerald-500',
    topBadgeCls: 'bg-emerald-500 text-white',
    ringCls: 'ring-2 ring-emerald-400/40',
    shadowCls: 'shadow-[0_8px_40px_-12px_rgba(16,185,129,0.22)]',
    ctaCls: 'bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]',
    checkBg: 'bg-emerald-50',
    checkText: 'text-emerald-500',
    priceCls: 'text-emerald-600',
  },
  pro: {
    topBar: 'bg-gradient-to-r from-brand-blue-dark via-brand-blue to-brand-blue-light',
    iconBg: 'bg-brand-blue',
    topBadgeCls: 'bg-brand-blue text-white',
    ringCls: 'ring-2 ring-brand-blue/40 border-brand-blue/30',
    shadowCls: 'shadow-[0_24px_64px_-12px_rgba(0,86,210,0.28)]',
    ctaCls: 'bg-brand-blue hover:bg-brand-blue-light text-white border-0 shadow-[0_8px_24px_-8px_rgba(0,86,210,0.6)]',
    checkBg: 'bg-brand-blue/10',
    checkText: 'text-brand-blue',
    priceCls: 'text-brand-blue',
  },
  enterprise: {
    topBar: 'bg-gradient-to-r from-slate-900 via-brand-cyan-dark to-brand-blue',
    iconBg: 'bg-slate-900',
    topBadgeCls: '',
    ringCls: 'ring-1 ring-slate-950/10',
    shadowCls: 'shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)]',
    ctaCls: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-900',
    checkBg: 'bg-slate-100',
    checkText: 'text-slate-700',
    priceCls: 'text-slate-950',
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
  const showTopBadge = badge && cfg.topBadgeCls && (slug === 'essential' || slug === 'pro');

  const getStatusLabel = () => {
    if (!subscriptionStatus) return '';
    switch (subscriptionStatus) {
      case 'trialing': return ' (Período de Teste)';
      case 'past_due': return ' (Pagamento Pendente)';
      case 'unpaid': return ' (Inadimplente)';
      case 'canceled': return ' (Cancelada)';
      case 'enterprise_lead': return ' (Lead Solicitado)';
      default: return '';
    }
  };

  return (
    <motion.div
      variants={cardVariant}
      className={[
        'relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200/70 h-full',
        'bg-white transition-all duration-300',
        slug === 'pro' ? 'z-10' : 'hover:shadow-md',
        cfg.ringCls,
        cfg.shadowCls,
        isCurrentPlan ? 'ring-2 ring-brand-blue/30' : '',
      ].join(' ')}
    >
      {/* Badge superior destacado (MAIS ESCOLHIDO / MAIS VENDIDO) */}
      {showTopBadge && (
        <div className={`w-full py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] ${cfg.topBadgeCls}`}>
          {badge}
        </div>
      )}

      {/* Barra de cor superior */}
      <div className={`h-[5px] w-full ${cfg.topBar}`} />

      <div className="flex flex-1 flex-col p-7">
        {/* Ícone + Nome + Subtítulo */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${cfg.iconBg} text-white shadow-md`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-slate-950 flex items-center gap-1.5">
              {name}
              {isCurrentPlan && (
                <span className="h-2 w-2 rounded-full bg-brand-blue animate-pulse" title="Seu plano ativo" />
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium">{billingNote}</div>
          </div>
        </div>

        {/* Preço — hierarquia: valor mensal grande > anual secundário > savings badge */}
        <div className="mb-5">
          <div className={`text-4xl font-black tracking-tight leading-none ${cfg.priceCls}`}>
            {priceLabel}
            {slug !== 'free' && slug !== 'enterprise' && (
              <span className="text-base font-semibold text-slate-500 ml-0.5">/mês</span>
            )}
          </div>

          {slug === 'free' && (
            <div className="mt-1 text-sm text-slate-500 font-medium">para sempre</div>
          )}
          {slug === 'enterprise' && (
            <div className="mt-1 text-sm text-slate-500 font-medium">Fale com nosso time</div>
          )}

          {yearlyPriceLabel && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">{yearlyPriceLabel}</span>
              {savingBadge && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  slug === 'essential'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-sky-50 text-brand-blue border border-brand-blue/20'
                }`}>
                  {savingBadge}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 mb-5" />

        {/* Highlights / Features */}
        <ul className="flex-1 space-y-3 mb-7">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-sm text-slate-700">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cfg.checkBg} ${cfg.checkText}`}>
                <Check className="h-3 w-3" />
              </span>
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          onClick={onCtaClick}
          disabled={isLoading}
          size="lg"
          className={[
            'h-12 w-full rounded-full font-bold text-sm transition-all',
            isCurrentPlan ? 'bg-slate-100 text-slate-500 hover:bg-slate-100 border-0 cursor-default shadow-none' : cfg.ctaCls,
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
    <div className="relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm h-[520px]">
      <div className="h-[5px] w-full bg-slate-200 animate-pulse" />
      <div className="flex flex-1 flex-col p-7 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-24 bg-slate-200 animate-pulse rounded" />
            <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-10 w-32 bg-slate-200 animate-pulse rounded" />
          <div className="h-3 w-40 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="h-px bg-slate-100" />
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
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
