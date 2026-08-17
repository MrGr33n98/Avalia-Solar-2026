import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { publicCategoriesApi } from '@/lib/api-public';
import type { CategorySolutionType } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';
import CategoryVisualAsset from '@/components/categories/CategoryVisualAsset';

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await publicCategoriesApi.getBySlug(params.slug, { revalidate: 1800 });
  if (!category) return { title: 'Tipos de soluções | Avalia Solar', robots: { index: false, follow: true } };
  return {
    title: `Tipos de soluções de ${category.name} | Avalia Solar`,
    description: `Conheça os tipos de soluções disponíveis em ${category.name} e compare opções para o seu projeto.`,
    alternates: { canonical: absoluteUrl(`/categories/${params.slug}/solutions`) },
  };
}

export default async function CategorySolutionsPage({ params }: { params: { slug: string } }) {
  const category = await publicCategoriesApi.getBySlug(params.slug, { revalidate: 1800 });
  if (!category) return <main className="mx-auto max-w-5xl px-5 py-16">Categoria não encontrada.</main>;

  const solutions = category.solution_types?.length
    ? category.solution_types
    : await publicCategoriesApi.getSolutionTypes(category.id, { revalidate: 1800 });

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-[1240px] px-5 py-10 md:py-14">
        <nav className="mb-6 text-sm text-slate-500"><Link href="/categories" className="hover:text-blue-600">Categorias</Link> <span className="px-2">›</span> {category.name}</nav>
        <header className="mb-8 max-w-3xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-blue-600">DECISÃO POR TECNOLOGIA</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Tipos de soluções</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Entenda as principais tecnologias de {category.name.toLowerCase()} e encontre a opção mais adequada ao seu projeto.</p>
        </header>

        {solutions.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Ainda não há tipos de soluções cadastrados para esta categoria.</section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution: CategorySolutionType, index) => (
              <article key={solution.id} className="group flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative mb-4 h-36 overflow-hidden rounded-xl bg-slate-50"><CategoryVisualAsset category={{ name: solution.name, slug: solution.slug, seo_url: solution.slug, icon_url: null, visual_key: solution.visual_key }} priority={index < 3} /></div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">{String(index + 1).padStart(2, '0')}</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{solution.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{solution.short_description || solution.description || 'Consulte empresas especializadas e compare esta solução para o seu contexto.'}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">{(solution.use_cases || []).slice(0, 3).map((useCase) => <span key={useCase} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{useCase}</span>)}</div>
                <Link href={`/categories/${params.slug}/compare?solutions=${encodeURIComponent(solution.slug)}`} className="mt-5 inline-flex min-h-11 items-center justify-between rounded-xl border border-blue-200 px-4 text-sm font-bold text-blue-700 hover:bg-blue-50">Comparar soluções <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3"><Link href={`/categories/${params.slug}/compare`} className="min-h-11 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Comparar opções</Link><Link href={`/categories/${params.slug}/matching`} className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-blue-300">Encontrar empresas</Link></div>
      </div>
    </main>
  );
}
