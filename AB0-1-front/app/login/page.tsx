'use client';

import AuthModal from '@/app/(auth)/components/AuthModal';
import { Suspense } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';

function LoginPageContent() {
  // GTM Page Tracking
  usePageTracking({
    type: 'auth',
    title: 'Login - Avalia Solar',
  });

  return <AuthModal initialTab="login" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
