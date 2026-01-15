'use client';

import AuthModal from '@/app/(auth)/components/AuthModal';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthModal initialTab="login" />
    </Suspense>
  );
}
