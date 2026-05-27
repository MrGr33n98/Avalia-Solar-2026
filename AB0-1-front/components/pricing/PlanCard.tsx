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
  pro: {
    topBar: 'bg-gradient-to-r from-brand-blue-dark via-brand-blue to-brand-blue-light',
    iconBg: 'bg-brand-blue',
    accentText: 'text-brand-blue',
    badgeCls: 'border border-brand-blue/20 bg-brand-blue/10 text-brand-blue',
    ringCls: 'ring-2 ring-brand-blue/20',
    shadowCls: 'shadow-[0_24px_56px_-24px_rgba(0,86,210,0.32)]',
    ctaCls: 'bg-brand-blue hover:bg-brand-blue-light text-white border-0 shadow-[0_16px_30px_-20px_rgba(0,86,210,0.72)]',
    checkBg: 'bg-brand-blue/10',
    checkText: 'text-brand-blue',
  },
  enterprise: {
    topBar: 'bg-gradient-to-r from-slate-900 via-brand-cyan-dark to-brand-blue',
    iconBg: 'bg-slate-900',
    accentText: 'text-brand-blue-dark',
    badgeCls: 'border border-brand-cyan/25 bg-brand-cyan/10 text-brand-blue-dark',
    ringCls: 'ring-1 ring-brand-blue/12',
    shadowCls: 'shadow-[0_24px_56px_-24px_rgba(15,23,42,0.24)]',
    ctaCls: 'bg-slate-900 hover:bg-brand-blue-dark text-white border-0 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.7)]',
    checkBg: 'bg-brand-cyan/10',
    checkText: 'text-brand-blue-dark',
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
        'bg-white/80 backdrop-blur-md',
        slug === 'pro' ? 'clay-convex' : 'clay-card',
        cfg.ringCls,
        cfg.shadowCls,
        isCurrentPlan ? 'ring-2 ring-brand-blue/30' : '',
      ].join(' ')}
    >
      {/* Barra de destaque superior */}
      <div className={`h-[5px] w-full ${cfg.topBar}`} />

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
                    <span className="h-2 w-2 rounded-full bg-brand-blue animate-pulse" title="Seu plano ativo" />
                  )}
                </div>
                <div className="text-xs text-slate-500">{billingNote}</div>
              </div>
            </div>

            {badge && (
              <motion.div
                className="inline-block"
                animate={
                  slug === 'pro'
                    ? { scale: [1, 1.045, 1] }
                    : {}
                }
                transition={
                  slug === 'pro'
                    ? { repeat: Infinity, duration: 2.6, ease: 'easeInOut' }
                    : {}
                }
              >
                <Badge
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${cfg.badgeCls}`}
                >
                  {badge}
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className={`text-xl font-black tracking-tight ${cfg.accentText}`}>
              {priceLabel}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              {slug === 'free' ? 'Para sempre' : slug === 'pro' ? 'Anual' : 'Personalizado'}
            </div>
          </div>
        </div>

        <div className="my-5 h-px bg-slate-100/80" />

        {/* Resumo */}
        <p className="text-sm leading-relaxed text-slate-600">{summary}</p>

        {/* Destaques (Highlights) */}
        <ul className="mt-5 flex-1 space-y-3">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-sm text-slate-700">
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
            'mt-7 h-12 w-full rounded-full font-semibold transition-all',
            isCurrentPlan ? 'bg-slate-200 text-slate-500 hover:bg-slate-200 border-0 cursor-default' : cfg.ctaCls,
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
      <div className="h-[5px] w-full bg-slate-200 animate-pulse" />
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
