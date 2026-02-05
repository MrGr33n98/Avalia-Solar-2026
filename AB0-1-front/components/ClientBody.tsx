'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { QueryProvider } from '@/lib/QueryProvider';
import { Context7Provider } from '@/app/context7/provider';

// Lazy load heavy client-side modals and floating components
const QuoteWizardModal = dynamic(() => import('@/components/QuoteWizardModal'), { ssr: false });
const QuickLeadModal = dynamic(() => import('@/components/QuickLeadModal'), { ssr: false });
const ComparisonFloatingBar = dynamic(() => import('@/components/ComparisonFloatingBar'), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });

import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { initializeAnalytics, page } from '@/lib/analytics';
import { usePathname } from 'next/navigation';

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    const shouldIgnore = (message: string) =>
      message.includes('The message port closed before a response was received');

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String((event.reason as any)?.message || event.reason || '');
      if (shouldIgnore(msg)) {
        console.warn('[Runtime] Ignored browser extension message port error:', msg);
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = String(event.message || '');
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
    page();
  }, [pathname]);

  return (
    <QueryProvider>
      <Context7Provider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <CompanyProvider>
              {children}
              <QuoteWizardModal />
              <QuickLeadModal />
              <ComparisonFloatingBar />
              <Toaster />
              <CookieConsent />
            </CompanyProvider>
          </AuthProvider>
        </ThemeProvider>
      </Context7Provider>
    </QueryProvider>
  );
}
