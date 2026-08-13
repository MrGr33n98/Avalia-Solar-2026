'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/review-dashboard');
  }, [router]);

  return null;
}
