'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowLeft, CreditCard, ChevronRight, HelpCircle, Check, Info, ShieldCheck, X, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBillingSubscription } from '@/hooks/useBillingSubscription';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { BillingStatusBanner } from '@/components/billing/BillingStatusBanner';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorBanner } from '@/components/billing/ErrorBanner';

// ─── Animações ────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const modalVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 } 
  },
  exit: { 
    opacity: 0, scale: 0.95, y: 16,
    transition: { duration: 0.2, ease: 'easeIn' as const } 
  }
};

export default function BillingDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const {
    subscription,
    plans,
    loading,
    actionLoading,
    error,
    isFree,
    isPro,
    isEnterprise,
    checkoutPro,
    openStripePortal,
    requestEnterpriseLead,
  } = useBillingSubscription();

  // Estados locais para o modal Enterprise
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [phoneContact, setPhoneContact] = useState('');
  const [estimatedMrr, setEstimatedMrr] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalSuccessMessage, setModalSuccessMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleUpgradeClick = async () => {
    const proPlan = plans.find((p) => p.slug === 'pro');
    if (!proPlan) return;
    try {
      await checkoutPro(proPlan.id);
    } catch (err) {
      // O hook já gerencia e define o erro
    }
  };

  const handleEnterpriseClick = () => {
    const entPlan = plans.find((p) => p.slug === 'enterprise');
    if (!entPlan) return;
    setJustification('');
    setPhoneContact('');
    setEstimatedMrr('');
    setModalSuccessMessage(null);
    setModalError(null);
    setIsEnterpriseModalOpen(true);
  };

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entPlan = plans.find((p) => p.slug === 'enterprise');
    if (!entPlan) return;

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

      await requestEnterpriseLead(entPlan.id, payload);
      setModalSuccessMessage('Sua solicitação de plano Enterprise foi enviada! Nosso time comercial entrará em contato em breve.');
    } catch (err: any) {
      setModalError(err?.message || 'Falha ao enviar solicitação.');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 min-h-screen">
      
      {/* Breadcrumb e botão de voltar */}
      <div className="flex items-center gap-4">
        <Button asChild size="sm" variant="outline" className="clay-chip rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-9">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao painel
          </Link>
        </Button>
        <span className="text-slate-350">/</span>
        <span className="text-slate-500 text-sm font-semibold">Faturamento e Assinatura</span>
      </div>

      {/* Título de seção */}
      <div className="space-y-2 text-left">
        <h2 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2.5">
          <CreditCard className="h-8 w-8 text-brand-blue" />
          Faturamento
        </h2>
        <p className="text-sm text-slate-500 max-w-xl">
          Gerencie o plano da sua empresa, visualize informações de pagamento, data de renovação e solicite upgrades de vitrine comercial.
        </p>
      </div>

      <ErrorBanner error={error} />

      {/* Banner de status crítico (past_due, unpaid, canceled) */}
      {subscription && (
        <BillingStatusBanner
          status={subscription.status}
          onActionClick={openStripePortal}
          actionLoading={actionLoading}
        />
      )}

      {/* Bloco principal: Plano Atual */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Plano Ativo</h5>
          {isFree && plans.some(p => p.slug === 'pro') && (
            <UpgradeButton
              onClick={handleUpgradeClick}
              disabled={actionLoading}
              isLoading={actionLoading}
            />
          )}
        </div>

        <CurrentPlanCard
          subscription={subscription}
          loading={loading}
          onManageClick={openStripePortal}
          actionLoading={actionLoading}
        />
      </div>

      {/* Seção de Upsell e Benefícios (caso não seja Enterprise) */}
      {!isEnterprise && !loading && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="grid gap-6 md:grid-cols-2 pt-4"
        >
          {/* Card Upsell Pro se for Free */}
          {isFree && (
            <div className="clay-precision rounded-[2rem] border border-emerald-100 bg-emerald-50/10 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green text-white shadow-sm">
                    <Zap className="h-4.5 w-4.5" />
                  </div>
                  <h6 className="font-black text-slate-950 text-base">Fazer Upgrade para Pro</h6>
                </div>
                <p className="text-xs leading-relaxed text-slate-500 mb-4">
                  Destaque sua empresa removendo concorrentes do seu entorno e ative CTAs personalizados direcionados para o seu WhatsApp ou site corporativo.
                </p>
                <ul className="space-y-2 mb-6">
                  {['CTAs Personalizados', 'Sem Banners de Concorrentes', 'Patrocínio de Vitrine'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={handleUpgradeClick}
                disabled={actionLoading}
                className="w-full h-11 rounded-full bg-brand-green hover:bg-brand-green/90 text-white border-0 shadow-sm"
              >
                {actionLoading ? 'Processando...' : 'Quero o plano Pro'}
              </Button>
            </div>
          )}

          {/* Card Upsell Enterprise se for Free ou Pro */}
          <div className="clay-precision rounded-[2rem] border border-violet-100 bg-violet-50/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple text-white shadow-sm">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <h6 className="font-black text-slate-950 text-base">Contratar Enterprise</h6>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 mb-4">
                Leve a sua equipe de vendas para o próximo nível com dados qualificados de tráfego, sinais reais de intenção de compra e webhooks para o seu CRM.
              </p>
              <ul className="space-y-2 mb-6">
                {['Mapeamento de Intent Signals', 'Webhooks e Integração', 'Relatórios Customizados'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {subscription?.status === 'enterprise_lead' ? (
              <Button
                disabled
                className="w-full h-11 rounded-full bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
              >
                Solicitação Comercial Registrada
              </Button>
            ) : (
              <Button
                onClick={handleEnterpriseClick}
                disabled={actionLoading}
                className="w-full h-11 rounded-full bg-brand-purple hover:bg-brand-purple/90 text-white border-0 shadow-sm"
              >
                Solicitar Apresentação Enterprise
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* FAQs adicionais para Faturamento do Dashboard */}
      <div className="space-y-4 pt-6 border-t border-slate-200/50">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4" />
          Perguntas Frequentes sobre Cobrança
        </h5>
        
        <div className="grid gap-4 md:grid-cols-2 text-xs">
          <div className="p-5 rounded-2xl border border-white bg-white/40 space-y-2">
            <h6 className="font-bold text-slate-900">Como são cobradas as assinaturas?</h6>
            <p className="leading-relaxed text-slate-500">
              O plano Pro é cobrado anualmente e de forma recorrente em seu cartão de crédito através do Stripe. Você pode cancelar ou alterar a qualquer momento.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-white bg-white/40 space-y-2">
            <h6 className="font-bold text-slate-900">Posso rebaixar para o plano gratuito?</h6>
            <p className="leading-relaxed text-slate-500">
              Sim. Ao gerenciar sua assinatura e solicitar o cancelamento, seu plano permanecerá Pro até o fim do período já pago e depois retornará automaticamente para o Gratuito.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para Captação de Lead Enterprise */}
      <AnimatePresence>
        {isEnterpriseModalOpen && (
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
                  Fale com nosso time corporativo. Diga quais as suas necessidades de integração e governança para sua operação B2B.
                </p>
              </div>

              {modalSuccessMessage ? (
                <div className="space-y-6 py-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed font-semibold">
                    {modalSuccessMessage}
                  </p>
                  <Button
                    onClick={() => setIsEnterpriseModalOpen(false)}
                    className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Entendido
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleEnterpriseSubmit} className="space-y-5">
                  <ErrorBanner error={modalError} onDismiss={() => setModalError(null)} />

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Telefone para Contato comercial *
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
                      MRR Estimado no mercado Solar (Opcional)
                    </label>
                    <Input
                      type="number"
                      disabled={modalSubmitting}
                      placeholder="Faturamento mensal recorrente em solar"
                      value={estimatedMrr}
                      onChange={(e) => setEstimatedMrr(e.target.value)}
                      className="rounded-xl h-11 border-slate-200 bg-white/60 focus-visible:ring-brand-purple focus-visible:ring-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Justificativa de Integração ou Governança *
                    </label>
                    <textarea
                      required
                      disabled={modalSubmitting}
                      rows={4}
                      placeholder="Ex: Queremos integrar leads recebidos no marketplace diretamente com nosso CRM RD Station via webhook e precisamos de signals de intenção da vitrine."
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
                      className="w-full h-11 rounded-full bg-brand-purple hover:bg-brand-purple/90 text-white border-0 shadow-lg"
                    >
                      {modalSubmitting ? 'Processando...' : 'Solicitar Contato Comercial'}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
