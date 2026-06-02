'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useRef, Suspense } from 'react';

import { hasAnalyticsConsent, onConsentChange } from '@/lib/analytics/consent';
import { sanitizeAnalyticsProperties } from '@/lib/analytics/sanitize';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

declare global {
  interface Window {
    __analyticsPosthog?: {
      alias: (newId: string) => void;
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      isLoaded: () => boolean;
      reset: () => void;
    };
  }
}

function exposeAnalyticsBridge() {
  window.__analyticsPosthog = {
    alias: (newId) => posthog.alias(newId),
    capture: (eventName, properties = {}) => {
      posthog.capture(eventName, sanitizeAnalyticsProperties(properties) as Record<string, unknown>);
    },
    identify: (userId, traits = {}) => {
      posthog.identify(userId, sanitizeAnalyticsProperties(traits) as Record<string, unknown>);
    },
    isLoaded: () => posthog.__loaded,
    reset: () => posthog.reset(),
  };
}

function WebVitals() {
  useReportWebVitals((metric) => {
    if (!posthog.__loaded) return;

    // PostHog standard names: LCP, FID (first_input_delay), CLS, FCP, TTFB, INP
    const cleanName = metric.name === 'FID' ? 'first_input_delay' : metric.name;

    posthog.capture('web_vitals', {
      category: metric.label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
      event_label: cleanName,
      event_value: metric.value,
      initial_value: metric.value,
      metric_id: metric.id,
      metric_name: cleanName,
      metric_value: metric.value,
      page_path: window.location.pathname,
    });
  });

  return null;
}

/**
 * Mapeia o pathname do Next.js para um tipo de pagina amigavel para analytics.
 */
function getPageType(pathname: string): string {
  if (pathname === '/') return 'landing';
  if (pathname.startsWith('/companies/')) return 'company_profile';
  if (pathname === '/companies') return 'search_results';
  if (pathname.startsWith('/categories/')) return 'category_browse';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname === '/login' || pathname === '/signup') return 'auth';
  if (pathname.startsWith('/checkout') || pathname.startsWith('/quote')) return 'conversion';
  return 'other';
}

/**
 * Rastreia pageviews automaticamente em todas as rotas do Next.js App Router.
 * Separado em componente filho para poder usar useSearchParams dentro de Suspense.
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMounted = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (!posthog.__loaded) return;

    // Não dispara na montagem inicial — o Provider já captura o primeiro $pageview
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const url = window.location.origin + pathname;

    posthog.capture('$pageview', { 
      $current_url: url,
      page_type: getPageType(pathname)
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[PostHog] $pageview:', url);
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * PostHogProvider — integra PostHog com o Next.js 14 App Router.
 *
 * Funcionalidades:
 * - Inicializa PostHog respeitando consentimento LGPD
 * - Rastreia page views automaticamente em todas as rotas
 * - Ativa/desativa captura conforme mudança de consentimento
 * - Session recording com mascaramento de inputs
 * - Autocapture desativado (eventos manuais via lib/analytics)
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    exposeAnalyticsBridge();

    if (!POSTHOG_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY não configurado.');
      }
      return;
    }

    // Evita dupla inicialização (hot-reload em dev, StrictMode, etc.)
    if (posthog.__loaded) return;

    const hasConsent = hasAnalyticsConsent();

    // Session recording só ativa com consentimento explícito + desktop + conexão rápida.
    // Evita carregar posthog-recorder.js (62 KiB) e dead-clicks-autocapture.js (5 KiB)
    // no critical path — esses scripts causam 195ms+ de long task bloqueando a thread.
    const isMobile = window.innerWidth < 768;
    const navConn = (navigator as any).connection;
    const isSaveData = navConn?.saveData === true;
    const isSlowConn = ['slow-2g', '2g', '3g'].includes(navConn?.effectiveType ?? '');
    const shouldEnableRecording = hasConsent && !isMobile && !isSaveData && !isSlowConn;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,

      // Perfis apenas para usuários identificados (não anônimos por padrão)
      person_profiles: 'identified_only',

      // Page views manuais via PostHogPageView (necessário para Next.js App Router)
      capture_pageview: false,

      // Captura saída de página (bounce rate, session duration)
      capture_pageleave: true,

      // Autocapture desativado — todos os eventos são explícitos
      autocapture: false,

      // LGPD: não captura nada até consentimento explícito
      opt_out_capturing_by_default: !hasConsent,

      // Recording: desativado por padrão — scripts (posthog-recorder.js, dead-clicks-autocapture.js)
      // só carregam se o usuário deu consentimento explícito + está em desktop + boa conexão
      disable_session_recording: !shouldEnableRecording,
      session_recording: shouldEnableRecording ? {
        maskAllInputs: true,
        maskTextSelector: '[data-ph-no-capture]',
      } : undefined,

      // Bootstrap: usa $pageview no load inicial
      loaded: (ph) => {
        if (hasConsent) {
          ph.capture('$pageview', {
            $current_url: window.location.origin + window.location.pathname,
            page_type: getPageType(window.location.pathname)
          });
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('[PostHog] Inicializado. ID:', ph.get_distinct_id());
        }
      },
    });

    // Escuta mudanças de consentimento e ativa/desativa captura dinamicamente
    const cleanup = onConsentChange((consent) => {
      if (!posthog.__loaded) return;

      if (consent.analytics) {
        posthog.opt_in_capturing();
        // Registra pageview ao dar consentimento (caso ainda não tenha sido capturado)
        posthog.capture('$pageview', { 
          $current_url: window.location.origin + window.location.pathname,
          page_type: getPageType(window.location.pathname)
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('[PostHog] Captura ativada (consentimento dado).');
        }
      } else {
        posthog.opt_out_capturing();

        if (process.env.NODE_ENV === 'development') {
          console.log('[PostHog] Captura desativada (consentimento revogado).');
        }
      }
    });

    return cleanup;
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      {/* Suspense necessário para useSearchParams no Next.js 14 App Router */}
      <Suspense fallback={null}>
        <PostHogPageView />
        <WebVitals />
      </Suspense>
      {children}
    </PHProvider>
  );
}
