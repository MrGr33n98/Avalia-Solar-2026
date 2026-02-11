'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EnterpriseDashboard from '../components/EnterpriseDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';

const parseCompanyId = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export default function CompanyDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const {
    activeCompany,
    companies,
    selectCompany,
    isLoading: companyLoading,
  } = useCompanyContext();

  const requestedCompanyIdParam = searchParams.get('company_id');
  const requestedCompanyId = useMemo(
    () => parseCompanyId(requestedCompanyIdParam),
    [requestedCompanyIdParam]
  );

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || companyLoading) return;

    if (!user) {
      router.push('/login?return_to=%2Fdashboard%2Fcompany');
      setCompanyId(null);
      setLoading(false);
      return;
    }

    if (user.role === 'review') {
      router.push('/review-dashboard');
      setCompanyId(null);
      setLoading(false);
      return;
    }

    if (!Array.isArray(companies) || companies.length === 0) {
      setCompanyId(null);
      setLoading(false);
      router.push('/select-company');
      return;
    }

    const companyFromQuery = requestedCompanyId
      ? companies.find((company) => Number(company.id) === requestedCompanyId)
      : null;

    const companyFromContext = activeCompany
      ? companies.find((company) => Number(company.id) === Number(activeCompany.id))
      : null;

    const resolvedCompany = companyFromQuery || companyFromContext || companies[0] || null;

    if (!resolvedCompany) {
      setCompanyId(null);
      setLoading(false);
      router.push('/select-company');
      return;
    }

    const syncSelection = async () => {
      if (!activeCompany || Number(activeCompany.id) !== Number(resolvedCompany.id)) {
        try {
          await selectCompany(resolvedCompany);
        } catch (error) {
          console.warn('[CompanyDashboardPage] Failed to sync active company selection', error);
        }
      }

      setCompanyId(String(resolvedCompany.id));
      setLoading(false);
    };

    void syncSelection();
  }, [
    authLoading,
    companyLoading,
    user,
    companies,
    activeCompany,
    requestedCompanyId,
    selectCompany,
    router,
  ]);

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
          <p className="text-sm text-muted-foreground">Nenhuma empresa associada a sua conta.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando painel...</div>}>
      <EnterpriseDashboard companyId={companyId} />
    </Suspense>
  );
}
