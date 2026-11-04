'use client';

import { hasAnalyticsConsent } from '@/lib/analytics/consent';

/**
 * Módulo de Telemetria e Analytics para a Landing Page Founder
 * Rastreia eventos de engajamento, navegação no tour, comparador e cliques em CTAs.
 */

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
    };
  }
}

function safeCapture(eventName: string, properties: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(eventName, {
        ...properties,
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa para não impactar a experiência do usuário
  }
}

export function trackFounderPageView() {
  if (typeof window === 'undefined') return;
  safeCapture('founder_page_viewed', { page_path: window.location.pathname });
}

export function trackFounderTourStarted(method: 'auto' | 'manual' | 'resume' = 'auto') {
  safeCapture('founder_tour_started', { method });
}

export function trackFounderTourStep(
  stepIndex: number,
  stepId: string,
  title: string,
  interactionMode: 'manual' | 'autoplay' = 'manual'
) {
  safeCapture('founder_tour_step_viewed', {
    step_index: stepIndex,
    step_id: stepId,
    step_name: title,
    interaction_mode: interactionMode,
  });
}

export function trackFounderTourCompleted(totalSteps: number) {
  safeCapture('founder_tour_completed', { total_steps: totalSteps });
}

export function trackFounderTourPaused() {
  safeCapture('founder_tour_paused');
}

export function trackFounderTourResumed() {
  safeCapture('founder_tour_started', { method: 'resume' });
}

export function trackFounderTourRestarted() {
  safeCapture('founder_tour_restarted');
}

export function trackFounderTourBookingClicked() {
  safeCapture('founder_tour_booking_clicked');
}

export function trackFounderBeforeAfter(position: number) {
  safeCapture('founder_before_after_interacted', { slider_position: Math.round(position) });
}

// Novos eventos do Comparador Visual Free × Premium
export function trackFounderComparisonViewed() {
  safeCapture('founder_comparison_viewed');
}

export function trackFounderComparisonInteracted(
  premiumPercent: number,
  method: 'drag' | 'preset' | 'keyboard' | 'mobile_tab'
) {
  safeCapture('founder_comparison_interacted', {
    premium_percent: Math.round(premiumPercent),
    interaction_method: method,
  });
}

export function trackFounderComparisonModeChanged(mode: 'reveal' | 'side-by-side' | 'mobile_tabs') {
  safeCapture('founder_comparison_mode_changed', { mode });
}

export function trackFounderComparisonExpanded(imageTarget: 'free' | 'premium' | 'both') {
  safeCapture('founder_comparison_expanded', { image_target: imageTarget });
}

export function trackFounderCtaClick(ctaName: string, destinationUrl: string) {
  safeCapture('founder_cta_clicked', {
    cta_name: ctaName,
    destination_url: destinationUrl,
  });
}
