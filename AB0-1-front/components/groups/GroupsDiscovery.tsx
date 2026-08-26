'use client';

import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

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
  const [view, setView] =
    useState<(typeof views)[number]['value']>();

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

  const pageTitle =
    view === 'featured'
      ? 'Comunidades em destaque'
      : view === 'new'
        ? 'Novas comunidades'
        : 'Encontre seu grupo';

  const pageDescription =
    view === 'featured'
      ? 'Descubra comunidades que estão ganhando relevância no ecossistema de energia.'
      : view === 'new'
        ? 'Conheça as comunidades mais recentes da rede Avalia Solar.'
        : 'Conecte-se a profissionais, empresas e especialistas em energia solar e mobilidade elétrica.';

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
      <div
        className="
          mx-auto
          w-full
          max-w-[1320px]
          px-4
          py-5
          sm:px-6
          sm:py-6
          lg:px-8
          lg:py-8
        "
      >
        <div
          className="
            grid
            min-w-0
            gap-5
            lg:grid-cols-[220px_minmax(0,1fr)]
            xl:gap-7
          "
        >
          <GroupsSidebar
            selectedCategory={category}
            onCategorySelect={setCategory}
          />

          <div className="min-w-0">
            {/* =========================================================
                PREMIUM DISCOVERY HERO
            ========================================================== */}

            <section
              aria-labelledby="groups-discovery-title"
              className="
                relative
                mb-5
                overflow-hidden
                rounded-[18px]
                border
                border-slate-200/70
                bg-[#07152f]
                shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.06)]
                sm:mb-6
              "
            >
              {/* Brand background */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute inset-0
                  bg-[radial-gradient(circle_at_82%_10%,rgba(37,99,235,0.24),transparent_30%),linear-gradient(115deg,#071326_0%,#0B2148_54%,#07142D_100%)]
                "
              />

              {/* Fine dot texture */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute inset-0
                  opacity-[0.045]
                "
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.95) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Avalia Solar origami brand shape */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -right-10
                  top-1/2
                  hidden
                  -translate-y-1/2
                  select-none
                  opacity-[0.10]
                  sm:block
                  lg:right-2
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 340 340"
                  className="
                    h-[230px]
                    w-[230px]
                    rotate-[8deg]
                    lg:h-[270px]
                    lg:w-[270px]
                  "
                >
                  <defs>
                    <linearGradient
                      id="groupsDiscoveryGold"
                      x1="20"
                      y1="45"
                      x2="275"
                      y2="230"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="#FFE08A" />
                      <stop offset="0.52" stopColor="#F6B91A" />
                      <stop offset="1" stopColor="#F59E0B" />
                    </linearGradient>

                    <linearGradient
                      id="groupsDiscoveryBlue"
                      x1="145"
                      y1="115"
                      x2="275"
                      y2="332"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor="#2563EB" />
                      <stop offset="1" stopColor="#081326" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M15 128 L313 5 L225 334 L174 181 Z"
                    fill="url(#groupsDiscoveryGold)"
                  />
                  <path
                    d="M15 128 L174 181 L141 126 Z"
                    fill="#F59E0B"
                  />
                  <path
                    d="M174 181 L225 334 L226 123 Z"
                    fill="url(#groupsDiscoveryBlue)"
                  />
                  <path
                    d="M141 126 L226 123 L174 181 Z"
                    fill="#155EEF"
                  />
                  <path
                    d="M174 181 L226 123 L210 177 L225 334 Z"
                    fill="#0B2A4A"
                  />
                  <path
                    d="M226 123 L313 5 L174 181 Z"
                    fill="#F6B91A"
                    opacity="0.72"
                  />
                </svg>
              </div>

              {/* Content */}
              <div
                className="
                  relative z-10
                  flex
                  min-h-[132px]
                  items-center
                  px-5
                  py-5
                  sm:min-h-[150px]
                  sm:px-7
                  sm:py-6
                  lg:min-h-[160px]
                  lg:px-8
                "
              >
                <div className="max-w-[720px]">
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-blue-200/75
                      sm:text-[11px]
                    "
                  >
                    Comunidades Avalia Solar
                  </p>

                  <h1
                    id="groups-discovery-title"
                    className="
                      mt-2
                      text-[26px]
                      font-bold
                      leading-[1.08]
                      tracking-[-0.028em]
                      text-white
                      sm:text-[30px]
                      lg:text-[34px]
                    "
                  >
                    {pageTitle}
                  </h1>

                  <p
                    className="
                      mt-2
                      max-w-2xl
                      text-sm
                      leading-6
                      text-slate-300
                      sm:text-[15px]
                    "
                  >
                    {pageDescription}
                  </p>
                </div>
              </div>
            </section>

            {/* =========================================================
                SEARCH + FILTER TOOLBAR
            ========================================================== */}

            <div className="mb-5 sm:mb-6">
              <div
                className="
                  flex
                  flex-col
                  gap-3
                  md:flex-row
                  md:items-center
                "
              >
                <label
                  className="
                    relative
                    block
                    min-w-0
                    flex-1
                  "
                >
                  <span className="sr-only">
                    Buscar comunidades
                  </span>

                  <Search
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      z-10
                      h-5
                      w-5
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Buscar comunidades"
                    autoComplete="off"
                    className="
                      h-12
                      w-full
                      rounded-[14px]
                      border
                      border-slate-200
                      bg-white
                      pl-12
                      pr-4
                      text-[15px]
                      font-medium
                      text-slate-900
                      shadow-[0_1px_2px_rgba(15,23,42,0.03)]
                      outline-none
                      transition-all
                      duration-200
                      placeholder:font-normal
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-500/10
                      sm:h-[50px]
                    "
                  />
                </label>

                <div
                  className="
                    -mx-1
                    flex
                    shrink-0
                    gap-2
                    overflow-x-auto
                    px-1
                    pb-1
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                    md:mx-0
                    md:overflow-visible
                    md:px-0
                    md:pb-0
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
                        onClick={() =>
                          setView(item.value)
                        }
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
                          sm:h-[46px]
                          ${
                            active
                              ? `
                                border-blue-600
                                bg-blue-600
                                text-white
                                shadow-[0_5px_14px_rgba(37,99,235,0.18)]
                              `
                              : `
                                border-slate-200
                                bg-white
                                text-slate-700
                                shadow-[0_1px_2px_rgba(15,23,42,0.02)]
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

            {/* =========================================================
                COMMUNITY LIST
            ========================================================== */}

            <section
              id="groups-list"
              aria-labelledby="groups-list-title"
              className="min-w-0"
            >
              <div
                className="
                  mb-4
                  flex
                  min-w-0
                  items-end
                  justify-between
                  gap-4
                "
              >
                <h2
                  id="groups-list-title"
                  className="
                    min-w-0
                    truncate
                    text-lg
                    font-bold
                    tracking-tight
                    text-slate-950
                    sm:text-xl
                  "
                >
                  {sectionTitle}
                </h2>

                {!groupsQuery.isLoading &&
                  !groupsQuery.isError && (
                    <span
                      className="
                        shrink-0
                        text-xs
                        font-medium
                        text-slate-500
                        sm:text-sm
                      "
                    >
                      {groups.length}{' '}
                      {groups.length === 1
                        ? 'comunidade'
                        : 'comunidades'}
                    </span>
                  )}
              </div>

              {/* Loading */}
              {groupsQuery.isLoading ? (
                <div
                  className="
                    grid
                    gap-4
                    sm:grid-cols-2
                    xl:grid-cols-3
                  "
                >
                  {Array.from(
                    { length: 6 },
                    (_, index) => (
                      <GroupCardSkeleton key={index} />
                    ),
                  )}
                </div>
              ) : groupsQuery.isError ? (
                /* Error */
                <div
                  role="alert"
                  className="
                    rounded-2xl
                    border
                    border-red-200
                    bg-white
                    px-5
                    py-8
                    text-center
                    shadow-sm
                    sm:px-6
                  "
                >
                  <p className="text-base font-semibold text-slate-900">
                    Não foi possível carregar as comunidades.
                  </p>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-md
                      text-sm
                      leading-6
                      text-slate-600
                    "
                  >
                    Tente novamente. Se o problema persistir,
                    aguarde alguns instantes.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      groupsQuery.refetch()
                    }
                    className="
                      mt-5
                      inline-flex
                      h-11
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-200
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
                    <GroupCard
                      key={group.id}
                      group={group}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-300
                    bg-white
                    px-5
                    py-9
                    text-center
                    shadow-sm
                    sm:px-8
                    sm:py-10
                  "
                >
                  <h3
                    className="
                      text-lg
                      font-bold
                      tracking-tight
                      text-slate-900
                    "
                  >
                    Nenhum grupo encontrado
                  </h3>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-md
                      text-sm
                      leading-6
                      text-slate-600
                    "
                  >
                    Tente ajustar sua busca, trocar a
                    categoria ou explorar todas as
                    comunidades.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="
                      mt-5
                      inline-flex
                      h-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-600
                      px-5
                      text-sm
                      font-semibold
                      text-white
                      shadow-[0_5px_14px_rgba(37,99,235,0.18)]
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