'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';

import { hasAnalyticsConsent, onConsentChange } from '@/lib/analytics/consent';
import { getPageTemplateInfo } from '@/lib/analytics/page-template';
import { sanitizeAnalyticsProperties } from '@/lib/analytics/sanitize';
import { getSurfaceKind } from '@/lib/analytics/contract';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

export const getPostHogCookieDomain = (overrideHostname?: string): string | undefined => {
  if (typeof window === 'undefined' && !overrideHostname) return undefined;
  const hostname =
    overrideHostname || (typeof window !== 'undefined' ? window.location.hostname : '');

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  ) {
    return hostname;
  }

  const configuredDomain = process.env.NEXT_PUBLIC_GA_COOKIE_DOMAIN?.trim().replace(/^\./, '');
  if (configuredDomain && (hostname === configuredDomain || hostname.endsWith(`.${configuredDomain}`))) {
    return configuredDomain;
  }

  if (hostname.endsWith('avaliasolar.com.br')) {
    return 'avaliasolar.com.br';
  }

  return undefined;
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
    group: (groupType, groupKey, properties = {}) => {
      if (typeof posthogInstance.group !== 'function') return;
      posthogInstance.group(
        groupType,
        groupKey,
        sanitizeAnalyticsProperties(properties) as Record<string, unknown>
      );
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

function getTrafficActorClass(): string {
  if (typeof window === 'undefined') return 'unknown';
  if (
    localStorage.getItem('is_internal_team') === 'true' ||
    localStorage.getItem('is_admin_user') === 'true' ||
    localStorage.getItem('is_employee_user') === 'true'
  ) return 'internal_staff';
  return 'unknown';
}

/**
 * Rastreia pageviews automaticamente em todas as rotas do Next.js App Router.
 * Usa pathname lógico; mudanças apenas na query não criam nova pageview.
 */
function PostHogPageView({ posthog }: { posthog: any }) {
  const pathname = usePathname();
  const capturedPathRef = useRef<string | null>(null);
  const [consentVersion, setConsentVersion] = useState(0);

  useEffect(() => onConsentChange(() => setConsentVersion((value) => value + 1)), []);

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

    if (!hasAnalyticsConsent() || capturedPathRef.current === pathname) return;

    const url = window.location.origin + pathname;

    posthog.capture('$pageview', {
      $current_url: url,
      ...getPageAnalyticsProperties(pathname),
      schema_version: '3.0.0',
      event_origin: 'frontend',
      producer: 'web.posthog',
      surface_kind: getSurfaceKind(pathname),
      traffic_actor_class: getTrafficActorClass(),
    });
    capturedPathRef.current = pathname;

    if (process.env.NODE_ENV === 'development') {
      console.log('[PostHog] $pageview:', url);
    }
  }, [pathname, posthog, consentVersion]);

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

          const isMobile =
            typeof window !== 'undefined' && window.matchMedia
              ? window.matchMedia('(max-width: 767px)').matches
              : false;
          const navConn = (navigator as NavigatorWithConnection).connection;
          const isSaveData = navConn?.saveData === true;
          const isSlowConn = ['slow-2g', '2g', '3g'].includes(navConn?.effectiveType ?? '');
          const shouldEnableRecording = hasConsent && !isMobile && !isSaveData && !isSlowConn;

          posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            cross_subdomain_cookie: Boolean(getPostHogCookieDomain()),
            // @ts-ignore
            cookie_domain: getPostHogCookieDomain(),

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

              const distinctId = ph.get_distinct_id();
              const sessionId = ph.get_session_id();
              // Monitoring tags are optional; do not eagerly bundle Sentry into the
              // global analytics provider on every public route.
              if (distinctId || sessionId) {
                void import('@sentry/nextjs')
                  .then((sentry) => {
                    if (distinctId) sentry.setTag('posthog_distinct_id', distinctId);
                    if (sessionId) sentry.setTag('posthog_session_id', sessionId);
                  })
                  .catch(() => undefined);
              }

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
