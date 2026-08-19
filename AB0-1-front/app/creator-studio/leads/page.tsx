'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { leadsApi, type Lead } from '@/lib/api';

export default function CreatorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void leadsApi.mine()
      .then(setLeads)
      .catch(() => setError('Não foi possível carregar seus leads.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-violet-600">Creator Studio</p>
        <h2 className="mt-1 text-3xl font-bold">Leads</h2>
        <p className="mt-2 text-sm text-slate-600">O endpoint existente de leads continua sendo reutilizado nesta primeira separação de domínio.</p>
      </div>
      {loading ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Carregando leads...</p> : error ? <p className="rounded-xl bg-red-50 p-6 text-sm text-red-700">{error}</p> : leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-violet-600" />
          <h3 className="mt-3 font-bold">Nenhum lead disponível</h3>
          <p className="mt-1 text-sm text-slate-500">Ative captura no seu perfil público para receber oportunidades.</p>
          <Link href="/creator-studio/profile" className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Configurar perfil</Link>
        </div>
      ) : (
        <div className="space-y-3">{leads.map((lead) => <article key={lead.id} className="rounded-xl border border-slate-200 bg-white p-5"><p className="font-bold">{lead.name || 'Lead'}</p><p className="mt-1 text-sm text-slate-500">{lead.status || 'Recebido'}</p></article>)}</div>
      )}
    </div>
  );
}
