'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();
  const { activeCompany, isLoading: companyLoading } = useCompanyContext();

  useEffect(() => {
    if (authLoading || companyLoading) return;

    if (!user) {
      router.replace('/login?return_to=%2Fdashboard');
      return;
    }

    if (user.role === 'review') {
      router.replace('/review-dashboard');
      return;
    }

    if (!activeCompany) {
      router.replace('/select-company');
      return;
    }

    // Redireciona para a nova página de overview
    router.replace('/dashboard/overview');
  }, [activeCompany, authLoading, companyLoading, router, user]);

  if (authError) {
    return (
      <div className="flex h-[80vh] items-center justify-center px-4">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Erro ao carregar sessao</CardTitle>
            <CardDescription>
              Nao foi possivel validar sua sessao. Tente recarregar o dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Recarregar Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
