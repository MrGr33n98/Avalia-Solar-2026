'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

type ChannelState = { state: string; enabled: boolean; reason: string };
type Surface = {
  surface_id: string; group: string; route: string; lifecycle: string;
  certified: boolean; applicable: boolean;
  channels: { quote?: ChannelState; whatsapp?: ChannelState };
  observed: { data_status: string; impressions: number | null; quote_clicks: number | null; whatsapp_clicks: number | null };
};
type SurfaceSnapshot = {
  company_id: number;
  registry_version: string;
  as_of: string;
  data_status: 'ready' | 'empty' | 'unavailable' | 'processing' | 'error';
  summary: {
    catalog_candidates: number;
    certified_live_surfaces: number;
    applicable_surfaces: number;
    active_surface_count: number;
    active_quote_points: number;
    active_whatsapp_points: number;
    observed_surface_count: number | null;
    impressions: number | null;
    quote_clicks: number | null;
    whatsapp_clicks: number | null;
    quote_submissions: number | null;
  };
  surfaces: Surface[];
};

type Filter = 'all' | 'quote' | 'whatsapp';
type Period = '7d' | '30d' | '90d';
const stateLabel: Record<string, string> = {
  active: 'Ativo',
  awaiting_certification: 'Aguardando certificação',
  not_entitled_or_disabled: 'Plano ou preferência',
  not_applicable: 'Não aplicável',
};
const formatNumber = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? new Intl.NumberFormat('pt-BR').format(n) : '—';

export default function ConversionSurfacesOverview({ companyId }: { companyId: string }) {
  const [period, setPeriod] = useState<Period>('30d');
  const [filter, setFilter] = useState<Filter>('all');
  const [data, setData] = useState<SurfaceSnapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);
    fetchApi<SurfaceSnapshot>('/company_dashboard/conversion_surfaces', {
      method: 'GET', params: { company_id: companyId, period },
    }).then((payload) => {
      if (cancelled) return;
      if (String(payload.company_id) !== companyId ||
          !Array.isArray(payload.surfaces) || !payload.summary) {
        throw new Error('invalid_surface_snapshot');
      }
      setData(payload);
      setStatus('ready');
    }).catch(() => {
      if (!cancelled) setStatus('error');
    });
    return () => { cancelled = true; };
  }, [companyId, period]);

  const surfaces = (data?.surfaces ?? []).filter((row) =>
    filter === 'all' || Boolean(row.channels[filter])
  );
  const summary = data?.summary;
  const clicks = data?.data_status === 'ready' && summary?.quote_clicks != null &&
    summary?.whatsapp_clicks != null
    ? summary.quote_clicks + summary.whatsapp_clicks : null;
  const stats = [
    { title: 'Elegíveis', value: summary?.applicable_surfaces },
    { title: 'Ativos', value: summary?.active_surface_count },
    { title: 'Vistos', value: summary?.observed_surface_count },
    { title: 'Cliques', value: clicks },
  ];

  return (
    <section data-testid="conversion-surfaces-overview" aria-labelledby="conversion-surfaces-heading"
      className="rounded-lg border border-slate-200 bg-white px-3 py-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Marketplace · Conversão</p>
          <h2 id="conversion-surfaces-heading" className="mt-1 text-base font-semibold text-slate-950">Pontos de conversão</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Orçamento e WhatsApp nas jornadas em que sua empresa pode aparecer.
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Período">
          {(['7d', '30d', '90d'] as const).map((option) => (
            <button key={option} type="button" onClick={() => setPeriod(option)}
              aria-pressed={period === option}
              className={'rounded border px-2 py-1 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 ' +
                (period === option ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700')}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div data-testid="conversion-surface-kpis" className="mt-4 grid grid-cols-4 gap-1.5" aria-live="polite">
        {stats.map((stat) => (
          <div key={stat.title} className="flex min-w-0 flex-wrap items-baseline justify-center gap-x-1 rounded-md border border-slate-200 bg-slate-50 p-1.5 sm:justify-start sm:p-2.5">
            <strong className="text-sm font-semibold tabular-nums text-slate-900 sm:text-lg">
              {status === 'ready' ? formatNumber(stat.value) : '—'}
            </strong>
            <span className="min-w-0 text-[10px] font-medium text-slate-600 sm:text-xs">{stat.title}</span>
          </div>
        ))}
      </div>

      {status === 'loading' && <p role="status" className="mt-3 text-xs text-slate-500">Carregando disponibilidade…</p>}
      {status === 'error' && <p role="alert" className="mt-3 text-xs text-rose-700">Não foi possível consultar os pontos de conversão. Atualize a página.</p>}
      {status === 'ready' && data && (
        <>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-600">
            <span>Orçamento: {formatNumber(summary?.active_quote_points)} · WhatsApp: {formatNumber(summary?.active_whatsapp_points)}</span>
            <span>Catálogo: {formatNumber(summary?.catalog_candidates)} candidatos · Certificados: {formatNumber(summary?.certified_live_surfaces)}</span>
          </div>
          {data.data_status !== 'ready' && (
            <p role="status" className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Impressões e cliques indisponíveis: não há mensuração certificada para este período. “—” não significa zero.
            </p>
          )}
          <p className="mt-2 text-[11px] text-slate-500">
            Ativo significa disponível quando a empresa aparece. Não garante exposição, conversa no WhatsApp ou contratação.
          </p>

          <div className="mt-4 flex gap-1 border-b border-slate-200" role="tablist" aria-label="Canal de conversão">
            {([
              ['all', 'Visão geral'], ['quote', 'Orçamento'], ['whatsapp', 'WhatsApp'],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={'border-b-2 px-3 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ' +
                  (filter === key ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600')}>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-2 max-h-[360px] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[550px] border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] text-slate-500">
                <tr><th scope="col" className="p-2 font-semibold">Superfície</th>
                  <th scope="col" className="p-2 font-semibold">Orçamento</th>
                  <th scope="col" className="p-2 font-semibold">WhatsApp</th>
                  <th scope="col" className="p-2 font-semibold text-right">Impressões</th>
                  <th scope="col" className="p-2 font-semibold text-right">Cliques</th></tr>
              </thead>
              <tbody>
                {surfaces.map((row) => (
                  <tr key={row.surface_id} className="border-t border-slate-100">
                    <td className="p-2 align-top">
                      <span className="block font-semibold text-slate-900">{row.group}</span>
                      <span className="block text-[10px] text-slate-500">{row.surface_id}</span>
                    </td>
                    {(['quote', 'whatsapp'] as const).map((channel) => (
                      <td key={channel} className="p-2 text-slate-700">
                        {row.channels[channel] ? stateLabel[row.channels[channel]!.state] || row.channels[channel]!.state : '—'}
                      </td>
                    ))}
                    <td className="p-2 text-right tabular-nums">{formatNumber(row.observed.impressions)}</td>
                    <td className="p-2 text-right tabular-nums">
                      {formatNumber(row.observed.data_status === 'ready'
                        ? (row.observed.quote_clicks || 0) + (row.observed.whatsapp_clicks || 0)
                        : null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Registro v{data.registry_version}. Cliques WhatsApp são intenção de contato, não prova de conversa.
          </p>
        </>
      )}
    </section>
  );
}
