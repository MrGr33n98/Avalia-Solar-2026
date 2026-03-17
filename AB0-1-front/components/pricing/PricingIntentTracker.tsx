'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  sendIntentSignal,
  useExitIntent,
  useScrollDepthMilestone,
  useTimeOnPageMilestone,
} from '@/lib/analytics/hooks/useIntentTracking';
import { track } from '@/lib/analytics/lazy';

// ID neutro para sinais da pricing page (sem empresa específica)
const PRICING_ENTITY_ID = 'pricing';

/**
 * PricingIntentTracker — rastreia sinais de intenção na página de preços.
 *
 * Cobre:
 * - Exit intent (mouse saindo pelo topo)
 * - Scroll 80% (leu tabela completa de recursos)
 * - Tempo de 5min (análise profunda de planos)
 * - Clique nos CTAs de planos
 * - Clique em "Falar com vendas"
 * - Hover nos cards de planos
 */
export function PricingIntentTracker() {
  // Hooks de sinais gerais para a pricing page
  useExitIntent(PRICING_ENTITY_ID);
  useScrollDepthMilestone(PRICING_ENTITY_ID);
  useTimeOnPageMilestone(PRICING_ENTITY_ID);

  const planHoverTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const planHoverFired = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Rastreia view de pricing page
    track('pricing_page_viewed', {
      page_type: 'pricing',
      pathname: '/pricing',
    });

    // Delega hover nos cards de plano via event delegation
    const handleMouseEnter = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-plan-slug]') as HTMLElement | null;
      if (!target) return;
      const planSlug = target.dataset.planSlug;
      if (!planSlug || planHoverFired.current.has(planSlug)) return;

      planHoverTimers.current[planSlug] = setTimeout(() => {
        if (planHoverFired.current.has(planSlug)) return;
        planHoverFired.current.add(planSlug);
        sendIntentSignal({
          company_id: PRICING_ENTITY_ID,
          signal_type: 'pricing_interaction',
          signal_category: 'financial_intent',
          element_type: 'plan_card_hover',
          metadata: { plan_slug: planSlug, action: 'hover_dwell' },
        });
      }, 1000);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-plan-slug]') as HTMLElement | null;
      if (!target) return;
      const planSlug = target.dataset.planSlug;
      if (!planSlug) return;
      if (planHoverTimers.current[planSlug]) {
        clearTimeout(planHoverTimers.current[planSlug]);
        delete planHoverTimers.current[planSlug];
      }
    };

    // Clique nos CTAs de plano (event delegation)
    const handleClick = (e: MouseEvent) => {
      const ctaEl = (e.target as HTMLElement).closest('[data-pricing-cta]') as HTMLElement | null;
      if (!ctaEl) return;
      const planSlug = ctaEl.dataset.pricingCta;
      const ctaLabel = ctaEl.dataset.ctaLabel || ctaEl.textContent?.trim() || '';

      sendIntentSignal({
        company_id: PRICING_ENTITY_ID,
        signal_type: 'pricing_interaction',
        signal_category: 'financial_intent',
        element_type: 'plan_cta_click',
        metadata: { plan_slug: planSlug, cta_label: ctaLabel.slice(0, 60), action: 'cta_clicked' },
      });

      track('pricing_cta_clicked', {
        plan_slug: planSlug,
        cta_label: ctaLabel.slice(0, 60),
      });
    };

    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      document.removeEventListener('click', handleClick);
      Object.values(planHoverTimers.current).forEach(clearTimeout);
    };
  }, []);

  return null;
}

/**
 * Hook para rastrear clique em "Comercial" na tabela de comparação.
 */
export function usePricingTableTracking() {
  const trackContactSalesCell = useCallback((featureLabel: string) => {
    sendIntentSignal({
      company_id: PRICING_ENTITY_ID,
      signal_type: 'pricing_interaction',
      signal_category: 'contact_intent',
      element_type: 'feature_table_contact_sales',
      metadata: { feature_label: featureLabel.slice(0, 80), action: 'contact_sales_cell_clicked' },
    });
  }, []);

  const trackHeroCta = useCallback((ctaType: 'register' | 'contact_sales') => {
    sendIntentSignal({
      company_id: PRICING_ENTITY_ID,
      signal_type: 'pricing_interaction',
      signal_category: ctaType === 'contact_sales' ? 'contact_intent' : 'financial_intent',
      element_type: 'pricing_hero_cta',
      metadata: { cta_type: ctaType, action: 'hero_cta_clicked' },
    });

    track('pricing_hero_cta_clicked', { cta_type: ctaType });
  }, []);

  return { trackContactSalesCell, trackHeroCta };
}
