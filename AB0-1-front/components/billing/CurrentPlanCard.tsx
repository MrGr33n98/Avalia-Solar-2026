'use client';

import { motion } from 'framer-motion';
import { Building2, ShieldCheck, Zap, Calendar, CreditCard, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type BillingSubscription } from '@/lib/api/billing';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { TrialCountdown } from './TrialCountdown';

interface CurrentPlanCardProps {
  subscription: BillingSubscription | null;
  loading?: boolean;
  onManageClick?: () => void;
  actionLoading?: boolean;
}

export function CurrentPlanCard({
  subscription,
  loading = false,
  onManageClick,
  actionLoading = false,
}: CurrentPlanCardProps) {
  
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/50 p-8 backdrop-blur-md shadow-sm h-[320px] animate-pulse">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-200" />
            <div className="space-y-3">
              <div className="h-6 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-48 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="h-7 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="my-6 h-px bg-slate-100" />
        <div className="space-y-4">
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  const planSlug = subscription?.plan.slug || 'free';
  const status = subscription?.status || 'active';

  // Configuração visual de acordo com o plano
  const planInfoMap: Record<string, {
    name: string;
    icon: React.ComponentType<any>;
    accentText: string;
    iconBg: string;
    cardCls: string;
    description: string;
  }> = {
    free: {
      name: 'Gratuito',
      icon: Building2,
      accentText: 'text-slate-900',
      iconBg: 'bg-slate-900',
      cardCls: 'clay-card border-slate-200 bg-white/70 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)]',
      description: 'Presença orgânica inicial na plataforma e comparação com alternativas.',
    },
    pro: {
      name: 'Pro',
      icon: Zap,
      accentText: 'text-brand-green',
      iconBg: 'bg-brand-green',
      cardCls: 'clay-convex border-emerald-100 bg-emerald-50/20 shadow-[0_20px_50px_-12px_rgba(52,199,89,0.15)] ring-1 ring-brand-green/10',
      description: 'Vitrine comercial ativa e geração de leads. Sem publicidade de concorrentes.',
    },
    enterprise: {
      name: 'Enterprise',
      icon: ShieldCheck,
      accentText: 'text-brand-purple',
      iconBg: 'bg-brand-purple',
      cardCls: 'clay-card border-violet-100 bg-violet-50/15 shadow-[0_20px_50px_-12px_rgba(108,92,231,0.1)] ring-1 ring-brand-purple/10',
      description: 'Dados estratégicos avançados, webhooks de integração e inteligência corporativa.',
    },
  };

  const planInfo = planInfoMap[planSlug] || {
    name: 'Gratuito',
    icon: Building2,
    accentText: 'text-slate-900',
    iconBg: 'bg-slate-900',
    cardCls: 'clay-card border-slate-200 bg-white/70 shadow-sm',
    description: 'Plano básico.',
  };

  const Icon = planInfo.icon;

  // Helpers para formatar datas
  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Cores das badges de status
  const statusBadgeCls = {
    active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    trialing: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    past_due: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    unpaid: 'bg-red-500/10 text-red-700 border-red-500/20',
    canceled: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
    enterprise_lead: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  }[status] || 'bg-slate-100 text-slate-700';

  const statusLabel = {
    active: 'Ativa',
    trialing: 'Período de Testes',
    past_due: 'Pagamento Pendente',
    unpaid: 'Inadimplente',
    canceled: 'Cancelada',
    enterprise_lead: 'Lead Solicitado',
  }[status] || status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[2.5rem] border p-8 backdrop-blur-md ${planInfo.cardCls}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        
        {/* Cabeçalho do plano atual */}
        <div className="flex items-start gap-4 flex-1">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${planInfo.iconBg} text-white shadow-md shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="text-2xl font-black tracking-tight text-slate-950">
                Plano {planInfo.name}
              </h4>
              <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusBadgeCls}`}>
                {statusLabel}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xl">
              {planInfo.description}
            </p>
          </div>
        </div>

        {/* Informações financeiras secundárias */}
        {planSlug !== 'free' && (
          <div className="p-4 rounded-2xl bg-white/40 border border-white/50 space-y-2.5 min-w-[200px] shrink-0 text-slate-700 text-xs">
            <div className="flex items-center justify-between gap-4 font-semibold text-slate-900 border-b border-slate-150 pb-2">
              <span>Faturamento</span>
              <span className={planInfo.accentText}>
                {subscription?.plan.price_formatted || 'Customizado'}
              </span>
            </div>
            
            {subscription?.current_period_end && (
              <div className="flex items-center justify-between gap-4 text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Renovação
                </span>
                <span>{formatDate(subscription.current_period_end)}</span>
              </div>
            )}

            {subscription?.stripe_subscription_id && (
              <div className="flex items-center justify-between gap-4 text-slate-500">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  ID Assinatura
                </span>
                <span className="font-mono text-[10px] tracking-tight max-w-[80px] truncate" title={subscription.stripe_subscription_id}>
                  {subscription.stripe_subscription_id.substring(0, 10)}...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="my-6 h-px bg-slate-200/50" />

      {/* Lógica de upsell / ações e contadores */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          {status === 'trialing' && subscription && (
            <TrialCountdown trialEnd={subscription.trial_end} />
          )}

          {planSlug === 'free' && (
            <div className="flex items-center gap-2 text-xs text-brand-blue font-semibold bg-brand-blue/5 border border-brand-blue/10 px-4 py-2 rounded-full">
              <Shield className="h-4 w-4" />
              <span>Upsell ativo: faça upgrade para o plano Pro para liberar CTAs customizados!</span>
            </div>
          )}

          {status === 'enterprise_lead' && (
            <div className="flex items-center gap-2 text-xs text-brand-purple font-semibold bg-brand-purple/5 border border-brand-purple/10 px-4 py-2 rounded-full">
              <ShieldCheck className="h-4 w-4" />
              <span>Sua solicitação de plano Enterprise está sendo analisada por nossos consultores.</span>
            </div>
          )}
        </div>

        {/* Botão de gerenciar assinatura */}
        {planSlug !== 'free' && status !== 'enterprise_lead' && onManageClick && (
          <ManageSubscriptionButton
            onClick={onManageClick}
            disabled={actionLoading}
            isLoading={actionLoading}
          />
        )}
      </div>
    </motion.div>
  );
}
