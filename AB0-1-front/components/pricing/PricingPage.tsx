'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Check,
  MessageSquare,
  ShieldCheck,
  Zap,
  X,
  Compass,
  LineChart,
  Megaphone,
  UserCheck,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { billingApi, type BillingPlan, type BillingSubscription } from '@/lib/api/billing';
import { pricingPlans, type PlanSlug } from '@/lib/pricing/catalog';

// Importa os subcomponentes modulares e slots resilientes
import { PlanCard, PlanCardSkeleton } from './PlanCard';
import { FeatureComparisonTable } from './FeatureComparisonTable';
import { PricingFaq } from './PricingFaq';
import { ErrorBanner } from '@/components/billing/ErrorBanner';
import { trackCheckoutStarted } from '@/lib/analytics/consolidated';
import { BannerSlot } from '@/components/banners/BannerSlot';
import { DefaultPricingAdBanner } from '@/components/banners/DefaultPricingAdBanner';

// ─── Variantes de Animação ──────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const modalVariant = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 } 
  },
  exit: { 
    opacity: 0, scale: 0.96, y: 16,
    transition: { duration: 0.18, ease: 'easeIn' } 
  }
};

const planIconMap = {
  free: Building2,
  essential: Compass,
  pro: Zap,
  enterprise: ShieldCheck,
};

const planOrder: Record<PlanSlug, number> = { free: 0, essential: 1, pro: 2, enterprise: 3 };

function normalizePlanSlug(plan: Partial<BillingPlan> & { plan_tier?: string }, fallbackIndex = 0): PlanSlug {
  const explicitSlug = plan.slug || plan.plan_tier;
  if (explicitSlug === 'free' || explicitSlug === 'essential' || explicitSlug === 'pro' || explicitSlug === 'enterprise') {
    return explicitSlug as PlanSlug;
  }

  const normalizedName = plan.name?.toLowerCase() || '';
  if (normalizedName.includes('enterprise')) return 'enterprise';
  if (normalizedName.includes('essential') || normalizedName.includes('essencial')) return 'essential';
  if (normalizedName.includes('pro')) return 'pro';
  if (/starter|premium|pago/.test(normalizedName)) return 'pro'; // fallback
  if (/free|gratuito|basic/.test(normalizedName)) return 'free';

  return pricingPlans[fallbackIndex]?.slug || 'free';
}

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated, refreshAuth } = useAuth();

  // Estados locais
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingPlanId, setActionLoadingPlanId] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastFailedPlan, setLastFailedPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [heroMockupError, setHeroMockupError] = useState(false);

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
            acc[slug] = { ...apiPlan, slug };
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
              price_cents: apiPlan?.price_cents ?? (staticPlan.slug === 'pro' ? 15000 : staticPlan.slug === 'essential' ? 5900 : 0),
              price_formatted: staticPlan.slug === 'essential' ? 'R$ 59' : staticPlan.slug === 'pro' ? 'R$ 150' : (apiPlan?.price_formatted || staticPlan.priceLabel),
              price_label: staticPlan.slug === 'essential' ? 'R$ 59' : staticPlan.slug === 'pro' ? 'R$ 150' : (apiPlan?.price_label || apiPlan?.price_formatted || staticPlan.priceLabel),
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
              priceLabel: staticPlan.slug === 'essential' ? 'R$ 59' : staticPlan.slug === 'pro' ? 'R$ 150' : (apiPlan?.price_formatted || staticPlan.priceLabel),
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
      router.push(`/register?plan=${plan.slug}`);
      return;
    }

    if (!user?.company_id) {
      router.push('/select-company?reason=billing_required');
      return;
    }

    setActionLoadingPlanId(plan.id);
    setCheckoutError(null);
    setLastFailedPlan(plan);

    try {
      const hasFreshSession = await refreshAuth();
      if (!hasFreshSession) {
        setCheckoutError('Sua sessão expirou. Entre novamente para continuar.');
        router.push('/login?reason=session_expired&redirect=/pricing');
        return;
      }

      if (plan.slug === 'free') {
        router.push('/dashboard');
        return;
      }

      if (plan.slug === 'essential') {
        // Se o essencial tiver stripe_price_id_monthly (produção), inicia checkout Stripe
        if (plan.stripe_price_id_monthly) {
          const successUrl = `${window.location.origin}/dashboard?company_id=${user.company_id}&checkout=success`;
          const cancelUrl = window.location.href;
          const { checkout_url } = await billingApi.createCheckoutSession(
            user.company_id,
            plan.id,
            successUrl,
            cancelUrl
          );
          
          trackCheckoutStarted(plan.id, undefined, user.company_id);
          window.location.href = checkout_url;
        } else {
          // Se for nulo/sandbox, desvia de forma totalmente segura para o painel com aviso
          console.info('[PricingPage] Checkout do plano Essencial encaminhado para o dashboard local.');
          router.push('/dashboard?reason=essential_plan_activated_locally');
        }
        return;
      }

      if (plan.slug === 'pro') {
        const isAlreadyPro = subscription && subscription.plan.slug === 'pro' && 
                             ['active', 'trialing', 'past_due'].includes(subscription.status);

        if (isAlreadyPro) {
          const { portal_url } = await billingApi.createPortalSession(user.company_id, window.location.href);
          window.location.href = portal_url;
        } else {
          const successUrl = `${window.location.origin}/dashboard?company_id=${user.company_id}&checkout=success`;
          const cancelUrl = window.location.href;
          const { checkout_url } = await billingApi.createCheckoutSession(
            user.company_id,
            plan.id,
            successUrl,
            cancelUrl
          );
          
          trackCheckoutStarted(plan.id, undefined, user.company_id);
          window.location.href = checkout_url;
        }
        return;
      }

      if (plan.slug === 'enterprise') {
        setEnterprisePlan(plan);
        setJustification('');
        setPhoneContact('');
        setEstimatedMrr('');
        setModalSuccessMessage(null);
        setModalError(null);
        setIsEnterpriseModalOpen(true);
      }
    } catch (err: any) {
      console.error('[PricingPage] Erro ao processar faturamento:', err);
      setCheckoutError(err?.message || 'Falha ao processar solicitação. Por favor, tente novamente.');
    } finally {
      setActionLoadingPlanId(null);
    }
  };

  // Envio do Lead Enterprise
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

  // Verifica se é o plano atual ativo
  const checkIsCurrentPlan = (planSlug: PlanSlug) => {
    if (!isAuthenticated || !subscription) {
      return planSlug === 'free' && !subscription;
    }
    return subscription.plan.slug === planSlug && ['active', 'trialing', 'past_due', 'enterprise_lead'].includes(subscription.status);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F8FC] pb-12">
      
      {/* ── 1. HERO SECTION (2 colunas com suporte a Mockup e Fundo Solar) ────────────────── */}
      <section className="relative pb-16 pt-20 border-b border-slate-200/50 bg-gradient-to-b from-[#EBF2FC] to-[#F5F8FC] overflow-hidden">
        {/* Imagem de Fundo Solar discreta na lateral direita */}
        <div 
          className="absolute inset-y-0 right-0 w-full lg:w-1/2 opacity-20 pointer-events-none bg-cover bg-right bg-no-repeat hidden md:block"
          style={{ backgroundImage: 'url(/images/pricing/pricing-hero-solar-bg.webp)' }}
        />
        {/* Overlay suave para integrar o fundo e garantir legibilidade perfeita */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#EBF2FC] via-[#EBF2FC]/80 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Esquerda: Texto de captação */}
            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <Badge
                  variant="outline"
                  className="bg-brand-blue/10 text-brand-blue border-brand-blue/20 mb-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  Planos para Empresas
                </Badge>
              </motion.div>

      <motion.h1
                variants={fadeUp}
                className="text-balance text-4xl font-black tracking-tight text-slate-950 md:text-5xl lg:text-[3.25rem] leading-[1.1]"
              >
                Escolha o plano ideal para sua empresa se destacar no{' '}
                <span className="text-brand-blue bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent">mercado solar</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 font-medium max-w-xl"
              >
                Do perfil gratuito à vitrine comercial premium com mais conversão, menos concorrência e inteligência de mercado.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
              >
                <Button asChild size="lg" className="bg-brand-blue hover:bg-brand-blue-light text-white border-0 shadow-lg shadow-brand-blue/20 h-12 rounded-full px-8 w-full sm:w-auto font-bold text-sm">
                  <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                    {isAuthenticated ? 'Acessar painel' : 'Começar gratuitamente'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-50 h-12 rounded-full px-8 w-full sm:w-auto font-bold text-sm bg-white"
                >
                  <Link href="/contact">Falar com vendas</Link>
                </Button>
              </motion.div>

              {/* Microbadges */}
              <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                {[
                  { icon: ShieldCheck, label: 'Sem fidelidade' },
                  { icon: Zap, label: 'Ative em minutos' },
                  { icon: Check, label: 'Pagamento seguro' },
                  { icon: MessageSquare, label: 'Cancele quando quiser' },
                ].map((mb) => (
                  <span key={mb.label} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <mb.icon className="h-3.5 w-3.5 text-emerald-500" />
                    {mb.label}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Direita: Mockup Real ou Simulado */}
            <motion.div
              className="relative w-full min-h-[320px] sm:min-h-[400px] flex items-center justify-center lg:justify-end"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.68, ease: 'easeOut' }}
            >
              {!heroMockupError ? (
                <div className="relative w-full max-w-[500px] aspect-[4/3] flex items-center justify-center">
                  <Image
                    src="/images/pricing/pricing-hero-mockup.webp"
                    alt="Mockup do Perfil Comercial"
                    width={1200}
                    height={800}
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full h-auto object-contain drop-shadow-[0_24px_48px_rgba(0,86,210,0.18)]"
                    onError={() => setHeroMockupError(true)}
                  />

                  {/* Micro-cards flutuantes da direita do Hero sobrepostos à imagem */}
                  <motion.div 
                    className="absolute top-4 left-0 sm:left-4 bg-white/90 backdrop-blur border border-slate-200/50 shadow-lg p-2.5 rounded-2xl flex items-center gap-2 z-30"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}
                  >
                    <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-900 leading-none">+ Empresas</div>
                      <div className="text-[8px] font-bold text-slate-400">confiáveis</div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="absolute bottom-12 right-0 sm:right-4 bg-white/90 backdrop-blur border border-slate-200/50 shadow-lg p-2.5 rounded-2xl flex items-center gap-2 z-30"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut' }}
                  >
                    <div className="h-7 w-7 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                      <LineChart className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-900 leading-none">+ Oportunidades</div>
                      <div className="text-[8px] font-bold text-slate-400">de negócio</div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                /* Notebook simulado em CSS como Fallback */
                <div className="relative w-full h-[320px] sm:h-[400px] flex items-center justify-center lg:justify-end">
                  <div className="relative w-[340px] sm:w-[460px] h-[220px] sm:h-[280px] rounded-2xl border border-white bg-slate-900 shadow-2xl p-2 flex flex-col group overflow-hidden">
                    {/* Tela do Notebook */}
                    <div className="flex-1 rounded-lg bg-[#F5F8FC] overflow-hidden flex flex-col p-3 relative">
                      {/* Navegação simulada */}
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        <span className="h-2 w-2 rounded-full bg-yellow-400" />
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        <span className="h-3 w-40 sm:w-60 bg-white border border-slate-200 rounded text-[7px] text-slate-400 pl-1.5 flex items-center">
                          avaliasolar.com.br/solare-energia
                        </span>
                      </div>
                      {/* Conteúdo simulado */}
                      <div className="mt-3 flex items-start gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-slate-350 shrink-0 shadow animate-pulse" />
                        <div className="space-y-1.5 w-full">
                          <div className="text-[11px] sm:text-xs font-black text-slate-900 flex items-center gap-1.5">
                            Solare Energia Solar
                            <span className="h-3 w-3 rounded-full bg-brand-blue flex items-center justify-center text-white text-[7px] font-bold">✓</span>
                          </div>
                          <div className="text-[8px] sm:text-[9px] text-slate-500 font-medium">96% dos usuários recomendam</div>
                          <div className="h-8 sm:h-12 bg-white rounded-lg border border-slate-200 p-2 text-[7px] sm:text-[8px] text-slate-400 leading-relaxed overflow-hidden">
                            Projetos residenciais e comerciais de alta eficiência com suporte e homologação inclusos...
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Base do Notebook */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[380px] sm:w-[500px] h-[8px] bg-slate-800 rounded-b-xl border-t border-slate-700 shadow-md" />
                  </div>

                  {/* Smartphone flutuante sobreposto em CSS */}
                  <div className="absolute -bottom-4 right-4 sm:right-16 w-[110px] sm:w-[130px] h-[200px] sm:h-[240px] rounded-[24px] border-[5px] border-slate-900 bg-white shadow-2xl p-1.5 flex flex-col overflow-hidden z-20">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-3 bg-slate-900 rounded-full flex items-center justify-center" />
                    
                    {/* Tela do Celular */}
                    <div className="flex-1 rounded-[16px] bg-[#F5F8FC] overflow-hidden flex flex-col p-2 pt-4 relative">
                      <div className="h-6 w-6 rounded-lg bg-slate-350 shrink-0 mb-1.5 animate-pulse" />
                      <div className="text-[8px] font-black text-slate-900 leading-none">Solare Energia</div>
                      <div className="text-[5px] text-slate-500 font-bold mb-1">96% aprovação</div>
                      <div className="h-14 bg-white rounded-md border border-slate-200 p-1 text-[5px] text-slate-400 overflow-hidden leading-snug">
                        Ideal para começar a garantir presença no maior portal...
                      </div>
                      <div className="mt-auto h-4 w-full rounded bg-brand-blue flex items-center justify-center text-[5px] font-bold text-white shadow-sm">
                        Falar no WhatsApp
                      </div>
                    </div>
                  </div>

                  {/* Micro-cards flutuantes da direita do Hero */}
                  <motion.div 
                    className="absolute top-6 left-2 sm:left-12 bg-white/90 backdrop-blur border border-slate-200/50 shadow-lg p-2.5 rounded-2xl flex items-center gap-2 z-30"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}
                  >
                    <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-900 leading-none">+ Empresas</div>
                      <div className="text-[8px] font-bold text-slate-400">confiáveis</div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="absolute top-28 right-0 sm:right-6 bg-white/90 backdrop-blur border border-slate-200/50 shadow-lg p-2.5 rounded-2xl flex items-center gap-2 z-30"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut' }}
                  >
                    <div className="h-7 w-7 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                      <LineChart className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-900 leading-none">+ Oportunidades</div>
                      <div className="text-[8px] font-bold text-slate-400">de negócio</div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 2. HERO BENEFIT STRIP (Benefícios rápidos abaixo do Hero) ─────────── */}
      <section className="relative py-8 bg-white border-b border-slate-200/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {[
              { label: 'Mais visibilidade', desc: 'Destaque estratégico no portal', icon: Sparkles, color: 'text-brand-blue bg-brand-blue/10' },
              { label: 'Mais conversão', desc: 'CTAs focados no WhatsApp', icon: Zap, color: 'text-emerald-500 bg-emerald-500/10' },
              { label: 'Menos concorrência', desc: 'Perfil limpo sem alternativas', icon: ShieldCheck, color: 'text-teal-600 bg-teal-600/10' },
              { label: 'Inteligência de mercado', desc: 'Dados e relatórios de leads', icon: LineChart, color: 'text-indigo-600 bg-indigo-600/10' },
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center gap-3 p-2 group">
                <div className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${benefit.color}`}>
                  <benefit.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-950">{benefit.label}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PRICING PLANS GRID (Grade de 4 Planos com badges) ────────────────── */}
      <section className="relative py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          
          <div className="mb-10 max-w-2xl mx-auto space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center text-sm font-semibold shadow-sm">
                {error}
              </div>
            )}

            <ErrorBanner 
              error={checkoutError}
              onRetry={() => lastFailedPlan && handlePlanCta(lastFailedPlan)}
              onDismiss={() => setCheckoutError(null)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {loading ? (
              <>
                <PlanCardSkeleton />
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
                  } else if (plan.slug === 'essential') {
                    ctaText = isCurrent ? 'Plano Atual' : 'Começar no Essencial';
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

                // Preço anual e economia do mockup
                let yearlyPrice;
                let savingText;
                if (plan.slug === 'essential') {
                  yearlyPrice = 'ou R$ 629 à vista no plano anual';
                  savingText = 'ECONOMIZE R$ 79';
                } else if (plan.slug === 'pro') {
                  yearlyPrice = 'ou R$ 1.600 à vista no plano anual';
                  savingText = 'ECONOMIZE R$ 200';
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
                    yearlyPriceLabel={yearlyPrice}
                    savingBadge={savingText}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ── 3b. FAIXA DE BENEFÍCIOS COMERCIAIS ──────────────────────────────────── */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: 'Pagamento seguro', desc: 'Ambiente 100% protegido' },
              { icon: Zap, title: 'Ativação imediata', desc: 'Seu plano ativo em minutos' },
              { icon: ArrowRight, title: 'Sem fidelidade', desc: 'Cancele quando quiser' },
              { icon: MessageSquare, title: 'Suporte humano', desc: 'Atendimento especializado' },
            ].map((b) => (
              <div key={b.title} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/8 text-brand-blue">
                  <b.icon className="h-4.5 w-4.5" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-sm font-black text-slate-900">{b.title}</div>
                  <div className="text-xs text-slate-500 font-medium">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. COMPARISON TABLE ──────────────────────────────────────────────── */}
      <FeatureComparisonTable />

      {/* ── 5. SEÇÃO "ANUNCIE NA AVALIA SOLAR" (3 colunas com BannerSlot) ────────── */}
      <section className="py-16 md:py-20 bg-white border-b border-slate-200/50">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Cabeçalho Unificado Comercial Premium */}
          <div className="mb-12 text-center max-w-2xl mx-auto space-y-3">
            <Badge
              variant="outline"
              className="bg-brand-blue/10 text-brand-blue border-brand-blue/20 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Mídia e Parcerias
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Anuncie no maior portal solar do Brasil
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Posicione sua marca onde os compradores decidem seus parceiros e integradores de energia solar.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_0.9fr] items-stretch">
            
            {/* Coluna 1: Card pitch */}
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-800/10 bg-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
              {/* Glow background */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue-light bg-brand-blue/20 px-3 py-1 rounded-full border border-brand-blue/10 inline-block">
                  Mídia & Patrocínio
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Anuncie na <span className="text-brand-blue-light">Avalia Solar</span>
                </h3>
                <p className="text-sm leading-relaxed text-slate-350 font-medium">
                  Coloque sua marca diante de centenas de decisores e consumidores que já estão pesquisando ativamente empresas, produtos e soluções de energia solar no Brasil.
                </p>

                <ul className="space-y-3 pt-3 flex-1">
                  {[
                    'Mais visibilidade e alcance para sua marca',
                    'Gere confiança instantânea com quem decide',
                    'Mais oportunidades de negócio qualificadas B2B',
                  ].map((advantage, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-medium">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{advantage}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <Button asChild size="lg" className="bg-[#B7F000] hover:bg-[#A3D600] text-slate-950 font-bold border-0 shadow-lg shadow-[#B7F000]/10 h-11 w-full rounded-full text-xs">
                  <Link href="/contact?subject=advertise">
                    Quero anunciar
                    <ArrowRight className="ml-2 h-3.5 w-3.5 text-slate-950" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Coluna 2: Slot dinâmico de anúncio */}
            <div className="flex flex-col justify-center items-stretch h-full">
              <BannerSlot
                placement="pricing_advertise_section"
                fallback={<DefaultPricingAdBanner />}
                limit={1}
                priority={true}
              />
            </div>

            {/* Coluna 3: Card "Ainda com dúvidas?" */}
            <div className="rounded-[2rem] border border-brand-blue/15 bg-gradient-to-br from-brand-blue/5 via-white to-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-tight">Ainda com dúvidas?</h3>
                </div>
                
                <p className="text-sm leading-relaxed text-slate-600 font-medium">
                  Precisa de proposta personalizada, integrações robustas via webhook com seu CRM ou faturamento customizado? Converse agora com nosso time comercial.
                </p>

                {/* Avatares do time de vendas do mockup */}
                <div className="flex items-center gap-3 pt-3">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {[
                      { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100', alt: 'Ana' },
                      { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', alt: 'Carlos' },
                      { src: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=100', alt: 'Thiago' },
                    ].map((avatar, index) => (
                      <div key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatar.src} alt={avatar.alt} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-bold">
                    Atendimento consultivo e personalizado
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button asChild size="lg" className="bg-slate-950 hover:bg-slate-900 text-white font-bold border-0 shadow-lg h-11 w-full rounded-full text-xs">
                  <Link href="/contact?subject=commercial">
                    Falar com vendas
                    <ArrowRight className="ml-2 h-3.5 w-3.5 text-white" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. FAQ & AJUDA ────────────────────────────────────────────────────── */}
      <PricingFaq />


      {/* ── ENTERPRISE LEAD MODAL (Premium Glassmorphic) ───────────────────── */}
      <AnimatePresence>
        {isEnterpriseModalOpen && enterprisePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !modalSubmitting && setIsEnterpriseModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            <motion.div
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.18)] backdrop-blur-xl clay-convex"
            >
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
                    className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
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
                      className="rounded-xl h-11 border-slate-200 bg-white/60 focus-visible:ring-brand-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      MRR Estimado (Opcional)
                    </label>
                    <Input
                      type="number"
                      disabled={modalSubmitting}
                      placeholder="Faturamento mensal em solar"
                      value={estimatedMrr}
                      onChange={(e) => setEstimatedMrr(e.target.value)}
                      className="rounded-xl h-11 border-slate-200 bg-white/60 focus-visible:ring-brand-blue"
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
                      className="flex w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={modalSubmitting}
                      onClick={() => setIsEnterpriseModalOpen(false)}
                      className="w-full h-11 rounded-full border-slate-200 hover:bg-slate-50 font-bold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={modalSubmitting}
                      className="w-full h-11 rounded-full bg-slate-900 hover:bg-brand-blue-dark text-white border-0 shadow-lg shadow-slate-900/20 font-bold"
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
