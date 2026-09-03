'use client';

import { useParams } from 'next/navigation';
import Company360View from '@/components/sales/Company360View';

export default function SalesAccountPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return <main className="p-8 text-sm text-red-700">Empresa inválida.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <Company360View accountId={accountId} openByDefault />
    </main>
  );
}
