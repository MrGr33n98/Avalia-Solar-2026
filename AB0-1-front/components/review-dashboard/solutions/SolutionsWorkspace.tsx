'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AddUserSolutionModal } from '@/components/profile/AddUserSolutionModal';
import type { UserSolution } from '@/components/profile/UserSolutionChip';
import { useDashboardContext } from '@/app/review-dashboard/DashboardLayoutClient';
import { cn } from '@/lib/utils';
import { SolutionIdentityAvatar } from './SolutionIdentityAvatar';
import { SolutionMetricStrip } from './SolutionMetricStrip';

const CATEGORY_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'solar', label: 'Energia Solar' },
  { id: 'battery', label: 'Baterias' },
  { id: 'ev', label: 'Mobilidade' },
] as const;

type TabId = (typeof CATEGORY_TABS)[number]['id'];

const TYPE_LABELS: Record<UserSolution['type'], string> = {
  company: 'Empresa',
  product: 'Produto',
  service: 'Serviço',
  technology: 'Tecnologia',
};

const SUPPORTED_CATEGORIES = [
  'Energia Solar Fotovoltaica',
  'Bateria de Lítio',
  'Veículo Elétrico',
  'Aquecedor Solar',
  'Bombeamento Solar',
] as const;

function formatAddedDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function SolutionsWorkspace() {
  const {
    solutions,
    solutionsLoading,
    solutionsError,
    addSolution,
    removeSolution,
    removingSolutionId,
    onRefresh,
  } = useDashboardContext();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const metrics = useMemo(() => {
    const verified = solutions.filter((item) => item.verified === true).length;
    const selfDeclared = solutions.length - verified;
    const categories = new Set(
      solutions.map((item) => item.category?.trim()).filter(Boolean)
    ).size;

    return {
      total: solutions.length,
      verified,
      selfDeclared,
      categories,
    };
  }, [solutions]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return solutions;
    const term =
      activeTab === 'solar' ? 'solar' : activeTab === 'battery' ? 'bateria' : 'mobilidade';
    return solutions.filter((item) => item.category?.toLowerCase().includes(term));
  }, [activeTab, solutions]);

  const metricsUnavailable = Boolean(solutionsError) && solutions.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-8 text-[#161616] sm:space-y-5">
      <AddUserSolutionModal open={modalOpen} onOpenChange={setModalOpen} onAdd={addSolution} />

      <header className="border-l-[3px] border-[#0F62FE] bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#525252]">
              Central do avaliador
            </p>
            <h1 className="mt-1.5 text-[22px] font-semibold leading-[1.2] tracking-tight text-[#0F2F64] sm:text-2xl">
              Soluções que uso
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#525252] sm:text-sm">
              Registre equipamentos, marcas e serviços de energia sustentável que você realmente utiliza.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0F62FE] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0043CE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F62FE] sm:min-h-[36px] sm:text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Adicionar solução</span>
          </button>
        </div>
      </header>

      <SolutionMetricStrip
        total={metrics.total}
        verified={metrics.verified}
        selfDeclared={metrics.selfDeclared}
        categories={metrics.categories}
        loading={solutionsLoading}
        unavailable={metricsUnavailable}
      />

      {solutionsError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border-l-[3px] border-[#DA1E28] bg-[#FFF1F1] px-4 py-3 text-xs text-[#A2191F]"
        >
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{solutionsError}</span>
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-[36px] items-center gap-1.5 font-semibold underline underline-offset-2 hover:text-[#750E13]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <section className="min-w-0 space-y-3" aria-label="Lista de soluções cadastradas">
          <div
            role="tablist"
            aria-label="Filtrar soluções por categoria"
            className="flex items-center gap-1 overflow-x-auto border-b border-[#E0E0E0]"
          >
            {CATEGORY_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0F62FE] sm:min-h-[36px] sm:text-sm',
                    isSelected
                      ? 'border-[#0F62FE] text-[#0F62FE]'
                      : 'border-transparent text-[#525252] hover:text-[#161616]'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'all' && !solutionsLoading && !metricsUnavailable && (
                    <span className="rounded bg-[#F4F7FB] px-1.5 py-0.5 text-[11px] tabular-nums text-[#525252]">
                      {solutions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {solutionsLoading && solutions.length === 0 ? (
            <div className="space-y-2" role="status" aria-label="Carregando soluções">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-lg border border-[#DDE5EF] bg-[#F4F7FB]"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#C6C6C6] bg-white px-6 py-10 text-center">
              <p className="text-sm font-semibold text-[#161616]">
                {solutions.length === 0
                  ? 'Nenhuma solução cadastrada.'
                  : 'Nenhuma solução encontrada nesta categoria.'}
              </p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[#525252]">
                {solutions.length === 0
                  ? 'Adicione equipamentos ou serviços que você utiliza de fato.'
                  : 'Selecione outra categoria acima ou cadastre um novo item.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#0F62FE] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0043CE] sm:min-h-[36px]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Adicionar primeira solução</span>
                </button>
                {activeTab !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C6C6C6] bg-white px-4 text-xs font-semibold text-[#0F2F64] transition-colors hover:bg-[#EDF5FF] sm:min-h-[36px]"
                  >
                    Ver todas
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((solution) => {
                const formattedDate = formatAddedDate(solution.created_at);
                const typeLabel = TYPE_LABELS[solution.type] || 'Solução';
                const isVerified = solution.verified === true;
                const isRemoving = removingSolutionId === solution.id;

                return (
                  <li
                    key={solution.id}
                    className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 rounded-lg border border-[#DDE5EF] bg-white px-4 py-3 transition-colors hover:border-[#A6C8FF]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <SolutionIdentityAvatar
                        name={solution.name || 'Solução'}
                        logoUrl={solution.logo_url}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-[#161616]">
                            {solution.name || 'Solução sem nome'}
                          </h2>
                          {solution.category && (
                            <span className="inline-flex items-center rounded border border-[#DDE5EF] bg-[#F4F7FB] px-2 py-0.5 text-[11px] font-medium text-[#525252]">
                              {solution.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#6F6F6F]">
                          {typeLabel}
                          {formattedDate ? ` · Adicionado em ${formattedDate}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold',
                          isVerified
                            ? 'border-[#A7F0BA] bg-[#DEFBE6] text-[#0E6027]'
                            : 'border-[#D0E2FF] bg-[#EDF5FF] text-[#0043CE]'
                        )}
                      >
                        {isVerified ? 'Verificada' : 'Uso declarado'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Remover esta solução?')) {
                            void removeSolution(solution.id);
                          }
                        }}
                        disabled={isRemoving}
                        aria-label={`Remover ${solution.name || 'solução'}`}
                        className="inline-flex min-h-[44px] items-center gap-1 rounded px-2 text-xs font-medium text-[#525252] transition-colors hover:bg-[#FFF1F1] hover:text-[#DA1E28] disabled:opacity-50 sm:min-h-[32px]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isRemoving ? 'Removendo...' : 'Remover'}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-[#DDE5EF] border-l-[3px] border-l-[#0F62FE] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#0F2F64]">
              Como funciona o registro
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-[#525252]">
              As soluções cadastradas registram equipamentos, marcas e serviços autodeclarados por
              você e não concedem selo oficial automaticamente.
            </p>
            <p className="mt-2 text-xs leading-5 text-[#525252]">
              O cálculo do Green Score considera exclusivamente avaliações aprovadas, votos úteis
              recebidos e preenchimento do perfil.
            </p>
          </div>

          <div className="rounded-lg border border-[#DDE5EF] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#0F2F64]">Categorias atendidas</h2>
            <ul className="mt-2.5 space-y-1.5 text-xs text-[#525252]">
              {SUPPORTED_CATEGORIES.map((category) => (
                <li
                  key={category}
                  className="flex items-center gap-2 border-b border-[#F4F7FB] pb-1.5 last:border-0 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-[1px] bg-[#0F62FE]"
                  />
                  <span>{category}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

