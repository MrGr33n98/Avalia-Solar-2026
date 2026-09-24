'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { companyDashboardApi, type AttributionModel } from '@/lib/api';

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
  attribution_coverage_pct: 'Cobertura',
};

export default function AttributionOverview({ companyId, from: requestedFrom, to: requestedTo, rangeLabel, preset = 'custom', days = 30, premium }: Props) {
  const [model, setModel] = useState<AttributionModel>('last_touch');
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
      <section className="rounded-xl border p-5 text-sm text-[hsl(var(--dashboard-muted))]">
        Carregando origem e atribuição…
      </section>
    );
  if (query.data?.data_status === 'unavailable' || query.data?.data_status === 'error' || query.isError)
    return (
      <section className="rounded-xl border p-5 text-sm text-[hsl(var(--dashboard-muted))]">
        Dados de atribuição indisponíveis.
      </section>
    );
  if (query.data?.data_status === 'locked')
    return (
      <section className="rounded-xl border p-5 text-sm">
        Atribuição disponível em planos avançados.
      </section>
    );

  const data = query.data;
  const summary = data?.summary;
  const isEmpty = data?.data_status === 'empty' || (!summary && data?.data_status === 'ready');
  return (
    <section className="space-y-5 rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Origem &amp; Atribuição</h2>
          <p className="text-sm text-[hsl(var(--dashboard-muted))]">
            Canais, CTAs e leads no mesmo período da aba{rangeLabel ? ` · ${rangeLabel}` : ''}.
          </p>
        </div>
        <select
          value={model}
          onChange={(event) => setModel(event.target.value as AttributionModel)}
          className="rounded-lg border bg-transparent px-3 py-2 text-sm"
        >
          <option value="last_touch">Last Touch</option>
          <option value="first_touch">First Touch</option>
        </select>
      </header>
      {summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(['visits', 'cta_clicks', 'leads', 'attribution_coverage_pct'] as const).map((key) => (
            <div key={key} className="rounded-lg bg-[hsl(var(--dashboard-surface))] p-3">
              <p className="text-xs text-[hsl(var(--dashboard-muted))]">{labels[key]}</p>
              <p className="mt-1 text-xl font-bold">
                {key === 'attribution_coverage_pct' ? `${summary[key]}%` : summary[key]}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[hsl(var(--dashboard-muted))]">
          {isEmpty ? 'Nenhuma interação atribuível neste período.' : 'Nenhum dado de atribuição disponível neste período.'}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold">Fontes de tráfego</h3>
          <div className="space-y-2 text-sm">
            {(data?.channels || []).map((row) => (
              <div
                key={`${row.channel_group}-${row.source}`}
                className="flex justify-between gap-3"
              >
                <span>
                  {row.channel_group} · {row.source}
                </span>
                <span>
                  {row.visits} visitas · {row.leads} leads
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Origem × CTA</h3>
          <div className="overflow-x-auto text-sm">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-[hsl(var(--dashboard-muted))]">
                  <th>Origem</th>
                  <th>WhatsApp</th>
                  <th>Orçamento</th>
                  <th>CTAs</th>
                  <th>Leads</th>
                </tr>
              </thead>
              <tbody>
                {(data?.cta_matrix || []).map((row) => (
                  <tr key={`${row.channel_group}-${row.source}`} className="border-t">
                    <td className="py-2">{row.source}</td>
                    <td>{row.whatsapp}</td>
                    <td>{row.quote}</td>
                    <td>{row.total_clicks}</td>
                    <td>{row.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold">Campanhas UTM</h3>
          {(data?.campaigns || []).length ? (
            <ul className="space-y-1 text-sm">
              {data?.campaigns.map((row) => (
                <li key={`${row.source}-${row.medium}-${row.campaign}`}>
                  {row.campaign} · {row.source}/{row.medium}: {row.leads} leads
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[hsl(var(--dashboard-muted))]">
              Nenhuma campanha UTM identificada neste período.
            </p>
          )}
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Landing pages</h3>
          {(data?.landing_pages || []).length ? (
            <ul className="space-y-1 text-sm">
              {data?.landing_pages.map((row) => (
                <li key={row.landing_path}>
                  {row.landing_path || 'Não identificada'}: {row.visits} visitas
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[hsl(var(--dashboard-muted))]">
              Nenhuma landing page identificada neste período.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
