'use client';

import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles } from 'lucide-react';

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
    queryKey: [
      'groups',
      {
        search: deferredSearch,
        view,
        category,
      },
    ],
    queryFn: () =>
      getGroups({
        search: deferredSearch || undefined,
        view,
        category,
      }),
  });

  const groups = groupsQuery.data ?? [];

  const title =
    view === 'featured'
      ? 'Comunidades em destaque'
      : view === 'new'
        ? 'Novas comunidades'
        : 'Encontre seu grupo';

  const sectionTitle =
    view === 'featured'
      ? 'Destaques'
      : view === 'new'
        ? 'Novas comunidades'
        : 'Descobrir comunidades';

  const resetFilters = () => {
    setSearch('');
    setView(undefined);
    setCategory(undefined);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-7">
          <GroupsSidebar
            selectedCategory={category}
            onCategorySelect={setCategory}
          />

          <div className="min-w-0">
            {/* HERO / PAGE INTRO */}
            <header className="mb-6 sm:mb-7">
              <div className="flex flex-col gap-2">
                <p className="inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700 sm:text-xs">
                  <Sparkles
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  Comunidades Avalia Solar
                </p>

                <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] text-slate-950 sm:text-3xl lg:text-[34px]">
                  {title}
                </h1>

                <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Descubra comunidades com conversas relevantes sobre energia
                  solar e mobilidade elétrica.
                </p>
              </div>
            </header>

            {/* DISCOVERY TOOLBAR */}
            <div className="mb-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {/* Search */}
                <label className="relative block min-w-0 flex-1">
                  <span className="sr-only">Buscar comunidades</span>

                  <Search
                    className="
                      pointer-events-none
                      absolute left-4 top-1/2
                      h-[18px] w-[18px]
                      -translate-y-1/2
                      text-slate-400
                      sm:h-5 sm:w-5
                    "
                    aria-hidden="true"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar comunidades"
                    autoComplete="off"
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border border-slate-200
                      bg-white
                      pl-11 pr-4
                      text-[15px]
                      text-slate-900
                      shadow-[0_1px_2px_rgba(15,23,42,0.03)]
                      outline-none
                      transition-all
                      duration-200
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-500/10
                      sm:pl-12
                    "
                  />
                </label>

                {/* Filter chips */}
                <div
                  className="
                    -mx-1 flex
                    shrink-0
                    gap-2
                    overflow-x-auto
                    px-1 pb-1
                    md:mx-0 md:overflow-visible md:px-0 md:pb-0
                  "
                  role="group"
                  aria-label="Filtrar comunidades"
                >
                  {views.map((item) => {
                    const active = view === item.value;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setView(item.value)}
                        aria-pressed={active}
                        className={`
                          inline-flex
                          h-11
                          shrink-0
                          items-center
                          justify-center
                          whitespace-nowrap
                          rounded-xl
                          border
                          px-4
                          text-sm
                          font-semibold
                          transition-all
                          duration-200
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-blue-600
                          focus-visible:ring-offset-2
                          ${
                            active
                              ? `
                                border-blue-600
                                bg-blue-600
                                text-white
                                shadow-[0_4px_12px_rgba(37,99,235,0.18)]
                              `
                              : `
                                border-slate-200
                                bg-white
                                text-slate-700
                                hover:border-blue-200
                                hover:bg-blue-50/40
                                hover:text-blue-700
                              `
                          }
                        `}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LIST */}
            <section
              id="groups-list"
              aria-labelledby="groups-list-title"
              className="min-w-0"
            >
              <div className="mb-4 flex min-w-0 items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    id="groups-list-title"
                    className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl"
                  >
                    {sectionTitle}
                  </h2>
                </div>

                {!groupsQuery.isLoading && !groupsQuery.isError && (
                  <span className="shrink-0 text-xs font-medium text-slate-500 sm:text-sm">
                    {groups.length}{' '}
                    {groups.length === 1 ? 'comunidade' : 'comunidades'}
                  </span>
                )}
              </div>

              {/* Loading */}
              {groupsQuery.isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, index) => (
                    <GroupCardSkeleton key={index} />
                  ))}
                </div>
              ) : groupsQuery.isError ? (
                /* Error */
                <div
                  className="
                    rounded-2xl
                    border border-red-200
                    bg-white
                    px-5 py-8
                    text-center
                    shadow-sm
                    sm:px-6
                  "
                  role="alert"
                >
                  <p className="text-base font-semibold text-slate-900">
                    Não foi possível carregar as comunidades.
                  </p>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Tente novamente. Se o problema persistir, aguarde alguns
                    instantes.
                  </p>

                  <button
                    type="button"
                    onClick={() => groupsQuery.refetch()}
                    className="
                      mt-5
                      inline-flex h-11
                      items-center justify-center
                      rounded-xl
                      border border-slate-200
                      bg-white
                      px-5
                      text-sm
                      font-semibold
                      text-blue-700
                      transition-colors
                      hover:border-blue-200
                      hover:bg-blue-50
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-blue-600
                      focus-visible:ring-offset-2
                    "
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : groups.length > 0 ? (
                /* Results */
                <div
                  className="
                    grid
                    min-w-0
                    gap-4
                    sm:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              ) : (
                /* Empty */
                <div
                  className="
                    rounded-2xl
                    border border-dashed border-slate-300
                    bg-white
                    px-5 py-9
                    text-center
                    shadow-sm
                    sm:px-8 sm:py-10
                  "
                >
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">
                    Nenhum grupo encontrado
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Tente ajustar sua busca, trocar a categoria ou explorar
                    todas as comunidades.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="
                      mt-5
                      inline-flex h-11
                      items-center justify-center
                      rounded-xl
                      bg-blue-600
                      px-5
                      text-sm
                      font-semibold
                      text-white
                      shadow-[0_4px_12px_rgba(37,99,235,0.18)]
                      transition-all
                      hover:bg-blue-700
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-blue-600
                      focus-visible:ring-offset-2
                    "
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}