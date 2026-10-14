'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { SURFACE_ORIGINS, buildCanonicalUrl } from '@/lib/routing/surface-origins';

export default function NotificationsRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user?.role === 'review') {
      router.replace('/review-dashboard/notifications');
    } else {
      const isCrossSurface =
        typeof window !== 'undefined' && window.location.origin !== SURFACE_ORIGINS.company;
      if (isCrossSurface) {
        window.location.replace(buildCanonicalUrl('company_app', '/dashboard/notifications'));
      } else {
        router.replace('/dashboard/notifications');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
