'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ExternalLink, HelpCircle } from 'lucide-react';
import { companyDashboardApi, type AttributionModel } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Props = {
  companyId: string;
  from?: string;
  to?: string;
  rangeLabel?: string;
  preset?: '7d' | '30d' | '90d' | 'custom';
  days?: number;
  premium: boolean;
};

const labels: Record<string, string> = {
  visits: 'Visitas',
  cta_clicks: 'CTAs',
  leads: 'Leads',
  attribution_coverage_pct: 'Cobertura de atribuição',
};

export default function AttributionOverview({
  companyId,
  from: requestedFrom,
  to: requestedTo,
  rangeLabel,
  preset = 'custom',
  days = 30,
  premium,
}: Props) {
  const router = useRouter();
  const [model, setModel] = useState<AttributionModel>('last_touch');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`analytics-attribution-expanded:${companyId}`);
      if (stored !== null) {
        setIsExpanded(stored === 'true');
      }
    } catch {
      // Ignore localStorage errors (SSR safe / private browsing)
    }
  }, [companyId]);

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`analytics-attribution-expanded:${companyId}`, String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  const openWorkspace = () => {
    router.push(`/dashboard?company_id=${encodeURIComponent(companyId)}&tab=tracking-attribution`);
  };

  const fallbackTo = new Date().toISOString().slice(0, 10);
  const fallbackFromDate = new Date();
  fallbackFromDate.setDate(fallbackFromDate.getDate() - days + 1);
  const from = requestedFrom || fallbackFromDate.toISOString().slice(0, 10);
  const to = requestedTo || fallbackTo;

  const query = useQuery({
    queryKey: ['analytics-attribution', companyId, from, to, preset, model],
    queryFn: () =>
      companyDashboardApi.getAnalyticsAttribution(companyId, {
        from,
        to,
        attribution_model: model,
        limit: 20,
        preset,
        timezone: 'America/Sao_Paulo',
      }),
    enabled: Boolean(companyId),
    retry: false,
  });

  if (!premium) return null;
  if (query.isLoading)
    return (
      <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 text-sm text-[hsl(var(--dashboard-muted))]">
        Carregando origem e atribuição…
      </section>
    );
  if (query.data?.data_status === 'unavailable' || query.data?.data_status === 'error' || query.isError)
    return (
      <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 text-sm text-[hsl(var(--dashboard-muted))]">
        Dados de atribuição indisponíveis.
      </section>
    );
  if (query.data?.data_status === 'locked')
    return (
      <section className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 text-sm">
        Atribuição disponível em planos avançados.
      </section>
    );

  const data = query.data;
  const summary = data?.summary;
  const isEmpty = data?.data_status === 'empty' || (!summary && data?.data_status === 'ready');

  return (
    <section className="space-y-4 rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Origem &amp; Atribuição</h2>
          <p className="text-sm text-[hsl(var(--dashboard-muted))]">
            Resumo executivo de canais e atribuição{rangeLabel ? ` · ${rangeLabel}` : ''}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={model}
            onChange={(event) => setModel(event.target.value as AttributionModel)}
            className="rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--dashboard-ink))]"
            aria-label="Modelo de atribuição"
          >
            <option value="last_touch">Last Touch</option>
            <option value="first_touch">First Touch</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openWorkspace}
            className="h-8 gap-1.5 text-xs"
          >
            <span className="hidden sm:inline">Abrir Tracking &amp; Atribuição</span>
            <span className="sm:hidden">Detalhes</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            aria-controls="attribution-overview-details"
            aria-label={
              isExpanded
                ? 'Recolher detalhes de origem e atribuição'
                : 'Expandir detalhes de origem e atribuição'
            }
            className="h-8 w-8 p-0"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </Button>
        </div>
      </header>

      {summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(['visits', 'cta_clicks', 'leads', 'attribution_coverage_pct'] as const).map((key) => (
            <div key={key} className="rounded-lg bg-[hsl(var(--dashboard-surface))] p-3">
              <div className="flex items-center gap-1">
                <p className="text-xs text-[hsl(var(--dashboard-muted))]">{labels[key]}</p>
                {key === 'attribution_coverage_pct' ? (
                  <span
                    title="Percentual de eventos em que foi possível identificar uma origem por UTM, referência ou acesso direto. Não representa cobertura de UTM."
                    tabIndex={0}
                    aria-label="Ajuda sobre Cobertura de atribuição"
                    className="cursor-help text-[hsl(var(--dashboard-muted))]"
                  >
                    <HelpCircle className="h-3 w-3" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xl font-bold text-[hsl(var(--dashboard-ink))]">
                {key === 'attribution_coverage_pct'
                  ? summary[key] !== null && summary[key] !== undefined
                    ? `${summary[key]}%`
                    : '—'
                  : summary[key] ?? '—'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[hsl(var(--dashboard-muted))]">
          {isEmpty
            ? 'Nenhuma interação atribuível neste período.'
            : 'Nenhum dado de atribuição disponível neste período.'}
        </p>
      )}

      {isExpanded ? (
        <div id="attribution-overview-details" className="space-y-5 pt-2">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Fontes de tráfego</h3>
              <div className="space-y-2 text-sm">
                {(data?.channels || []).length ? (
                  (data?.channels || []).map((row) => (
                    <div
                      key={`${row.channel_group}-${row.source}`}
                      className="flex justify-between gap-3 text-xs sm:text-sm"
                    >
                      <span className="font-medium text-[hsl(var(--dashboard-ink))]">
                        {row.channel_group} · {row.source}
                      </span>
                      <span className="text-[hsl(var(--dashboard-muted))]">
                        {row.visits} visitas · {row.leads} leads
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[hsl(var(--dashboard-muted))]">
                    Nenhuma fonte de tráfego registrada.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Origem × CTA</h3>
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-[hsl(var(--dashboard-muted))]">
                      <th className="py-1 font-medium">Origem</th>
                      <th className="font-medium">WhatsApp</th>
                      <th className="font-medium">Orçamento</th>
                      <th className="font-medium">CTAs</th>
                      <th className="font-medium">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.cta_matrix || []).length ? (
                      (data?.cta_matrix || []).map((row) => (
                        <tr
                          key={`${row.channel_group}-${row.source}`}
                          className="border-b border-[hsl(var(--dashboard-border))/50]"
                        >
                          <td className="py-1.5 font-medium">{row.source}</td>
                          <td>{row.whatsapp}</td>
                          <td>{row.quote}</td>
                          <td>{row.total_clicks}</td>
                          <td>{row.leads}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-2 text-xs text-[hsl(var(--dashboard-muted))]">
                          Nenhum cruzamento de origem e CTA.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Campanhas UTM</h3>
              {(data?.campaigns || []).length ? (
                <ul className="space-y-1 text-xs sm:text-sm">
                  {data?.campaigns.map((row) => (
                    <li key={`${row.source}-${row.medium}-${row.campaign}`}>
                      {row.campaign} · {row.source}/{row.medium}: {row.leads} leads
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[hsl(var(--dashboard-muted))]">
                    Nenhuma campanha UTM identificada neste período.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={openWorkspace}
                    className="h-auto p-0 text-xs text-[hsl(var(--dashboard-accent))]"
                  >
                    Criar link UTM →
                  </Button>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Landing pages</h3>
              {(data?.landing_pages || []).length ? (
                <ul className="space-y-1 text-xs sm:text-sm">
                  {data?.landing_pages.map((row) => (
                    <li key={row.landing_path}>
                      {row.landing_path || 'Não identificada'}: {row.visits} visitas
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[hsl(var(--dashboard-muted))]">
                  Nenhuma landing page comercial identificada neste período.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
