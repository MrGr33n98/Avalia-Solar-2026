'use client';

import React, { Suspense } from 'react';
import {
  UserProfileContent,
  UserProfileLoading,
} from '@/components/user-profile/UserProfilePageContent';

/**
 * Canonical reviewer profile.
 * The parent /review-dashboard layout owns the sidebar and mobile navigation.
 * UserProfileShell handles only content; Suspense isolates useSearchParams.
 */
export default function ReviewerProfilePage() {
  return (
    <Suspense fallback={<UserProfileLoading />}>
      <UserProfileContent />
    </Suspense>
  );
}
