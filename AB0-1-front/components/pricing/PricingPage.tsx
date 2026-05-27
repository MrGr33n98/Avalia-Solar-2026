'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Check,
  MessageSquare,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { billingApi, type BillingPlan, type BillingSubscription } from '@/lib/api/billing';
import { pricingPlans, type PlanSlug } from '@/lib/pricing/catalog';

// Importa os subcomponentes modulares
import { PlanCard, PlanCardSkeleton } from './PlanCard';
import { FeatureComparisonTable } from './FeatureComparisonTable';
import { PricingFaq } from './PricingFaq';
import { ErrorBanner } from '@/components/billing/ErrorBanner';

// ─── Variantes de Animação ──────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.10 } },
};

const modalVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 } 
  },
  exit: { 
    opacity: 0, scale: 0.95, y: 16,
    transition: { duration: 0.2, ease: 'easeIn' } 
  }
};

const planIconMap = {
  free: Building2,
  pro: Zap,
  enterprise: ShieldCheck,
};

const planOrder: Record<PlanSlug, number> = { free: 0, pro: 1, enterprise: 2 };

function normalizePlanSlug(plan: Partial<BillingPlan> & { plan_tier?: string }, fallbackIndex = 0): PlanSlug {
  const explicitSlug = plan.slug || plan.plan_tier;
  if (explicitSlug === 'free' || explicitSlug === 'pro' || explicitSlug === 'enterprise') {
    return explicitSlug;
  }

  const normalizedName = plan.name?.toLowerCase() || '';
  if (normalizedName.includes('enterprise')) return 'enterprise';
  
  // Prefer exact 'pro' match first to avoid 'starter' overriding it
  if (normalizedName.includes('pro')) return 'pro';
  if (/starter|premium|pago/.test(normalizedName)) return 'pro'; // fallback for other paid plans
  
  if (/free|gratuito|basic/.test(normalizedName)) return 'free';

  return pricingPlans[fallbackIndex]?.slug || 'free';
}

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Estados locais
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingPlanId, setActionLoadingPlanId] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastFailedPlan, setLastFailedPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado para o Modal de Lead Enterprise
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [enterprisePlan, setEnterprisePlan] = useState<BillingPlan | null>(null);
  const [justification, setJustification] = useState('');
  const [phoneContact, setPhoneContact] = useState('');
  const [estimatedMrr, setEstimatedMrr] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalSuccessMessage, setModalSuccessMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Carrega planos e assinatura
  useEffect(() => {
    async function loadPricingData() {
      setLoading(true);
      setError(null);

      try {
        // Busca os planos do backend
        let apiPlans: BillingPlan[] = [];
        try {
          apiPlans = await billingApi.getPlans();
        } catch (err) {
          console.warn('[PricingPage] Falha ao carregar planos da API, usando catálogo estático como fallback:', err);
        }

        const apiPlansBySlug = apiPlans.reduce<Partial<Record<PlanSlug, BillingPlan>>>((acc, apiPlan, index) => {
          const slug = normalizePlanSlug(apiPlan as BillingPlan & { plan_tier?: string }, index);
          
          if (slug === 'pro' && apiPlan.name.toLowerCase().includes('pro')) {
            acc[slug] = { ...apiPlan, slug }; // Sobrescreve se for o verdadeiro 'pro'
          } else {
            acc[slug] = acc[slug] || { ...apiPlan, slug };
          }
          
          return acc;
        }, {});

        // O backend define IDs/Stripe/features; o catálogo local define a apresentação pública.
        const displayPlans = pricingPlans
          .map((staticPlan, index) => {
            const apiPlan = apiPlansBySlug[staticPlan.slug];

            return {
              ...apiPlan,
              id: apiPlan?.id || index + 1,
              slug: staticPlan.slug,
              name: staticPlan.name,
              price_cents: apiPlan?.price_cents ?? (staticPlan.slug === 'free' ? 0 : 49900),
              price_formatted: apiPlan?.price_formatted || staticPlan.priceLabel,
              price_label: apiPlan?.price_label || apiPlan?.price_formatted || staticPlan.priceLabel,
              stripe_product_id: apiPlan?.stripe_product_id || null,
              stripe_price_id_monthly: apiPlan?.stripe_price_id_monthly || null,
              stripe_price_id_yearly: apiPlan?.stripe_price_id_yearly || null,
              features: apiPlan?.features || {},
              highlights: staticPlan.highlights,
              audience: staticPlan.audience,
              summary: staticPlan.summary,
              billingNote: staticPlan.billingNote,
              badge: staticPlan.badge,
              featured: staticPlan.featured,
              priceLabel: apiPlan?.price_formatted || staticPlan.priceLabel,
              ctaLabel: staticPlan.ctaLabel,
            };
          })
          .sort((a, b) => planOrder[a.slug] - planOrder[b.slug]);

        setPlans(displayPlans);

        // Busca assinatura se estiver logado e tiver empresa associada
        if (isAuthenticated && user?.company_id) {
          const sub = await billingApi.getSubscription(user.company_id);
          setSubscription(sub);
        }
      } catch (err: any) {
        console.error('[PricingPage] Erro ao carregar dados de faturamento:', err);
        setError('Ocorreu um erro ao carregar os planos de faturamento. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }

    loadPricingData();
  }, [isAuthenticated, user?.company_id]);

  // Handler para os cliques em CTA de planos
  const handlePlanCta = async (plan: any) => {
    if (!isAuthenticated) {
      // Redireciona usuários não logados com parâmetro de plano
      router.push(`/register?plan=${plan.slug}`);
      return;
    }

    if (!user?.company_id) {
      // Caso de segurança: usuário sem empresa associada precisa selecionar/criar uma primeiro
      router.push('/select-company?reason=billing_required');
      return;
    }

    setActionLoadingPlanId(plan.id);
    setCheckoutError(null);
    setLastFailedPlan(plan);

    try {
      if (plan.slug === 'free') {
        // CTA do gratuito para logados
        router.push('/dashboard');
        return;
      }

      if (plan.slug === 'pro') {
        // Se já tiver uma assinatura Pro ativa ou trialing, abre o portal do Stripe
        const isAlreadyPro = subscription && subscription.plan.slug === 'pro' && 
                             ['active', 'trialing', 'past_due'].includes(subscription.status);

        if (isAlreadyPro) {
          const { portal_url } = await billingApi.createPortalSession(user.company_id, window.location.href);
          window.location.href = portal_url;
        } else {
          // Cria sessão de checkout do Stripe para contratação do Pro
          const successUrl = `${window.location.origin}/dashboard?company_id=${user.company_id}&checkout=success`;
          const cancelUrl = window.location.href;
          const { checkout_url } = await billingApi.createCheckoutSession(
            user.company_id,
            plan.id,
            successUrl,
            cancelUrl
          );
          window.location.href = checkout_url;
        }
        return;
      }

      if (plan.slug === 'enterprise') {
        // Se for o plano enterprise, abre o modal de captação de lead qualificado (Enterprise Lead)
        setEnterprisePlan(plan);
        setJustification('');
        setPhoneContact('');
        setEstimatedMrr('');
        setModalSuccessMessage(null);
        setModalError(null);
        setIsEnterpriseModalOpen(true);
      }
    } catch (err: any) {
      console.error('[PricingPage] Erro ao processar ação de faturamento:', err);
      setCheckoutError(err?.message || 'Falha ao processar solicitação. Por favor, tente novamente.');
    } finally {
      setActionLoadingPlanId(null);
    }
  };

  // Envio do formulário de Lead Enterprise
  const handleEnterpriseLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.company_id || !enterprisePlan) return;

    if (!justification.trim() || !phoneContact.trim()) {
      setModalError('Por favor, preencha a justificativa e o telefone de contato.');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const payload: any = {
        justification,
        phone_contact: phoneContact,
      };

      if (estimatedMrr) {
        payload.estimated_mrr = Number(estimatedMrr);
      }

      await billingApi.createEnterpriseLead(user.company_id, enterprisePlan.id, payload);
      setModalSuccessMessage('Sua solicitação de plano Enterprise foi enviada com sucesso! Nosso time comercial entrará em contato em breve.');
      
      // Atualiza a assinatura localmente para refletir o novo estado de lead
      if (isAuthenticated && user?.company_id) {
        const sub = await billingApi.getSubscription(user.company_id);
        setSubscription(sub);
      }
    } catch (err: any) {
      console.error('[PricingPage] Erro ao enviar lead enterprise:', err);
      setModalError(err?.message || 'Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Verifica se o plano renderizado é o plano atual do usuário logado
  const checkIsCurrentPlan = (planSlug: PlanSlug) => {
    if (!isAuthenticated || !subscription) {
      // Se não tiver assinatura salva mas estiver logado e for o plano 'free'
      return planSlug === 'free' && !subscription;
    }
    return subscription.plan.slug === planSlug && ['active', 'trialing', 'past_due', 'enterprise_lead'].includes(subscription.status);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--clay-bg))_44%,hsl(var(--background))_100%)] pb-12">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative border-b border-white/50 pb-16 pt-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="clay-precision-chip mb-6 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.22em]"
              >
                Planos e Entitlements
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-balance text-4xl font-black tracking-tight text-slate-950 md:text-5xl lg:text-[3.5rem] leading-[1.1]"
            >
              Preços pensados para{' '}
              <span className="text-brand-blue">presença</span>,{' '}
              <span className="text-brand-blue">conversão</span>
              {' '}e operação comercial madura.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
            >
              O gratuito garante{' '}
              <strong className="text-slate-800">presença mínima</strong> no marketplace.
              O Pro transforma seu perfil em{' '}
              <strong className="text-brand-blue">vitrine comercial ativa</strong>.
              O Enterprise adiciona{' '}
              <strong className="text-slate-900">inteligência de mercado e governança</strong>.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="clay-btn-primary h-12 rounded-full px-8">
                <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                  {isAuthenticated ? 'Acessar painel' : 'Começar agora'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="clay-chip h-12 rounded-full border-white/80 bg-white/70 px-8 backdrop-blur-sm"
              >
                <Link href="/contact">Falar com vendas</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PLANS CARDS SECTION ───────────────────────────────────────────── */}
      <section className="relative py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 max-w-2xl mx-auto space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center text-sm">
                {error}
              </div>
            )}

            <ErrorBanner 
              error={checkoutError}
              onRetry={() => lastFailedPlan && handlePlanCta(lastFailedPlan)}
              onDismiss={() => setCheckoutError(null)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {loading ? (
              // Mostra skeletons de planos carregando
              <>
                <PlanCardSkeleton />
                <PlanCardSkeleton />
                <PlanCardSkeleton />
              </>
            ) : (
              plans.map((plan) => {
                const Icon = planIconMap[plan.slug as PlanSlug] || Building2;
                const isCurrent = checkIsCurrentPlan(plan.slug as PlanSlug);
                
                // Texto do CTA para logados
                let ctaText = plan.ctaLabel;
                if (isAuthenticated) {
                  if (plan.slug === 'free') {
                    ctaText = 'Ir para o painel';
                  } else if (plan.slug === 'pro') {
                    const isAlreadyPro = subscription && subscription.plan.slug === 'pro' && 
                                         ['active', 'trialing', 'past_due'].includes(subscription.status);
                    ctaText = isAlreadyPro ? 'Gerenciar Assinatura' : 'Quero o Pro';
                  } else if (plan.slug === 'enterprise') {
                    const isAlreadyEnterpriseLead = subscription && subscription.plan.slug === 'enterprise' && 
                                                   subscription.status === 'enterprise_lead';
                    ctaText = isAlreadyEnterpriseLead ? 'Solicitação Pendente' : 'Solicitar Enterprise';
                  }
                }

                return (
                  <PlanCard
                    key={plan.slug}
                    slug={plan.slug as PlanSlug}
                    name={plan.name}
                    priceLabel={plan.priceLabel}
                    billingNote={plan.billingNote || ''}
                    summary={plan.summary}
                    badge={plan.badge}
                    featured={plan.featured}
                    highlights={plan.highlights}
                    ctaLabel={ctaText}
                    icon={Icon}
                    isCurrentPlan={isCurrent}
                    subscriptionStatus={isCurrent ? subscription?.status : undefined}
                    isLoading={actionLoadingPlanId === plan.id}
                    onCtaClick={() => handlePlanCta(plan)}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <FeatureComparisonTable />

      {/* ── FAQ & ADDITIONAL INFO ─────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="grid gap-6 lg:grid-cols-[1fr_0.8fr]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {/* FAQs */}
            <motion.div variants={fadeUp}>
              <PricingFaq />
            </motion.div>

            {/* Side cards */}
            <motion.div variants={fadeUp} className="space-y-5">
              {/* How it works */}
              <div className="clay-precision rounded-[2rem] border border-slate-800/10 bg-slate-950 p-7 text-white shadow-xl">
                <h3 className="mb-5 text-xl font-black tracking-tight">
                  Como funciona na prática
                </h3>
                <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                  {[
                    { color: 'bg-brand-blue/20 text-brand-blue', text: <><strong className="text-white">Plano</strong> define o entitlement canônico em <code className="rounded bg-white/10 px-1 font-mono text-xs text-brand-blue-light">features_json</code>.</> },
                    { color: 'bg-brand-cyan/10 text-brand-cyan-light', text: <><strong className="text-white">Dashboard</strong> exibe cada feature como <code className="rounded bg-white/10 px-1 font-mono text-xs text-brand-cyan-light">enabled</code>, <code className="rounded bg-white/10 px-1 font-mono text-xs text-brand-cyan-light">locked</code> ou <code className="rounded bg-white/10 px-1 font-mono text-xs text-brand-cyan-light">hidden</code>.</> },
                    { color: 'bg-white/10 text-white/70', text: <><strong className="text-white">Perfil público</strong> renderiza ou suprime CTAs, banners e blocos competitivos conforme o plano.</> },
                    { color: 'bg-white/10 text-white/60', text: <><strong className="text-white">Backend</strong> aplica enforcement real: o blur é UX de upsell, não segurança falsa.</> },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                        <Check className="h-3 w-3" />
                      </span>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales CTA */}
              <div className="clay-precision rounded-[2rem] border border-brand-blue/15 bg-gradient-to-br from-brand-blue/5 via-white to-white p-7 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950">Falar com vendas</h3>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Precisa de proposta personalizada, integração específica ou condições especiais para sua operação?
                </p>
                <Button asChild size="lg" className="clay-btn-primary h-11 w-full rounded-full">
                  <Link href="/contact">
                    Entrar em contato
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── ENTERPRISE LEAD MODAL (Premium Glassmorphic) ───────────────────── */}
      <AnimatePresence>
        {isEnterpriseModalOpen && enterprisePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !modalSubmitting && setIsEnterpriseModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.18)] backdrop-blur-xl clay-convex"
            >
              {/* Botão de Fechar */}
              <button
                onClick={() => setIsEnterpriseModalOpen(false)}
                disabled={modalSubmitting}
                className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">
                  Solicitar plano Enterprise
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Nos diga um pouco sobre sua operação e necessidades para que possamos formatar a proposta ideal para sua empresa.
                </p>
              </div>

              {modalSuccessMessage ? (
                <div className="space-y-6 py-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {modalSuccessMessage}
                  </p>
                  <Button
                    onClick={() => setIsEnterpriseModalOpen(false)}
                    className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Fechar janela
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleEnterpriseLeadSubmit} className="space-y-5">
                  <ErrorBanner error={modalError} onDismiss={() => setModalError(null)} />

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Telefone de Contato *
                    </label>
                    <Input
                      type="text"
                      required
                      disabled={modalSubmitting}
                      placeholder="(11) 99999-9999"
                      value={phoneContact}
                      onChange={(e) => setPhoneContact(e.target.value)}
                      className="rounded-xl h-11 border-slate-200 bg-white/60 focus-visible:ring-brand-blue focus-visible:ring-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      MRR Estimado (Opcional)
                    </label>
                    <Input
                      type="number"
                      disabled={modalSubmitting}
                      placeholder="R$ Faturamento mensal recorrente em solar"
                      value={estimatedMrr}
                      onChange={(e) => setEstimatedMrr(e.target.value)}
                      className="rounded-xl h-11 border-slate-200 bg-white/60 focus-visible:ring-brand-blue focus-visible:ring-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Justificativa / Necessidades *
                    </label>
                    <textarea
                      required
                      disabled={modalSubmitting}
                      rows={4}
                      placeholder="Ex: Integração via webhook com nosso CRM interno, sinais de intenção para equipe de outbound e relatórios personalizados."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      className="flex w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={modalSubmitting}
                      onClick={() => setIsEnterpriseModalOpen(false)}
                      className="w-full h-11 rounded-full border-slate-200 hover:bg-slate-50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={modalSubmitting}
                      className="w-full h-11 rounded-full bg-slate-900 hover:bg-brand-blue-dark text-white border-0 shadow-lg shadow-slate-900/20"
                    >
                      {modalSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Enviando...
                        </span>
                      ) : (
                        'Solicitar Proposta'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
