'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { QueryProvider } from '@/lib/QueryProvider';
import { Context7Provider } from '@/app/context7/provider';
import QuoteWizardModal from '@/components/QuoteWizardModal';
import QuickLeadModal from '@/components/QuickLeadModal';
import ComparisonFloatingBar from '@/components/ComparisonFloatingBar';
import { Toaster } from '@/components/ui/sonner';
import { CookieConsent } from '@/components/CookieConsent';
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
