'use client';

import { useState } from 'react';
import Link from 'next/link';
import { publicCategoriesApi } from '@/lib/api-public';
import type { CategorySolutionType, Company } from '@/lib/api';

type Match = { company: Company; score: number; score_band: string; reason_codes: string[]; reason_labels: string[]; sponsored: boolean };

type Props = {
  categoryId: number;
  categoryName: string;
  slug: string;
  solutionTypes: CategorySolutionType[];
  initialContext: { solution: string; application: string; state: string; city: string };
};

export default function MatchingResults({ categoryId, categoryName, slug, solutionTypes, initialContext }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sponsored, setSponsored] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const response = await publicCategoriesApi.matchCompanies(categoryId, {
        solution_type: String(data.get('solution') || ''),
        application: String(data.get('application') || ''),
        location: { state: String(data.get('state') || ''), city: String(data.get('city') || '') },
      });
      setMatches(response.matches as Match[]);
      setSponsored(response.sponsored as Match[]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar as empresas.');
    } finally {
      setLoading(false);
    }
  }

  const renderMatch = (match: Match) => (
    <article key={match.company.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-950">{match.company.name}</h2><p className="mt-1 text-sm text-slate-500">{[match.company.city, match.company.state].filter(Boolean).join(' · ')}</p></div><strong className="rounded-xl bg-emerald-50 px-3 py-2 text-lg text-emerald-700">{match.score}%</strong></div>
      <p className="mt-3 text-sm font-semibold text-slate-700">Compatibilidade {match.score_band}</p>
      <div className="mt-3 flex flex-wrap gap-2">{match.reason_labels.map((reason) => <span key={reason} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{reason}</span>)}</div>
      <div className="mt-5 flex gap-3"><Link href={`/companies/${match.company.slug || match.company.id}`} className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white">Ver perfil</Link><Link href={`/quote-wizard?company_id=${match.company.id}&category_id=${categoryId}`} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700">Solicitar orçamento</Link></div>
    </article>
  );

  return <div className="min-h-screen bg-slate-50/50"><div className="mx-auto max-w-[1240px] px-5 py-10 md:py-14"><Link href={`/categories/${slug}/solutions`} className="text-sm font-semibold text-blue-700">← Tipos de soluções</Link><h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950">Empresas para seu projeto</h1><p className="mt-3 max-w-2xl text-slate-600">Encontre empresas compatíveis com a solução, localização e características selecionadas para {categoryName}.</p><form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4"><label className="text-sm font-semibold">Solução<select name="solution" defaultValue={initialContext.solution} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="">Qualquer solução</option>{solutionTypes.map((solution) => <option key={solution.slug} value={solution.slug}>{solution.name}</option>)}</select></label><label className="text-sm font-semibold">Aplicação<input name="application" defaultValue={initialContext.application} placeholder="Ex.: condomínio" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" /></label><label className="text-sm font-semibold">Estado<input name="state" defaultValue={initialContext.state} placeholder="Ex.: SC" maxLength={2} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 uppercase" /></label><label className="text-sm font-semibold">Cidade<input name="city" defaultValue={initialContext.city} placeholder="Ex.: Florianópolis" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" /></label><button disabled={loading} className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-60 md:col-span-4 md:w-fit">{loading ? 'Calculando compatibilidade…' : 'Encontrar empresas'}</button></form>{error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}{sponsored.length > 0 && <section className="mt-8"><h2 className="mb-4 text-xl font-bold text-slate-950">Empresas patrocinadas</h2><div className="grid gap-4 md:grid-cols-2">{sponsored.map(renderMatch)}</div></section>}{matches.length > 0 && <section className="mt-8"><h2 className="mb-4 text-xl font-bold text-slate-950">Empresas compatíveis</h2><div className="grid gap-4 md:grid-cols-2">{matches.map(renderMatch)}</div></section>}{matches.length === 0 && !loading && !error && <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600"><p className="font-semibold">O matching será calculado pelo backend com dados reais.</p><p className="mt-2 text-sm">Envie os critérios acima para consultar empresas compatíveis.</p></section>}</div></div>;
}
