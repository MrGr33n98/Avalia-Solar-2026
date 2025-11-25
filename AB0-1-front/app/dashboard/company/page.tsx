'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EnterpriseDashboard from '../components/EnterpriseDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const cid = user?.company_id;
    if (cid) {
      setCompanyId(String(cid));
    } else {
      setCompanyId(null);
    }
    setLoading(false);
  }, [authLoading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Nenhuma empresa associada à sua conta.</p>
        </div>
      </div>
    );
  }

  return <EnterpriseDashboard companyId={companyId} />;
}
