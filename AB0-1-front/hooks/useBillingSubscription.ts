'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { billingApi, type BillingSubscription, type BillingPlan } from '@/lib/api/billing';

export function useBillingSubscription() {
  const { user, isAuthenticated } = useAuth();
  
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.company_id;

  const loadBillingData = useCallback(async () => {
    if (!isAuthenticated || !companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [subData, plansData] = await Promise.all([
        billingApi.getSubscription(companyId),
        billingApi.getPlans().catch((err) => {
          console.warn('[useBillingSubscription] Erro ao buscar planos dinâmicos, usando array vazio:', err);
          return [] as BillingPlan[];
        }),
      ]);

      setSubscription(subData);
      setPlans(plansData);
    } catch (err: any) {
      console.error('[useBillingSubscription] Falha ao carregar dados de faturamento:', err);
      setError(err?.message || 'Falha ao carregar dados de faturamento.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, companyId]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Ação de Checkout para o plano Pro
  const checkoutPro = useCallback(
    async (planId: number, successUrl?: string, cancelUrl?: string) => {
      if (!companyId) throw new Error('Empresa do usuário não configurada.');
      
      setActionLoading(true);
      setError(null);

      try {
        const sUrl = successUrl || `${window.location.origin}/dashboard?company_id=${companyId}&checkout=success`;
        const cUrl = cancelUrl || window.location.href;
        
        const { checkout_url } = await billingApi.createCheckoutSession(companyId, planId, sUrl, cUrl);
        window.location.href = checkout_url;
      } catch (err: any) {
        console.error('[useBillingSubscription] Erro ao iniciar checkout:', err);
        setError(err?.message || 'Falha ao iniciar checkout.');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [companyId]
  );

  // Ação de Portal para Gerenciar Assinatura no Stripe
  const openStripePortal = useCallback(
    async (returnUrl?: string) => {
      if (!companyId) throw new Error('Empresa do usuário não configurada.');
      
      setActionLoading(true);
      setError(null);

      try {
        const rUrl = returnUrl || window.location.href;
        const { portal_url } = await billingApi.createPortalSession(companyId, rUrl);
        window.location.href = portal_url;
      } catch (err: any) {
        console.error('[useBillingSubscription] Erro ao abrir portal Stripe:', err);
        setError(err?.message || 'Falha ao abrir o portal de faturamento.');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [companyId]
  );

  // Ação para Solicitar Lead de Plano Enterprise
  const requestEnterpriseLead = useCallback(
    async (planId: number, payload: { justification: string; phone_contact: string; estimated_mrr?: number }) => {
      if (!companyId) throw new Error('Empresa do usuário não configurada.');
      
      setActionLoading(true);
      setError(null);

      try {
        const result = await billingApi.createEnterpriseLead(companyId, planId, payload);
        
        // Atualiza a assinatura localmente para refletir o status enterprise_lead
        const subData = await billingApi.getSubscription(companyId);
        setSubscription(subData);

        return result;
      } catch (err: any) {
        console.error('[useBillingSubscription] Erro ao enviar lead Enterprise:', err);
        setError(err?.message || 'Falha ao enviar solicitação do plano Enterprise.');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [companyId]
  );

  return {
    subscription,
    plans,
    loading,
    actionLoading,
    error,
    refetch: loadBillingData,
    checkoutPro,
    openStripePortal,
    requestEnterpriseLead,
    isPro: subscription?.plan.slug === 'pro' && ['active', 'trialing', 'past_due'].includes(subscription.status),
    isEnterprise: subscription?.plan.slug === 'enterprise' && subscription.status === 'active',
    isFree: !subscription || subscription.plan.slug === 'free' || subscription.status === 'canceled',
  };
}
