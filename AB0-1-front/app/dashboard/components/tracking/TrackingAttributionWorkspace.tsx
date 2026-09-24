'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { companyDashboardApi, type AttributionModel } from '@/lib/api';
import TrackingHealth from './TrackingHealth';
import UtmLinkBuilder from './UtmLinkBuilder';
import AttributionExplorer from './AttributionExplorer';

type CompanyProps = {
  id?: number | string;
  slug?: string | null;
  name?: string | null;
};

type Props = { companyId: string; company?: CompanyProps };
type WorkspaceTab = 'overview' | 'builder' | 'attribution' | 'diagnostics' | 'settings';

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'builder', label: 'Gerador de links' },
  { id: 'attribution', label: 'Atribuição' },
  { id: 'diagnostics', label: 'Diagnóstico' },
  { id: 'settings', label: 'Configuração' },
];

const dateValue = (date: Date) => date.toISOString().slice(0, 10);

export default function TrackingAttributionWorkspace({ companyId, company }: Props) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [days, setDays] = useState(30);
  const [model, setModel] = useState<AttributionModel>('last_touch');
  const to = dateValue(new Date());
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days + 1);
  const from = dateValue(fromDate);
  const query = useQuery({
    queryKey: ['tracking-attribution-workspace', companyId, from, to, model],
    queryFn: () =>
      companyDashboardApi.getTrackingWorkspace(companyId, {
        from,
        to,
        attribution_model: model,
        preset: days === 7 ? '7d' : days === 90 ? '90d' : '30d',
        timezone: 'America/Sao_Paulo',
      }),
    enabled: Boolean(companyId),
    retry: false,
  });

  const data = query.data;
  const unavailable = query.isError || data?.status === 'unavailable' || data?.status === 'error';
  const processing = data?.status === 'processing';
  const advanced = Boolean(data?.capabilities?.advanced);
  const statusMessage = useMemo(() => {
    if (processing) return 'A mensuração está sendo processada.';
    if (unavailable) return 'A mensuração está indisponível no momento.';
    if (data?.status === 'empty') return 'Ainda não há eventos atribuíveis neste período.';
    return 'Dados canônicos da plataforma, com estado explícito de disponibilidade.';
  }, [data?.status, processing, unavailable]);

  return (
    <main className="space-y-6" aria-labelledby="tracking-workspace-title">
      <header className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[hsl(var(--dashboard-surface))] px-3 py-1 text-xs font-semibold text-[hsl(var(--dashboard-muted))]">
                CORE + PREMIUM
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--dashboard-muted))]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Sem métricas inventadas
              </span>
            </div>
            <h1
              id="tracking-workspace-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Tracking &amp; Atribuição
            </h1>
            <p className="mt-2 text-sm leading-6 text-[hsl(var(--dashboard-muted))]">
              Entenda de onde veio cada interação, quais links estão saudáveis e onde a mensuração
              precisa de atenção.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Período">
            {[7, 30, 90].map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={days === option ? 'default' : 'outline'}
                onClick={() => setDays(option)}
              >
                {option} dias
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={'mr-2 h-4 w-4 ' + (query.isFetching ? 'animate-spin' : '')}
                aria-hidden="true"
              />
              Atualizar
            </Button>
          </div>
        </div>
        <p role="status" className="mt-4 text-sm text-[hsl(var(--dashboard-muted))]">
          {statusMessage}
        </p>
      </header>

      <nav
        aria-label="Seções de Tracking & Atribuição"
        className="overflow-x-auto border-b border-[hsl(var(--dashboard-border))]"
      >
        <div className="flex min-w-max gap-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                'border-b-2 px-3 py-3 text-sm font-medium transition-colors ' +
                (activeTab === tab.id
                  ? 'border-[hsl(var(--dashboard-accent))] text-[hsl(var(--dashboard-ink))]'
                  : 'border-transparent text-[hsl(var(--dashboard-muted))] hover:text-[hsl(var(--dashboard-ink))]')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {query.isLoading ? (
        <div className="space-y-4" aria-label="Carregando tracking">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
        </div>
      ) : processing ? (
        <section
          role="status"
          className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100"
        >
          <h2 className="text-lg font-semibold">Mensuração em processamento</h2>
          <p className="mt-2 text-sm">
            Os eventos chegaram, mas a consolidação ainda não terminou.
          </p>
        </section>
      ) : unavailable ? (
        <section
          role="alert"
          aria-labelledby="tracking-unavailable-title"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <h2 id="tracking-unavailable-title" className="text-lg font-semibold">
            Mensuração indisponível
          </h2>
          <p className="mt-2 text-sm">
            Não foi possível consultar os sinais deste período. Nenhum zero foi inferido.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </section>
      ) : data ? (
        <>
          {activeTab === 'overview' ? (
            <div className="space-y-7">
              <TrackingHealth health={data.health} />
              <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 text-sm text-[hsl(var(--dashboard-muted))]">
                Fonte: {data.data_source}. Período: {data.range?.from || from} a{' '}
                {data.range?.to || to}. A origem Direct é mantida separada de Unknown.
              </div>
            </div>
          ) : null}
          {activeTab === 'builder' ? <UtmLinkBuilder companyId={companyId} company={company} /> : null}
          {activeTab === 'attribution' ? (
            <AttributionExplorer
              data={data}
              advanced={advanced}
              model={model}
              onModelChange={setModel}
            />
          ) : null}
          {activeTab === 'diagnostics' ? (
            <section className="space-y-5" aria-labelledby="diagnostics-title">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--dashboard-muted))]">
                  Cobertura
                </p>
                <h2 id="diagnostics-title" className="text-xl font-semibold">
                  Diagnóstico de instrumentação
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Eventos', data.diagnostics.event_count],
                  [
                    'Identidade',
                    data.diagnostics.identity_coverage_pct === undefined
                      ? null
                      : data.diagnostics.identity_coverage_pct + '%',
                  ],
                  [
                    'UTM',
                    data.diagnostics.utm_coverage_pct === undefined
                      ? null
                      : data.diagnostics.utm_coverage_pct + '%',
                  ],
                  ['Click IDs', data.diagnostics.click_id_count],
                ].map(([label, item]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[hsl(var(--dashboard-border))] p-4"
                  >
                    <p className="text-xs text-[hsl(var(--dashboard-muted))]">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {item === null || item === undefined ? 'Indisponível' : item}
                    </p>
                  </div>
                ))}
              </div>
              <TrackingHealth health={data.health} />
            </section>
          ) : null}
          {activeTab === 'settings' ? (
            <section className="space-y-5" aria-labelledby="tracking-settings-title">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--dashboard-muted))]">
                  Contrato
                </p>
                <h2 id="tracking-settings-title" className="text-xl font-semibold">
                  Configuração de mensuração
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-[hsl(var(--dashboard-border))] p-5">
                  <h3 className="font-semibold">Entrada</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--dashboard-muted))]">
                    utm_source e utm_medium são configuráveis no link gerado. Campanhas não devem
                    carregar PII.
                  </p>
                </article>
                <article className="rounded-xl border border-[hsl(var(--dashboard-border))] p-5">
                  <h3 className="font-semibold">Saída controlada</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--dashboard-muted))]">
                    Links da plataforma usam {data.policy.outbound_source}; mídia patrocinada usa{' '}
                    {data.policy.ads_source}.
                  </p>
                </article>
                <article className="rounded-xl border border-[hsl(var(--dashboard-border))] p-5">
                  <h3 className="font-semibold">Conversão</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--dashboard-muted))]">
                    {data.capabilities.conversion_tracking === 'configured'
                      ? 'Configurada'
                      : 'Ainda não configurada; nenhum zero foi inferido.'}
                  </p>
                </article>
                <article className="rounded-xl border border-[hsl(var(--dashboard-border))] p-5">
                  <h3 className="font-semibold">Plano</h3>
                  <p className="mt-2 text-sm text-[hsl(var(--dashboard-muted))]">
                    Dados básicos estão disponíveis para todos. Histórico, exportação e detalhamento
                    avançado dependem do entitlement.
                  </p>
                </article>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          Não foi possível carregar o workspace. Tente atualizar novamente.
        </section>
      )}
    </main>
  );
}
