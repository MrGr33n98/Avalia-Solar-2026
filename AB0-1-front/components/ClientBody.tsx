'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import QuoteWizardModal from '@/components/QuoteWizardModal';

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        {children}
        <QuoteWizardModal />
      </AuthProvider>
    </ThemeProvider>
  );
}
