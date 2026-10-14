'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Minus, Sparkles, Building2, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

export type PlanSlug = 'free' | 'essential' | 'pro' | 'enterprise';

interface FeatureItem {
  label: string;
  included: boolean;
  note?: string;
}

interface PlanCardDefinition {
  id: PlanSlug;
  name: string;
  badge?: string;
  featured?: boolean;
  monthlyEquivalent: string;
  annualTotal: string;
  periodLabel: string;
  description: string;
  features: FeatureItem[];
  ctaLabel: string;
}

interface PlansPricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanTier?: string;
  onSelectPlan?: (planId: PlanSlug) => void;
  isLoadingCheckout?: boolean;
}

const PLANS_DATA: PlanCardDefinition[] = [
  {
    id: 'free',
    name: 'Gratuito',
    monthlyEquivalent: 'R$ 0',
    annualTotal: 'Gratuito para sempre',
    periodLabel: 'Acesso contínuo sem custo',
    description: 'Perfil básico para descoberta orgânica e presença no marketplace.',
    features: [
      { label: 'Perfil básico da empresa', included: true },
      { label: 'Presença nas buscas da categoria', included: true },
      { label: 'Links e contatos essenciais', included: true },
      { label: 'Botões customizados de orçamento', included: false },
      { label: 'Banner promocional de topo', included: false },
      { label: 'Analytics avançado e Live Inbox', included: false },
    ],
    ctaLabel: 'Plano Básico',
  },
  {
    id: 'essential',
    name: 'Essencial',
    badge: 'MAIS ESCOLHIDO',
    monthlyEquivalent: 'R$ 49,17',
    annualTotal: 'R$ 590 / ano',
    periodLabel: 'Cobrança anual (R$ 590)',
    description: 'Destaque visual, sem concorrentes no perfil e botão de orçamento ativo.',
    features: [
      { label: 'Tudo do plano Gratuito', included: true },
      { label: 'Botão "Solicitar orçamento" ativo', included: true },
      { label: 'Sem anúncios de concorrentes no perfil', included: true },
      { label: 'Selo de empresa verificada (auditoria)', included: true },
      { label: 'Até 6 categorias e 10 cidades', included: true },
      { label: 'Banner promocional de topo', included: false },
      { label: 'Analytics avançado de conversão', included: false },
    ],
    ctaLabel: 'Escolher Essencial',
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: '⭐ MAIS VENDIDO',
    featured: true,
    monthlyEquivalent: 'R$ 125,00',
    annualTotal: 'R$ 1.500 / ano',
    periodLabel: 'Cobrança anual (R$ 1.500)',
    description: 'Geração ativa de oportunidades, merchandising completo e analytics.',
    features: [
      { label: 'Tudo do plano Essencial', included: true },
      { label: 'Banner promocional no topo do perfil', included: true },
      { label: 'Live Inbox de leads em tempo real', included: true },
      { label: 'Galeria de mídias e projetos', included: true },
      { label: 'Tabela de preços e oferta especial', included: true },
      { label: 'Dashboard de analytics avançado', included: true },
      { label: 'Até 12 categorias e 30 cidades', included: true },
    ],
    ctaLabel: 'Fazer Upgrade para Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'PERSONALIZADO',
    monthlyEquivalent: 'Sob consulta',
    annualTotal: 'Proposta comercial',
    periodLabel: 'Contrato corporativo customizado',
    description: 'Solução corporativa em escala com cobertura nacional e integrações API.',
    features: [
      { label: 'Tudo do plano Pro', included: true },
      { label: 'Cobertura nacional irrestrita', included: true },
      { label: 'Integração de Webhooks e APIs', included: true },
      { label: 'Atualização direta de mídias', included: true },
      { label: 'Gerente de contas e onboarding dedicado', included: true },
      { label: 'SLA e termos jurídicos sob medida', included: true },
    ],
    ctaLabel: 'Falar com Consultor',
  },
];

const FAQS = [
  {
    q: 'Como funciona a cobrança dos planos pagos?',
    a: 'Os planos Essencial e Pro são faturados em ciclo anual com pagamento via cartão ou boleto bancário através da plataforma segura.',
  },
  {
    q: 'O selo de empresa verificada é garantido automaticamente?',
    a: 'O selo requer validação dos documentos cadastrais (CNPJ ativo, regularidade e alvarás) por nossa equipe de moderação para garantir conformidade.',
  },
  {
    q: 'Posso alterar de plano a qualquer momento?',
    a: 'Sim, você pode solicitar upgrade para planos superiores diretamente pelo painel a qualquer momento, aproveitando os novos recursos imediatamente.',
  },
];

export function PlansPricingModal({
  open,
  onOpenChange,
  currentPlanTier = 'free',
  onSelectPlan,
  isLoadingCheckout = false,
}: PlansPricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanSlug | null>(null);
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);

  const normalizedTier = (currentPlanTier || 'free').toLowerCase();

  const handleSelect = (planId: PlanSlug) => {
    setSelectedPlanId(planId);
    if (planId === 'enterprise') {
      setEnterpriseSubmitted(true);
    }
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-5xl max-h-[min(88dvh,820px)] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="pr-7 text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
              Escolha o plano ideal para sua empresa
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Compare recursos oficiais e acelere sua geração de demanda no marketplace de energia solar.
          </DialogDescription>
        </DialogHeader>

        {/* Toggle de Ciclo de Faturamento */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 dark:border-slate-800 py-3">
          <div
            className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 w-fit"
            role="group"
            aria-label="Opções de visualização de valores"
          >
            <button
              type="button"
              aria-pressed={billingCycle === 'yearly'}
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              )}
            >
              Faturamento Anual (Melhor Valor)
            </button>
            <button
              type="button"
              aria-pressed={billingCycle === 'monthly'}
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              )}
            >
              Mensal Equivalente
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Garantia Avalia Solar:</span> ativação imediata pós-confirmação.
          </div>
        </div>

        {/* Grid de Planos */}
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS_DATA.map((plan) => {
            const isCurrent = normalizedTier === plan.id;
            const isFeatured = plan.featured;
            const isSelectingThis = isLoadingCheckout && selectedPlanId === plan.id;

            return (
              <section
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-xl border p-4 transition-all duration-150',
                  isFeatured
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                  isCurrent && 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                )}
              >
                {/* Badge Destaque */}
                {plan.badge && (
                  <div className="absolute -top-2.5 left-4">
                    <Badge
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide',
                        isFeatured
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900'
                      )}
                    >
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="mt-1">
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 min-h-[32px] line-clamp-2">
                    {plan.description}
                  </p>
                </div>

                {/* Preço */}
                <div className="mt-3 min-h-[52px]">
                  {billingCycle === 'monthly' ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                          {plan.monthlyEquivalent}
                        </span>
                        {plan.id !== 'free' && plan.id !== 'enterprise' && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">/ mês</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {plan.periodLabel}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                          {plan.id === 'essential' ? 'R$ 590' : plan.id === 'pro' ? 'R$ 1.500' : plan.monthlyEquivalent}
                        </span>
                        {plan.id !== 'free' && plan.id !== 'enterprise' && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">/ ano</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {plan.id === 'free' ? 'Sem custos recorrentes' : plan.id === 'enterprise' ? 'Proposta sob medida' : `Eqv. a ${plan.monthlyEquivalent}/mês`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div className="my-3.5 h-px bg-slate-200 dark:bg-slate-800" />

                {/* Checklist de Features */}
                <ul className="flex-1 space-y-2 text-xs">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                      ) : (
                        <Minus className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-600 mt-0.5" />
                      )}
                      <span
                        className={cn(
                          'leading-tight',
                          feature.included
                            ? 'text-slate-800 dark:text-slate-200 font-medium'
                            : 'text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Botão de Ação (CTA) */}
                <div className="mt-4 pt-2">
                  <Button
                    type="button"
                    disabled={isCurrent || isSelectingThis}
                    onClick={() => handleSelect(plan.id)}
                    className={cn(
                      'w-full min-h-[42px] font-semibold text-xs transition-all duration-150',
                      isCurrent && 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 cursor-default',
                      !isCurrent && isFeatured && 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
                      !isCurrent && !isFeatured && 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                    )}
                  >
                    {isSelectingThis ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Carregando...</span>
                      </span>
                    ) : isCurrent ? (
                      'Plano Atual'
                    ) : (
                      plan.ctaLabel
                    )}
                  </Button>
                </div>
              </section>
            );
          })}
        </div>

        {/* Feedback caso selecione Enterprise */}
        {enterpriseSubmitted && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
            <strong>Solicitação registrada!</strong> Nossa equipe comercial entrará em contato com a sua empresa para alinhar a proposta Enterprise sob medida.
          </div>
        )}

        {/* FAQ Rápido Comercial */}
        <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
            <HelpCircle className="h-3.5 w-3.5" />
            Perguntas Frequentes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5">
                <p className="font-semibold text-slate-900 dark:text-slate-200">{faq.q}</p>
                <p className="mt-1 text-[11px] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé Legal / Termos */}
        <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Valores e condições sujeitos aos termos de serviço vigentes. Para dúvidas ou suporte financeiro, contate{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">suporte@avaliasolar.com.br</span>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
