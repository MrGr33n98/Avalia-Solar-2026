import type { Metadata } from 'next';
import Link from 'next/link';
import { publicCategoriesApi } from '@/lib/api-public';
import CategoryVisualAsset from '@/components/categories/CategoryVisualAsset';

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await publicCategoriesApi.getBySlug(params.slug, { revalidate: 1800 });
  return { title: category ? `Compare soluções de ${category.name} | Avalia Solar` : 'Comparar soluções | Avalia Solar', robots: { index: false, follow: true } };
}

export default async function CategoryComparePage({ params, searchParams }: { params: { slug: string }; searchParams: { solutions?: string | string[] } }) {
  const category = await publicCategoriesApi.getBySlug(params.slug, { revalidate: 1800 });
  if (!category) return <main className="mx-auto max-w-5xl px-5 py-16">Categoria não encontrada.</main>;
  const allSolutions = category.solution_types?.length ? category.solution_types : await publicCategoriesApi.getSolutionTypes(category.id, { revalidate: 1800 });
  const selectedSlugs = String(Array.isArray(searchParams.solutions) ? searchParams.solutions.join(',') : searchParams.solutions || '').split(',').map((slug) => slug.trim()).filter(Boolean).slice(0, 3);
  const selected = selectedSlugs.length ? allSolutions.filter((solution) => selectedSlugs.includes(solution.slug)) : allSolutions.slice(0, 3);
  const schemaKeys = Array.from(new Set(selected.flatMap((solution) => Object.keys(solution.attributes || {}))));

  return (
    <main className="min-h-screen bg-slate-50/50"><div className="mx-auto max-w-[1240px] px-5 py-10 md:py-14"><Link href={`/categories/${params.slug}/solutions`} className="text-sm font-semibold text-blue-700">← Tipos de soluções</Link><h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950">Compare soluções e escolha a ideal</h1><p className="mt-3 text-slate-600">Análise baseada nos atributos cadastrados para {category.name}. Não há recomendação automática sem critérios suficientes.</p>
      {selected.length === 0 ? <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">Nenhuma solução disponível para comparação.</section> : <section className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="min-w-[720px] grid" style={{ gridTemplateColumns: `220px repeat(${selected.length}, minmax(220px, 1fr))` }}><div className="border-b border-slate-200 p-4 font-bold text-slate-700">Solução</div>{selected.map((solution) => <div key={solution.id} className="border-b border-l border-slate-200 p-4"><div className="relative mb-3 h-28 rounded-xl bg-slate-50"><CategoryVisualAsset category={{ name: solution.name, slug: solution.slug, seo_url: solution.slug, icon_url: null, visual_key: solution.visual_key }} /></div><h2 className="font-bold text-slate-950">{solution.name}</h2><p className="mt-1 text-sm text-slate-600">{solution.short_description || solution.description || 'Sem descrição cadastrada.'}</p></div>)}{schemaKeys.map((key) => <div key={key} className="contents"><div className="border-b border-slate-200 p-4 text-sm font-semibold text-slate-700">{key.replace(/_/g, ' ')}</div>{selected.map((solution) => <div key={`${solution.id}-${key}`} className="border-b border-l border-slate-200 p-4 text-sm text-slate-600">{formatValue(solution.attributes?.[key])}</div>)}</div>)}</div></section>}
      <p className="mt-4 text-xs text-slate-500">Os valores disponíveis podem variar conforme fabricante, modelo e requisitos do projeto.</p><div className="mt-8 flex gap-3"><Link href={`/categories/${params.slug}/matching`} className="min-h-11 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">Encontrar empresas</Link><Link href={`/categories/${params.slug}/solutions`} className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700">Alterar soluções</Link></div></div></main>
  );
}

function formatValue(value: unknown) { if (value === null || value === undefined || value === '') return 'Não informado'; if (Array.isArray(value)) return value.join(' – '); if (typeof value === 'object') return JSON.stringify(value); return String(value); }
