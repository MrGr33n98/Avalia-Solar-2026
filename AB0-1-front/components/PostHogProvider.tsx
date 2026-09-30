'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
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

function exposeAnalyticsBridge(posthogInstance: any) {
  window.__analyticsPosthog = {
    alias: (newId) => posthogInstance.alias(newId),
    capture: (eventName, properties = {}) => {
      posthogInstance.capture(
        eventName,
        sanitizeAnalyticsProperties(properties) as Record<string, unknown>
      );
    },
    identify: (userId, traits = {}) => {
      posthogInstance.identify(userId, sanitizeAnalyticsProperties(traits) as Record<string, unknown>);
    },
    isLoaded: () => Boolean(posthogInstance.__loaded),
    reset: () => posthogInstance.reset(),
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
function PostHogPageView({ posthog }: { posthog: any }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMounted = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY || !posthog || !posthog.__loaded) return;

    // Task 6: Session Replay cirúrgico (Lead, Wizard, Compare, Chat, Login). Nunca gravar Admin/Dashboard.
    const isAllowedReplayPage =
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/quote') ||
      pathname.startsWith('/compare') ||
      pathname.startsWith('/chat') ||
      pathname === '/login' ||
      pathname === '/signup';

    const isDashboardOrAdmin = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

    if (isAllowedReplayPage && !isDashboardOrAdmin && hasAnalyticsConsent()) {
      try {
        posthog.startSessionRecording();
      } catch {
        // Safe fallback se a gravação não estiver disponível
      }
    } else {
      try {
        posthog.stopSessionRecording();
      } catch {
        // Safe fallback
      }
    }

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
  }, [pathname, searchParams, posthog]);

  return null;
}

/**
 * PostHogProvider — integra PostHog com o Next.js 14 App Router de forma diferida.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [phState, setPhState] = useState<{ client: any; Provider: any } | null>(null);

  useEffect(() => {
    if (!POSTHOG_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY não configurado.');
      }
      return;
    }

    let cancelled = false;

    Promise.all([
      import('posthog-js'),
      import('posthog-js/react'),
    ])
      .then(([phModule, phReactModule]) => {
        if (cancelled) return;
        const posthog = phModule.default;
        const PHProvider = phReactModule.PostHogProvider;

        exposeAnalyticsBridge(posthog);

        if (!posthog.__loaded) {
          const hasConsent = hasAnalyticsConsent();

          const isMobile = window.innerWidth < 768;
          const navConn = (navigator as NavigatorWithConnection).connection;
          const isSaveData = navConn?.saveData === true;
          const isSlowConn = ['slow-2g', '2g', '3g'].includes(navConn?.effectiveType ?? '');
          const shouldEnableRecording = hasConsent && !isMobile && !isSaveData && !isSlowConn;

          posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            // @ts-ignore
            cookie_domain: window.location.hostname === 'localhost' ? 'localhost' : undefined,

            person_profiles: 'identified_only',
            capture_pageview: false,
            capture_pageleave: true,
            autocapture: false,

            // @ts-ignore
            disable_dead_clicks: true,
            // @ts-ignore
            __preview_remote_config: false,

            opt_out_capturing_by_default: !hasConsent,

            disable_session_recording: !shouldEnableRecording,
            session_recording: shouldEnableRecording
              ? {
                  maskAllInputs: true,
                  maskTextSelector: '[data-ph-no-capture]',
                }
              : undefined,

            loaded: (ph: any) => {
              if (ph.config) {
                ph.config.disable_dead_clicks = true;
                ph.config.autocapture = false;
              }

              if (hasConsent) {
                ph.capture('$pageview', {
                  $current_url: window.location.origin + window.location.pathname,
                  ...getPageAnalyticsProperties(window.location.pathname),
                });
              }

              const distinctId = ph.get_distinct_id();
              const sessionId = ph.get_session_id();
              if (distinctId) Sentry.setTag('posthog_distinct_id', distinctId);
              if (sessionId) Sentry.setTag('posthog_session_id', sessionId);

              if (process.env.NODE_ENV === 'development') {
                console.log('[PostHog] Inicializado. ID:', ph.get_distinct_id());
              }
            },
          });
        }

        setPhState({ client: posthog, Provider: PHProvider });

        const cleanup = onConsentChange((consent) => {
          if (!posthog.__loaded) return;

          if (consent.analytics) {
            posthog.opt_in_capturing();
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
      })
      .catch((err) => {
        console.error('[PostHog] Error dynamically loading posthog-js:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!POSTHOG_KEY || !phState) {
    return <>{children}</>;
  }

  const { client, Provider } = phState;

  return (
    <Provider client={client}>
      <Suspense fallback={null}>
        <PostHogPageView posthog={client} />
      </Suspense>
      {children}
    </Provider>
  );
}
