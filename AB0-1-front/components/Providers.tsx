'use client';

import { useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { QueryProvider } from '@/lib/QueryProvider';
import { Context7Provider } from '@/app/context7/provider';
import { ApolloProvider } from '@apollo/client/react';
import { getApolloClient } from '@/lib/apollo-client';

// Lazy load heavy client-side modals and floating components
const QuoteWizardModal = dynamic(() => import('@/components/QuoteWizardModal'), { ssr: false });
const QuickLeadModal = dynamic(() => import('@/components/QuickLeadModal'), { ssr: false });
const DynamicLeadWizardModal = dynamic(() => import('@/components/DynamicLeadWizardModal'), {
  ssr: false,
});
const SignupGateModalHost = dynamic(() => import('@/components/SignupGateModalHost'), {
  ssr: false,
});
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false });
const MobiVoltSuccessWidget = dynamic(() => import('@/components/chat/MobiVoltSuccessWidget'), {
  ssr: false,
});
const Toaster = dynamic(() => import('@/components/ui/sonner').then((mod) => mod.Toaster), {
  ssr: false,
  loading: () => null,
});

import { hasAnalyticsConsent } from '@/lib/analytics/consent';
import { initializeAnalytics, page } from '@/lib/analytics/lazy';
import { trackUserReturned } from '@/lib/analytics/consolidated';
import { usePathname } from 'next/navigation';
import { setupGlobalErrorHandlers } from '@/lib/error-handler';
import { PostHogProvider } from '@/components/PostHogProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  const apolloClient = getApolloClient();
  const pathname = usePathname();
  const isAppSurface = Boolean(
    pathname?.startsWith('/chat') || pathname?.startsWith('/review-dashboard')
  );
  const analyticsLoadedRef = useRef(false);

  const loadAnalytics = useCallback((reason: string) => {
    if (analyticsLoadedRef.current) return;
    analyticsLoadedRef.current = true;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Lazy init triggered (${reason})`);
    }
    initializeAnalytics();
    page();
  }, []);

  useEffect(() => {
    // Check for returning user
    const lastVisitKey = 'avalia.last_visit_at';
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastVisit = localStorage.getItem(lastVisitKey);

    if (lastVisit && lastVisit !== today) {
      const lastVisitDate = new Date(lastVisit);
      const diffTime = Math.abs(now.getTime() - lastVisitDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Delay to ensure analytics is loaded
      setTimeout(() => {
        trackUserReturned(diffDays);
      }, 3000);
    }

    localStorage.setItem(lastVisitKey, today);
  }, []);

  useEffect(() => {
    const handleInteraction = () => loadAnalytics('interaction');
    window.addEventListener('pointerdown', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    // Load analytics faster if consent is already given to ensure initial page_view is caught
    // For new users without consent, we wait 5s to prioritize initial LCP
    const timeoutDelay = hasAnalyticsConsent() ? 1500 : 5000;
    const timeoutId = window.setTimeout(() => loadAnalytics('timeout'), timeoutDelay);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.clearTimeout(timeoutId);
    };
  }, [loadAnalytics]);

  useEffect(() => {
    // Setup centralized global error handlers (Sentry, etc.)
    setupGlobalErrorHandlers();

    const shouldIgnore = (message: string) =>
      message.includes('The message port closed before a response was received');
    const isStaleServerActionError = (message: string) =>
      /Failed to find Server Action/i.test(message);
    const staleActionReloadKey = 'avalia.stale_server_action_reload_at';
    const tryRecoverStaleServerAction = () => {
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem(staleActionReloadKey) || 0);
      if (now - lastReload < 15_000) return;
      sessionStorage.setItem(staleActionReloadKey, String(now));
      window.location.reload();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMessage =
        typeof event.reason === 'object' && event.reason !== null && 'message' in event.reason
          ? event.reason.message
          : event.reason;
      const msg = String(reasonMessage || '');
      if (isStaleServerActionError(msg)) {
        event.preventDefault();
        tryRecoverStaleServerAction();
        return;
      }
      if (shouldIgnore(msg)) {
        console.warn('[Runtime] Ignored browser extension message port error:', msg);
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = String(event.message || '');
      if (isStaleServerActionError(msg)) {
        event.preventDefault();
        tryRecoverStaleServerAction();
        return;
      }
      if (shouldIgnore(msg)) {
        console.warn('[Runtime] Ignored browser extension message port error:', msg);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (!analyticsLoadedRef.current) return;
    page();
  }, [pathname]);

  return (
    <ApolloProvider client={apolloClient}>
      <PostHogProvider>
        <QueryProvider>
          <Context7Provider>
            <AuthProvider>
              <CompanyProvider>
                {children}
                <QuoteWizardModal />
                <QuickLeadModal />
                <DynamicLeadWizardModal />
                <SignupGateModalHost />
                <Toaster />
                {!isAppSurface && <CookieConsent />}
                {process.env.NEXT_PUBLIC_CHAT_ENABLED !== 'false' &&
                  !isAppSurface &&
                  (pathname?.startsWith('/dashboard') ? <MobiVoltSuccessWidget /> : <ChatWidget />)}
              </CompanyProvider>
            </AuthProvider>
          </Context7Provider>
        </QueryProvider>
      </PostHogProvider>
    </ApolloProvider>
  );
}
