'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';
import * as Sentry from '@sentry/nextjs';

import { hasAnalyticsConsent, onConsentChange } from '@/lib/analytics/consent';
import { getPageTemplateInfo } from '@/lib/analytics/page-template';
import { sanitizeAnalyticsProperties } from '@/lib/analytics/sanitize';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

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

function getPageAnalyticsProperties(pathname: string) {
  const template = getPageTemplateInfo(pathname);

  return {
    page_type: getPageType(pathname),
    page_template: template.template,
    normalized_path: template.normalizedPath,
  };
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
      ...getPageAnalyticsProperties(pathname),
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
    const navConn = (navigator as NavigatorWithConnection).connection;
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
            ...getPageAnalyticsProperties(window.location.pathname),
          });
        }

        // Task 2.2: Integração Sentry + PostHog
        const distinctId = ph.get_distinct_id();
        const sessionId = ph.get_session_id();
        if (distinctId) Sentry.setTag("posthog_distinct_id", distinctId);
        if (sessionId) Sentry.setTag("posthog_session_id", sessionId);

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
          ...getPageAnalyticsProperties(window.location.pathname),
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
      </Suspense>
      {children}
    </PHProvider>
  );
}
