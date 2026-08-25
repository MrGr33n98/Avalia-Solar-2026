'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import { getGroups } from '@/lib/api/groups';
import { GroupCard, GroupCardSkeleton } from './GroupCard';
import { GroupsSidebar } from './GroupsSidebar';

const views = [
  { value: undefined, label: 'Todas' },
  { value: 'featured' as const, label: 'Destaques' },
  { value: 'new' as const, label: 'Novas' },
];

export function GroupsDiscovery() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<(typeof views)[number]['value']>();
  const [category, setCategory] = useState<number>();
  const deferredSearch = useDeferredValue(search);
  const groupsQuery = useQuery({
    queryKey: ['groups', { search: deferredSearch, view, category }],
    queryFn: () => getGroups({ search: deferredSearch || undefined, view, category }),
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <GroupsSidebar selectedCategory={category} onCategorySelect={setCategory} />
        <div className="min-w-0">
          <header className="mb-7">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700"><Sparkles className="h-4 w-4" aria-hidden="true" />Comunidades Avalia Solar</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Encontre seu grupo</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Descubra comunidades com conversas relevantes sobre energia solar e mobilidade elétrica.</p>
          </header>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Buscar comunidades</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar comunidades" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
            </label>
            <div className="flex shrink-0 gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar comunidades">
              {views.map((item) => (
                <button key={item.label} type="button" onClick={() => setView(item.value)} aria-pressed={view === item.value} className={`min-h-11 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${view === item.value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <section id="groups-list" aria-labelledby="groups-list-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="groups-list-title" className="text-xl font-bold text-slate-950">{view === 'featured' ? 'Destaques' : 'Descobrir comunidades'}</h2>
              {!groupsQuery.isLoading && groupsQuery.data && <span className="text-sm text-slate-500">{groupsQuery.data.length} comunidades</span>}
            </div>

            {groupsQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <GroupCardSkeleton key={index} />)}</div>
            ) : groupsQuery.isError ? (
              <div className="rounded-2xl border border-red-200 bg-white p-6 text-center"><p className="font-semibold text-slate-900">Não foi possível carregar as comunidades.</p><button type="button" onClick={() => groupsQuery.refetch()} className="mt-4 min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Tentar novamente</button></div>
            ) : groupsQuery.data?.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groupsQuery.data.map((group) => <GroupCard key={group.id} group={group} />)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="text-lg font-bold text-slate-900">Nenhum grupo encontrado</h3><p className="mt-2 text-sm text-slate-600">Tente outra busca ou explore todas as comunidades.</p><button type="button" onClick={() => { setSearch(''); setView(undefined); setCategory(undefined); }} className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Limpar filtros</button></div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}