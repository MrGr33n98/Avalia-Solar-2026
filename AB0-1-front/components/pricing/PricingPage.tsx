'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
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
  Compass,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const modalVariant: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 } 
  },
  exit: { 
    opacity: 0, scale: 0.96, y: 16,
    transition: { duration: 0.18, ease: 'easeIn' as const } 
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

interface CombinedPlan extends BillingPlan {
  ctaLabel?: string;
  billingNote?: string;
}

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated, refreshAuth } = useAuth();

  // Estados locais
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<CombinedPlan[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingPlanId, setActionLoadingPlanId] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [lastFailedPlan, setLastFailedPlan] = useState<CombinedPlan | null>(null);
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

  // Estados para Calculadora de ROI
  const [roiTicket, setRoiTicket] = useState(15000);
  const [roiLeads, setRoiLeads] = useState(5);
  const [roiConv, setRoiConv] = useState(20);

  const roiClients = (roiLeads * roiConv) / 100;
  const roiRevenue = roiClients * roiTicket;
  const roiValue = roiRevenue > 0 ? ((roiRevenue / 150) - 1) * 100 : 0;

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
      } catch (err) {
        console.error('[PricingPage] Erro ao carregar dados de faturamento:', err);
        setError('Ocorreu um erro ao carregar os planos de faturamento. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }

    loadPricingData();
  }, [isAuthenticated, user?.company_id]);

  // Handler para os cliques em CTA de planos
  const handlePlanCta = async (plan: BillingPlan) => {
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
    } catch (err) {
      const error = err as Error & { message?: string };
      console.error('[PricingPage] Erro ao processar faturamento:', error);
      setCheckoutError(error?.message || 'Falha ao processar solicitação. Por favor, tente novamente.');
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
      const payload: { justification: string; phone_contact: string; estimated_mrr?: number } = {
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
    } catch (err) {
      const error = err as Error & { message?: string };
      console.error('[PricingPage] Erro ao enviar lead enterprise:', error);
      setModalError(error?.message || 'Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.');
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
    <main className="relative min-h-screen overflow-hidden bg-[#F5F8FC] pb-12 font-sans antialiased text-slate-800">
      
      {/* ── 1. HERO SECTION ────────────────── */}
      <section className="relative pb-16 pt-20 border-b border-slate-200/50 bg-[#eef4fa] overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-[1160px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Left Column: Copy & Actions */}
            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Link href="/" className="hover:text-slate-900">Home</Link> › <span className="text-slate-800">Planos e preços</span>
                </p>
                <span className="block text-xs font-bold uppercase tracking-[.1em] text-amber-600">
                  Plataforma de aquisição de clientes para energia solar
                </span>
              </div>

              <h1 className="text-balance text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-[2.75rem] leading-[1.15]">
                Mais orçamentos, mais vendas, menos CAC
              </h1>

              <p className="mt-4 text-base sm:text-[17.5px] leading-relaxed text-slate-500 font-medium">
                Todos os dias, consumidores comparam empresas na Avalia Solar antes de fechar negócio. Um plano pago coloca a sua empresa na frente deles — e transforma visitas em contatos no seu WhatsApp.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-0 shadow-md h-12 rounded-lg px-8 w-full sm:w-auto text-sm transition-transform duration-150 active:scale-[0.98]">
                  <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                    Criar meu perfil grátis
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-50 h-12 rounded-lg px-8 w-full sm:w-auto font-bold text-sm bg-white text-slate-800 shadow-sm"
                >
                  <Link href="/contact?subject=commercial" className="flex items-center gap-1.5">
                    Falar com vendas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Microbadges */}
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold">✓</span> Sem fidelidade</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold">✓</span> Ativação em minutos</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold">✓</span> Cancele quando quiser</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold">✓</span> Suporte humano</span>
              </div>
            </motion.div>

            {/* Right Column: Visual Mockup */}
            <div className="relative w-full min-h-[320px] sm:min-h-[400px] flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px] aspect-[4/3] flex items-center justify-center">
                {/* Notebook CSS Mockup */}
                <div className="relative w-[min(320px,100%)] sm:w-[420px] h-[200px] sm:h-[260px] rounded-2xl border border-slate-350 bg-slate-900 shadow-2xl p-2 flex flex-col group overflow-hidden">
                  <div className="flex-1 rounded-lg bg-[#F5F8FC] overflow-hidden flex flex-col p-3 relative">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      <span className="h-2 w-2 rounded-full bg-yellow-400" />
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="h-3 w-40 sm:w-60 bg-white border border-slate-200 rounded text-[7px] text-slate-400 pl-1.5 flex items-center">
                        avaliasolar.com.br/solare-energia
                      </span>
                    </div>
                    <div className="mt-3 flex items-start gap-3">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-slate-300 shrink-0 shadow animate-pulse" />
                      <div className="space-y-1.5 w-full">
                        <div className="text-[11px] sm:text-xs font-black text-slate-900 flex items-center gap-1.5">
                          Solare Energia Solar
                          <span className="h-3 w-3 rounded-full bg-[#1668e8] flex items-center justify-center text-white text-[7px] font-bold">✓</span>
                        </div>
                        <div className="text-[8px] sm:text-[9px] text-slate-500 font-medium">96% dos usuários recomendam</div>
                        <div className="h-8 sm:h-12 bg-white rounded-lg border border-slate-200 p-2 text-[7px] sm:text-[8px] text-slate-400 leading-relaxed overflow-hidden">
                          Projetos residenciais e comerciais de alta eficiência com suporte e homologação inclusos...
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[min(360px,100%)] sm:w-[460px] h-[8px] bg-slate-800 rounded-b-xl border-t border-slate-700 shadow-md" />
                </div>

                {/* Smartphone CSS Mockup */}
                <div className="absolute -bottom-4 right-4 sm:right-10 w-[100px] sm:w-[120px] h-[180px] sm:h-[220px] rounded-[24px] border-[4px] border-slate-900 bg-white shadow-2xl p-1.5 flex flex-col overflow-hidden z-20">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-900 rounded-full flex items-center justify-center" />
                  <div className="flex-1 rounded-[16px] bg-[#F5F8FC] overflow-hidden flex flex-col p-2 pt-4 relative">
                    <div className="h-6 w-6 rounded-lg bg-slate-350 shrink-0 mb-1.5 animate-pulse" />
                    <div className="text-[8px] font-black text-slate-900 leading-none">Solare Energia</div>
                    <div className="text-[5px] text-slate-500 font-bold mb-1">96% aprovação</div>
                    <div className="h-12 bg-white rounded-md border border-slate-200 p-1 text-[5px] text-slate-400 overflow-hidden leading-snug">
                      Ideal para começar a garantir presença no maior portal...
                    </div>
                    <div className="mt-auto h-4 w-full rounded bg-[#1668e8] flex items-center justify-center text-[5px] font-bold text-white shadow-sm">
                      Falar no WhatsApp
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. PROOF STRIP ────────────────── */}
      <section className="bg-white border-b border-slate-200/60 py-8">
        <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <strong className="block text-[15.5px] font-extrabold text-slate-900">Empresas verificadas</strong>
            <span className="text-[13px] text-slate-500 font-medium">em todo o Brasil</span>
          </div>
          <div className="space-y-1">
            <strong className="block text-[15.5px] font-extrabold text-slate-900">Avaliações reais</strong>
            <span className="text-[13px] text-slate-500 font-medium">de clientes de energia solar</span>
          </div>
          <div className="space-y-1">
            <strong className="block text-[15.5px] font-extrabold text-slate-900">Cobertura nacional</strong>
            <span className="text-[13px] text-slate-500 font-medium">presente nas principais capitais</span>
          </div>
          <div className="space-y-1">
            <strong className="block text-[15.5px] font-extrabold text-slate-900">Metodologia transparente</strong>
            <span className="text-[13px] text-slate-500 font-medium">critérios de avaliação públicos</span>
          </div>
        </div>
      </section>

      {/* ── 3. FUNIL DO LEAD ────────────────── */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">Como você ganha clientes</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Da busca ao orçamento fechado</h2>
            <p className="text-[17px] text-slate-500 font-medium">Seu perfil na Avalia Solar não é um cartão de visitas. É um funil completo de conversão.</p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 max-w-[980px] mx-auto">
            {[
              { num: 1, title: 'Consumidor pesquisa', desc: 'empresas de energia solar na sua cidade' },
              { num: 2, title: 'Encontra seu perfil', desc: 'com destaque e sem concorrentes' },
              { num: 3, title: 'Ganha confiança', desc: 'avaliações reais, fotos, FAQ e materiais' },
              { num: 4, title: 'Clica no WhatsApp', desc: 'e fala direto com a sua equipe' },
              { num: 5, title: 'Vira orçamento', desc: 'e você acompanha tudo no relatório' }
            ].map((step, idx, arr) => (
              <div key={step.num} className="flex flex-col md:flex-row items-center flex-1">
                <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl p-5 text-center flex flex-col items-center justify-start min-h-[170px] shadow-sm hover:shadow transition-shadow w-full">
                  <div className="w-8 h-8 rounded-full bg-slate-950 text-white text-sm font-bold flex items-center justify-center mb-3">
                    {step.num}
                  </div>
                  <strong className="block text-[14.5px] font-black text-slate-900 mb-1">{step.title}</strong>
                  <span className="text-[12.5px] text-slate-500 font-medium leading-relaxed">{step.desc}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="hidden md:block text-slate-300 font-bold text-lg select-none px-2.5">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-[15px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Planos pagos removem as distrações desse caminho: <strong className="text-slate-950 font-bold">sem anúncios de concorrentes no seu perfil</strong>, a atenção fica 100% na sua empresa.
          </p>
        </div>
      </section>

      {/* ── 4. ROI CALCULATOR ────────────────── */}
      <section className="py-20 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">Faça as contas</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Quanto vale um cliente a mais por mês?</h2>
            <p className="text-[17px] text-slate-500 font-medium">Arraste os valores da sua realidade e veja o que poucos contatos extras já representam.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-[980px] mx-auto items-stretch">
            {/* Form Sliders */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 shadow-sm flex flex-col justify-center">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Ticket médio de uma instalação:</span>
                  <span className="text-amber-600 text-base font-extrabold">R$ {roiTicket.toLocaleString('pt-BR')}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="80000"
                  step="1000"
                  value={roiTicket}
                  onChange={(e) => setRoiTicket(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Contatos extras por mês com o plano:</span>
                  <span className="text-amber-600 text-base font-extrabold">{roiLeads}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={roiLeads}
                  onChange={(e) => setRoiLeads(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Sua taxa de fechamento:</span>
                  <span className="text-amber-600 text-base font-extrabold">{roiConv}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={roiConv}
                  onChange={(e) => setRoiConv(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Result Display */}
            <div className="bg-slate-950 text-white rounded-2xl p-8 flex flex-col justify-between shadow-lg">
              <div>
                <h3 className="text-white text-[17px] font-bold mb-6">Resultado estimado</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline py-2.5 border-b border-white/10 text-[14.5px]">
                    <span className="text-slate-400">Novos clientes por mês</span>
                    <strong className="text-slate-100 font-bold text-base">
                      {roiClients % 1 === 0 ? roiClients : roiClients.toFixed(1).replace('.', ',')}
                    </strong>
                  </div>
                  <div className="flex justify-between items-baseline py-2.5 border-b border-white/10 text-[14.5px]">
                    <span className="text-slate-400">Receita adicional por mês</span>
                    <strong className="text-slate-100 font-bold text-base">
                      R$ {roiRevenue.toLocaleString('pt-BR')}
                    </strong>
                  </div>
                  <div className="flex justify-between items-baseline py-2.5 border-b border-white/10 text-[14.5px]">
                    <span className="text-slate-400">Investimento (Plano Pro)</span>
                    <strong className="text-slate-100 font-bold text-base">R$ 150/mês</strong>
                  </div>
                  <div className="flex justify-between items-baseline pt-4 text-[14.5px]">
                    <span className="text-slate-400">Retorno sobre o investimento</span>
                    <strong className="text-emerald-400 font-bold text-2xl">
                      {roiValue > 0 ? `${Math.round(roiValue).toLocaleString('pt-BR')}%` : '0%'}
                    </strong>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-6">
                Simulação ilustrativa: o resultado real depende da sua região, do seu perfil e da sua taxa de fechamento. Mesmo fechando apenas 1 instalação a mais a cada poucos meses, o plano já se paga.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. BENEFITS ────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">O que você compra de verdade</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Não é um perfil premium. É crescimento comercial.</h2>
            <p className="text-[17px] text-slate-500 font-medium">Empresas de energia solar não compram banner e FAQ — compram mais vendas, mais autoridade e menos CAC.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Mais contatos qualificados', desc: 'Botão de WhatsApp e CTAs no seu perfil, conectando você a quem já está pronto para pedir orçamento.' },
              { title: 'Mais autoridade', desc: 'Perfil verificado, avaliações reais e destaque nas buscas — sua empresa parece (e é) a escolha segura.' },
              { title: 'Menos CAC', desc: 'Sem comissão por lead e sem depender só de anúncios pagos. Um cliente fechado já paga o plano por anos.' },
              { title: 'Mais inteligência', desc: 'Relatórios de visitas e contatos para você saber exatamente quanto o portal gera para o seu negócio.' }
            ].map((b, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-start">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base mb-4 shrink-0">
                  ✓
                </div>
                <h3 className="text-[16.5px] font-black text-slate-950 mb-2 leading-tight">{b.title}</h3>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PRICING PLANS GRID ────────────────── */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-200/50" id="planos">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">Planos e preços</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Escolha o plano ideal para o momento da sua empresa</h2>
            <p className="text-[17px] text-slate-500 font-medium">Comece grátis e evolua quando quiser. Todos os planos pagos removem concorrentes do seu perfil.</p>
          </div>

          {/* Monthly/Yearly Cycle Toggle Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
            <div className="inline-flex items-center rounded-full bg-slate-950 p-1 border border-slate-950 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  "rounded-full px-6 py-1.5 text-xs font-bold transition-all duration-200",
                  billingCycle === 'monthly'
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-white bg-transparent"
                )}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "rounded-full px-6 py-1.5 text-xs font-bold transition-all duration-200",
                  billingCycle === 'yearly'
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-white bg-transparent"
                )}
              >
                Anual
              </button>
            </div>
            <span className="text-[12.5px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-250">
              Anual: 2 meses grátis (17% off)
            </span>
          </div>

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
                
                // Texto do CTA
                let ctaText = plan.ctaLabel || 'Assinar';
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

                // Preços com base na seleção do ciclo
                let priceLabel = plan.price_label;
                let yearlyPrice = undefined;
                let savingText = undefined;

                if (plan.slug === 'free') {
                  priceLabel = 'R$ 0';
                } else if (plan.slug === 'essential') {
                  if (billingCycle === 'monthly') {
                    priceLabel = 'R$ 59';
                    yearlyPrice = 'ou R$ 49/mês no plano anual';
                    savingText = 'ECONOMIZE 17%';
                  } else {
                    priceLabel = 'R$ 49';
                    yearlyPrice = 'cobrado anualmente (R$ 588/ano)';
                  }
                } else if (plan.slug === 'pro') {
                  if (billingCycle === 'monthly') {
                    priceLabel = 'R$ 150';
                    yearlyPrice = 'ou R$ 125/mês no plano anual';
                    savingText = 'ECONOMIZE 17%';
                  } else {
                    priceLabel = 'R$ 125';
                    yearlyPrice = 'cobrado anualmente (R$ 1.500/ano)';
                  }
                } else if (plan.slug === 'enterprise') {
                  priceLabel = 'Sob consulta';
                }

                return (
                  <PlanCard
                    key={plan.slug}
                    slug={plan.slug as PlanSlug}
                    name={plan.name}
                    priceLabel={priceLabel}
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

          <p className="text-center mt-8 text-slate-500 text-xs font-semibold">
            <strong className="text-slate-900 font-bold">Todos os planos pagos:</strong> sem fidelidade · cancele quando quiser · ativação em minutos · pagamento seguro
          </p>
        </div>
      </section>

      {/* ── 7. WHICH PLAN ────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">Guia rápido</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Não sabe qual plano escolher?</h2>
            <p className="text-[17px] text-slate-500 font-medium">Encontre o seu cenário abaixo e vá direto ao plano certo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { scenario: '"Estou começando e quero aparecer no portal"', action: '→ Gratuito' },
              { scenario: '"Quero me destacar nas buscas da minha cidade"', action: '→ Essencial' },
              { scenario: '"Quero receber contatos de clientes toda semana"', action: '→ Pro' },
              { scenario: '"Tenho equipe comercial e preciso integrar com meu CRM"', action: '→ Enterprise' }
            ].map((card, idx) => (
              <div key={idx} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 hover:border-slate-350 transition-colors flex flex-col justify-between shadow-sm">
                <p className="text-[14.5px] text-slate-600 font-medium leading-relaxed mb-4">{card.scenario}</p>
                <span className="font-extrabold text-slate-900 text-[15.5px]">{card.action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. COMPARISON TABLE ────────────────── */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">Comparativo</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Compare os recursos lado a lado</h2>
            <p className="text-[17px] text-slate-500 font-medium">As principais diferenças que impulsionam os resultados comerciais da sua empresa.</p>
          </div>
          <FeatureComparisonTable />
        </div>
      </section>

      {/* ── 9. DASHBOARD SHOWCASE ────────────────── */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
            {/* Copy */}
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">Inteligência de mercado</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Saiba exatamente quanto o portal gera para você</h2>
              <p className="text-slate-500 text-[16px] font-medium leading-relaxed">
                Nada de investir no escuro. Acompanhe o desempenho do seu perfil e prove o retorno do seu investimento.
              </p>
              <ul className="space-y-3 font-medium text-slate-700">
                <li className="flex items-start gap-2 text-[15px]">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Visitas ao perfil e cliques no WhatsApp</span>
                </li>
                <li className="flex items-start gap-2 text-[15px]">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Relatórios de desempenho do plano Pro</span>
                </li>
                <li className="flex items-start gap-2 text-[15px]">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Insights avançados e sinais de intenção no Enterprise</span>
                </li>
              </ul>
              <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold px-8 h-11 text-xs shadow-md">
                <Link href="/register">Começar a acompanhar</Link>
              </Button>
            </div>

            {/* Dashboard Mockup in CSS */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden flex flex-col">
              {/* Top bar */}
              <div className="bg-slate-50 border-b border-slate-200/80 p-3.5 flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                    <span className="text-[11.5px] text-slate-500 font-medium">Visitas ao perfil</span>
                    <div className="flex items-baseline gap-1">
                      <strong className="text-[19px] font-black text-slate-900">1.284</strong>
                      <span className="text-[10px] text-emerald-500 font-extrabold">▲</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                    <span className="text-[11.5px] text-slate-500 font-medium">Cliques WhatsApp</span>
                    <div className="flex items-baseline gap-1">
                      <strong className="text-[19px] font-black text-slate-900">96</strong>
                      <span className="text-[10px] text-emerald-500 font-extrabold">▲</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                    <span className="text-[11.5px] text-slate-500 font-medium">Taxa de contato</span>
                    <div className="flex items-baseline gap-1">
                      <strong className="text-[19px] font-black text-slate-900">7,5%</strong>
                      <span className="text-[10px] text-emerald-500 font-extrabold">▲</span>
                    </div>
                  </div>
                </div>

                {/* Chart Columns */}
                <div className="space-y-2">
                  <div className="flex items-end gap-3 h-28 px-2 border-b border-slate-100">
                    {[35, 48, 42, 60, 55, 78, 92].map((height, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-sm" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                    <span>Sem 1</span>
                    <span>Sem 2</span>
                    <span>Sem 3</span>
                    <span>Sem 4</span>
                    <span>Sem 5</span>
                    <span>Sem 6</span>
                    <span>Sem 7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. GUARANTEE ────────────────── */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-200/60">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-amber-600">Sem risco</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Teste sem medo de se arrepender</h2>
            <p className="text-[17px] text-slate-500 font-medium">Você não precisa de contrato longo nem burocracia para começar a receber contatos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Sem fidelidade', desc: 'Cancele quando quiser, sem multa e sem letra miúda.' },
              { title: 'Ativação em minutos', desc: 'Assinou, seu perfil já aparece com os recursos do plano.' },
              { title: 'Pagamento seguro', desc: 'Ambiente 100% protegido para seus dados e cobranças.' },
              { title: 'Suporte humano', desc: 'Atendimento especializado de gente de verdade, em português.' }
            ].map((g, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center shadow-sm">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base mb-4 mx-auto shrink-0">
                  ✓
                </div>
                <h3 className="text-base font-black text-slate-950 mb-2 leading-tight">{g.title}</h3>
                <p className="text-[13.5px] text-slate-500 font-medium leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. ADS / SPONSOR ────────────────── */}
      <section className="py-20 bg-[#F5F8FC] border-b border-slate-200/50">
        <div className="container mx-auto px-4 md:px-6 max-w-[1160px]">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1668e8] text-white shadow-lg shrink-0">
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
                <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-bold border-0 shadow-lg h-11 w-full rounded-full text-xs">
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

      {/* ── 12. FAQ ────────────────── */}
      <PricingFaq />

      {/* ── 13. FINAL CTA ────────────────── */}
      <section className="bg-amber-500 py-16 text-center border-t border-amber-600">
        <div className="container mx-auto px-6 max-w-[1160px] flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="text-white text-2xl md:text-3xl font-black text-left tracking-tight leading-tight">
            Um cliente a mais por mês já paga o plano
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0 justify-center">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-white text-slate-950 font-bold rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap text-center"
            >
              Criar meu perfil grátis
            </Link>
            <Link
              href="/contact?subject=commercial"
              className="px-8 py-3.5 border border-white text-white font-bold rounded-lg text-sm hover:bg-white/10 transition-colors whitespace-nowrap text-center"
            >
              Falar com vendas
            </Link>
          </div>
        </div>
      </section>

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
