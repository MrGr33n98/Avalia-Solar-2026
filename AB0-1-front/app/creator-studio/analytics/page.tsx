'use client';

import Link from 'next/link';
import { LineChart } from 'lucide-react';

export default function CreatorAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">Creator Studio</p>
        <h2 className="mt-1 text-3xl font-bold">Analytics</h2>
        <p className="mt-2 text-sm text-slate-600">Área reservada para métricas públicas Creator. Nenhum endpoint novo foi criado nesta etapa.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <LineChart className="mx-auto h-9 w-9 text-blue-600" />
        <h3 className="mt-3 font-bold">Analytics Creator em preparação</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Métricas existentes continuam disponíveis pelas superfícies atuais. Esta rota estabelece fronteira de gestão sem duplicar API.</p>
        <Link href="/creator-studio/tree" className="mt-4 inline-flex rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700">Ver métricas do Tree</Link>
      </div>
    </div>
  );
}
