'use client';

import AuthModal from '@/app/(auth)/components/AuthModal';
import { Suspense } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';

export default function LoginPage() {
  // GTM Page Tracking
  usePageTracking({
    type: 'auth',
    title: 'Login - Avalia Solar',
  });

  return (
    <Suspense fallback={null}>
      <AuthModal initialTab="login" />
    </Suspense>
  );
}
