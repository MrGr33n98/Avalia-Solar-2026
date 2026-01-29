'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/lib/QueryProvider';
import { Context7Provider } from '@/app/context7/provider';
import QuoteWizardModal from '@/components/QuoteWizardModal';
import QuickLeadModal from '@/components/QuickLeadModal';
import ComparisonFloatingBar from '@/components/ComparisonFloatingBar';
import { Toaster } from '@/components/ui/sonner';

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <Context7Provider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
                    {children}
                    <QuoteWizardModal />
                    <QuickLeadModal />
                    <ComparisonFloatingBar />
                    <Toaster />
                  </AuthProvider>
        </ThemeProvider>
      </Context7Provider>
    </QueryProvider>
  );
}
