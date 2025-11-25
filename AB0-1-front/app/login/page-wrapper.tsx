'use client';

import { Suspense } from 'react';
import { LoginPageContent } from './LoginPageContent';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading login page...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}