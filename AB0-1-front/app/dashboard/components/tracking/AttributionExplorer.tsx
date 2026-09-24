'use client';

import { Download, Lock } from 'lucide-react';
import type { AttributionModel, TrackingWorkspaceResponse } from '@/lib/api';

type Props = {
  data: TrackingWorkspaceResponse;
  advanced: boolean;
  model: AttributionModel;
  onModelChange: (model: AttributionModel) => void;
};

const value = (item: number | null | undefined, suffix = '') =>
  item === null || item === undefined ? 'Indisponível' : String(item) + suffix;

const csvCell = (value: string) => {
  const safeValue = /^[=+\-@]/.test(value) ? "'" + value : value;
  return '"' + safeValue.replaceAll('"', '""') + '"';
};

export default function AttributionExplorer({ data, advanced, model, onModelChange }: Props) {
  const summary = data.summary;
  const exportCsv = () => {
    const rows = [
      ['tipo', 'origem', 'meio', 'campanha', 'visitas', 'ctas', 'leads'],
      ...data.channels.map((row) => [
        'canal',
        row.source,
        row.medium,
        '',
        row.visits,
        row.cta_clicks,
        row.leads,
      ]),
      ...data.campaigns.map((row) => [
        'campanha',
        row.source,
        row.medium,
        row.campaign,
        row.visits,
        row.cta_clicks,
        row.leads,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((item) => csvCell(String(item ?? ''))).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'tracking-atribuicao.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <section aria-labelledby="attribution-title" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--dashboard-muted))]">
            Leitura de conversão
          </p>
          <h2 id="attribution-title" className="text-xl font-semibold">
            Atribuição
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--dashboard-muted))]">
            First Touch mostra a descoberta; Last Touch mostra o contato mais próximo da ação.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Modelo de atribuição</span>
          <select
            value={model}
            onChange={(event) => onModelChange(event.target.value as AttributionModel)}
            className="rounded-lg border border-[hsl(var(--dashboard-border))] bg-transparent px-3 py-2"
          >
            <option value="last_touch">Last Touch</option>
            <option value="first_touch">First Touch</option>
          </select>
        </label>
        {advanced ? (
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center rounded-lg border border-[hsl(var(--dashboard-border))] px-3 py-2 text-sm font-medium"
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar CSV
          </button>
        ) : null}
      </div>
      {summary ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Visitas', value(summary.visits)],
            ['CTAs', value(summary.cta_clicks)],
            ['Leads', value(summary.leads)],
            ['Cobertura', value(summary.attribution_coverage_pct, '%')],
          ].map(([label, metric]) => (
            <div
              key={label}
              className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-subtle))] p-4"
            >
              <p className="text-xs text-[hsl(var(--dashboard-muted))]">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{metric}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[hsl(var(--dashboard-border))] p-4 text-sm text-[hsl(var(--dashboard-muted))]">
          Nenhuma interação atribuível no período selecionado.
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-[hsl(var(--dashboard-border))] p-4">
          <h3 className="font-semibold">Canais</h3>
          <div className="mt-3 space-y-2 text-sm">
            {data.channels.length ? (
              data.channels.map((channel) => (
                <div
                  key={channel.channel_group + channel.source}
                  className="flex justify-between gap-3 border-b border-[hsl(var(--dashboard-border))] pb-2"
                >
                  <span>
                    {channel.channel_group} · {channel.source}
                  </span>
                  <span className="text-[hsl(var(--dashboard-muted))]">
                    {channel.visits} visitas · {channel.leads} leads
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[hsl(var(--dashboard-muted))]">Nenhum canal identificável.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--dashboard-border))] p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Campanhas</h3>
            {!advanced ? (
              <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--dashboard-muted))]">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Premium
              </span>
            ) : null}
          </div>
          {advanced ? (
            data.campaigns.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {data.campaigns.map((campaign) => (
                  <li
                    key={campaign.source + campaign.medium + campaign.campaign}
                    className="border-b border-[hsl(var(--dashboard-border))] pb-2"
                  >
                    {campaign.campaign || 'Sem campanha'} · {campaign.source}/{campaign.medium} ·{' '}
                    {campaign.leads} leads
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[hsl(var(--dashboard-muted))]">
                Nenhuma campanha UTM identificada.
              </p>
            )
          ) : (
            <p className="mt-3 text-sm text-[hsl(var(--dashboard-muted))]">
              Histórico por campanha e detalhamento estão disponíveis no plano avançado.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
