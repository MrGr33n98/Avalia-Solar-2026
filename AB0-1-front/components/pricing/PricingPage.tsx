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

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Estados locais
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingPlanId, setActionLoadingPlanId] = useState<number | null>(null);
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

        // Mescla com os metadados do catálogo estático para preservar o visual premium
        const displayPlans = (apiPlans.length > 0 ? apiPlans : []).map((apiPlan) => {
          const staticPlan = pricingPlans.find((p) => p.slug === apiPlan.slug);
          return {
            ...apiPlan,
            highlights: apiPlan.highlights?.length > 0 ? apiPlan.highlights : (staticPlan?.highlights || []),
            summary: staticPlan?.summary || apiPlan.summary || '',
            badge: staticPlan?.badge || apiPlan.badge || undefined,
            featured: staticPlan?.featured || apiPlan.featured || false,
            priceLabel: apiPlan.price_formatted || staticPlan?.priceLabel || '',
            ctaLabel: staticPlan?.ctaLabel || 'Assinar',
          };
        });

        // Se a API não retornou nada (nem o fallback interno deu certo), usa o catálogo local estático bruto
        if (displayPlans.length === 0) {
          const rawDisplayPlans = pricingPlans.map((sp, idx) => ({
            id: idx + 1,
            slug: sp.slug,
            name: sp.name,
            price_cents: sp.slug === 'free' ? 0 : 49900,
            price_formatted: sp.priceLabel,
            price_label: sp.priceLabel,
            highlights: sp.highlights,
            summary: sp.summary,
            badge: sp.badge,
            featured: sp.featured,
            priceLabel: sp.priceLabel,
            ctaLabel: sp.ctaLabel,
          }));
          setPlans(rawDisplayPlans);
        } else {
          // Ordena os planos conforme o slug para manter free -> pro -> enterprise
          const order = { free: 0, pro: 1, enterprise: 2 };
          displayPlans.sort((a, b) => order[a.slug] - order[b.slug]);
          setPlans(displayPlans);
        }

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
      alert(err?.message || 'Falha ao processar solicitação. Por favor, tente novamente.');
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
    <main className="relative overflow-hidden min-h-screen pb-12" style={{ background: 'hsl(222 47% 95%)' }}>
      
      {/* Luzes ambientes com efeitos dinâmicos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[640px] w-[640px] rounded-full bg-brand-blue/[0.07] blur-[120px]" />
        <div className="absolute right-0 top-10 h-[520px] w-[520px] rounded-full bg-brand-green/[0.06] blur-[100px]" />
        <div className="absolute left-1/2 top-[55%] h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-brand-purple/[0.05] blur-[120px]" />
      </div>

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
              <span className="text-brand-green">conversão</span>
              {' '}e operação comercial madura.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
            >
              O gratuito garante{' '}
              <strong className="text-slate-800">presença mínima</strong> no marketplace.
              O Pro transforma seu perfil em{' '}
              <strong className="text-brand-green">vitrine comercial ativa</strong>.
              O Enterprise adiciona{' '}
              <strong className="text-brand-purple">inteligência de mercado e governança</strong>.
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
          {error && (
            <div className="mb-10 max-w-2xl mx-auto p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center text-sm">
              {error}
            </div>
          )}

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
                    { color: 'bg-brand-green/20 text-brand-green', text: <><strong className="text-white">Dashboard</strong> exibe cada feature como <code className="rounded bg-white/10 px-1 font-mono text-xs text-brand-green-light">enabled</code>, <code className="rounded bg-white/10 px-1 font-mono text-xs text-brand-green-light">locked</code> ou <code className="rounded bg-white/10 px-1 font-mono text-xs text-brand-green-light">hidden</code>.</> },
                    { color: 'bg-brand-purple/20 text-brand-purple', text: <><strong className="text-white">Perfil público</strong> renderiza ou suprime CTAs, banners e blocos competitivos conforme o plano.</> },
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple text-white shadow-lg mb-4">
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
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
                  {modalError && (
                    <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700">
                      {modalError}
                    </div>
                  )}

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
                      className="rounded-xl h-11 border-slate-200 bg-white/60 focus-visible:ring-brand-purple focus-visible:ring-1"
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
                      className="rounded-xl h-11 border-slate-200 bg-white/60 focus-visible:ring-brand-purple focus-visible:ring-1"
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
                      className="flex w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-purple focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="w-full h-11 rounded-full bg-brand-purple hover:bg-brand-purple/90 text-white border-0 shadow-lg shadow-brand-purple/20"
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
