'use client';

import AuthModal from '@/app/(auth)/components/AuthModal';
import { Suspense } from 'react';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthModal initialTab="register" />
    </Suspense>
  );
}
