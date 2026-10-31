'use client';

import { useParams } from 'next/navigation';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import Account360Content from '@/components/sales/companies/Account360Content';

export default function SalesAccountPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return (
      <SalesLayoutWrapper>
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center max-w-md mx-auto shadow-2xs">
            <p className="text-sm font-bold text-red-700">Identificador de empresa inválido.</p>
          </div>
        </main>
      </SalesLayoutWrapper>
    );
  }

  return (
    <SalesLayoutWrapper>
      <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Account360Content accountId={accountId} mode="full_page" />
        </div>
      </main>
    </SalesLayoutWrapper>
  );
}
