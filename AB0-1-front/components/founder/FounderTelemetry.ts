'use client';

/**
 * Módulo de Telemetria e Analytics para a Landing Page Founder
 * Rastreia eventos de engajamento, navegação no tour e cliques em CTAs.
 */

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export function trackFounderPageView() {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_page_viewed', {
        page_path: window.location.pathname,
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa para não impactar UX
  }
}

export function trackFounderTourStarted(method: 'auto' | 'manual' = 'auto') {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_tour_started', {
        method,
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa
  }
}

export function trackFounderTourStep(stepIndex: number, stepId: string, title: string) {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_tour_step', {
        step_index: stepIndex,
        step_id: stepId,
        step_title: title,
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa
  }
}

export function trackFounderTourCompleted(totalSteps: number) {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_tour_completed', {
        total_steps: totalSteps,
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa
  }
}

export function trackFounderTourPaused() {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_tour_paused', {
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa
  }
}

export function trackFounderTourResumed() {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_tour_resumed', {
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa
  }
}

export function trackFounderBeforeAfter(position: number) {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_before_after_interacted', {
        slider_position: Math.round(position),
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa
  }
}

export function trackFounderCtaClick(ctaName: string, destinationUrl: string) {
  if (typeof window === 'undefined') return;
  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture('founder_cta_clicked', {
        cta_name: ctaName,
        destination_url: destinationUrl,
        timestamp: Date.now(),
      });
    }
  } catch {
    // Falha silenciosa
  }
}

