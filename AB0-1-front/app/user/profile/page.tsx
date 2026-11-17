'use client';

import React, { Suspense } from 'react';
import {
  UserProfileContent,
  UserProfileLoading,
} from '@/components/user-profile/UserProfilePageContent';

export default function UserProfilePage() {
  // useSearchParams() vive dentro de UserProfileShell; o Next.js 14 exige Suspense
  // em torno dessa subárvore para a pré-renderização estática.
  return (
    <Suspense fallback={<UserProfileLoading />}>
      <UserProfileContent />
    </Suspense>
  );
}
