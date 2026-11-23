'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import {
  companyDashboardApi,
  type DashboardCompanyLead,
  type DashboardLeadsQuery,
  type DashboardLeadPagination,
} from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LeadsOpportunitiesProps {
  companyId: string;
}

type Period = '30d' | '90d' | '6m' | '1y' | 'custom';
type RequestType = 'all' | 'quote' | 'contact';
const PAGE_SIZE = 20;

const PERIODS: { value: Period; label: string }[] = [
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
  { value: 'custom', label: 'Personalizado' },
];

function toDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
}

function readable(value?: string | null) {
  return value?.trim() || 'Não informado';
}

function requestLabel(value: DashboardCompanyLead['request_type']) {
  return value === 'quote' ? 'Solicitou orçamento' : 'Solicitou contato';
}

function csvCell(value: unknown) {
  const plain = String(value ?? '');
  // Avoid CSV formula execution when opened in spreadsheet applications.
  const safe = /^[\s]*[=+\-@\t\r]/.test(plain) ? "'" + plain : plain;
  return '"' + safe.replace(/"/g, '""') + '"';
}

function downloadCsv(leads: DashboardCompanyLead[]) {
  const headings = [
    'Nome', 'E-mail', 'Telefone', 'Segmento', 'Tipo de solicitação',
    'Data', 'Cidade', 'Estado', 'Mensagem',
  ];
  const lines = leads.map((lead) => [
    lead.name, lead.email, lead.phone, lead.product_vertical,
    requestLabel(lead.request_type), toDate(lead.created_at),
    lead.city, lead.state, lead.message,
  ].map(csvCell).join(';'));
  const csv = '\uFEFF' + [headings.map(csvCell).join(';'), ...lines].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'solicitacoes-avalia-solar-' + format(new Date(), 'yyyy-MM-dd') + '.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function LeadsOpportunities({ companyId }: LeadsOpportunitiesProps) {
  const [period, setPeriod] = useState<Period>('6m');
  const [customFrom, setCustomFrom] = useState(() => format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [requestType, setRequestType] = useState<RequestType>('all');
  const [emailInput, setEmailInput] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<DashboardCompanyLead[]>([]);
  const [pagination, setPagination] = useState<DashboardLeadPagination | null>(null);
  const [selected, setSelected] = useState<DashboardCompanyLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEmailSearch(emailInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [emailInput]);

  useEffect(() => {
    setSelected(null);
    setPage(1);
  }, [companyId]);

  const validDates = period !== 'custom' || (
    Boolean(customFrom && customTo) && customFrom <= customTo
  );

  const filters = useMemo<DashboardLeadsQuery>(() => {
    const today = new Date();
    const start = period === '30d' ? subDays(today, 30)
      : period === '90d' ? subDays(today, 90)
      : period === '1y' ? subYears(today, 1)
      : subMonths(today, 6);

    return {
      from_date: period === 'custom' ? customFrom : format(start, 'yyyy-MM-dd'),
      to_date: period === 'custom' ? customTo : format(today, 'yyyy-MM-dd'),
      ...(requestType !== 'all' ? { request_type: requestType } : {}),
      ...(emailSearch ? { email: emailSearch } : {}),
    };
  }, [period, customFrom, customTo, requestType, emailSearch]);

  useEffect(() => {
    if (!validDates) {
      setLoading(false);
      setLeads([]);
      setPagination(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    companyDashboardApi.getLeads(companyId, { ...filters, page, per_page: PAGE_SIZE })
      .then((response) => {
        if (!active) return;
        setLeads(response.data ?? []);
        setPagination(response.meta?.pagination ?? null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setLeads([]);
        setPagination(null);
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as solicitações.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [companyId, filters, page, refresh, validDates]);

  const clearFilters = () => {
    setPeriod('6m');
    setRequestType('all');
    setEmailInput('');
    setEmailSearch('');
    setPage(1);
    setExportError(null);
  };

  const exportFiltered = async () => {
    if (exporting || !validDates || !pagination?.total) return;
    setExporting(true);
    setExportError(null);

    try {
      // Reuse the same tenant-scoped, authorized API as the table.
      // Export ALL filtered pages, not just the currently visible page.
      const first = await companyDashboardApi.getLeads(companyId, { ...filters, page: 1, per_page: 100 });
      const all = [...(first.data ?? [])];
      const totalPages = first.meta.pagination.total_pages;
      for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
        const response = await companyDashboardApi.getLeads(companyId, {
          ...filters,
          page: nextPage,
          per_page: 100,
        });
        all.push(...(response.data ?? []));
      }
      downloadCsv(all);
    } catch (cause: unknown) {
      setExportError(cause instanceof Error ? cause.message : 'Erro ao exportar solicitações.');
    } finally {
      setExporting(false);
    }
  };

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;

  return (
    <section aria-label="Solicitações recebidas" className="overflow-hidden rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-[hsl(var(--dashboard-ink))] shadow-xs">
      <div className="flex flex-wrap gap-1 border-b border-[hsl(var(--dashboard-border))] px-3 py-3 sm:gap-2 sm:px-5 bg-[hsl(var(--dashboard-surface)/0.3)]">
        {PERIODS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => { setPeriod(option.value); setPage(1); }}
            aria-pressed={period === option.value}
            className={
              'min-h-9 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--dashboard-accent))] sm:px-3 ' +
              (period === option.value
                ? 'bg-[hsl(var(--dashboard-accent))] text-white shadow-xs'
                : 'text-[hsl(var(--dashboard-muted))] hover:bg-[hsl(var(--dashboard-surface))] hover:text-[hsl(var(--dashboard-ink))]')
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="border-b border-[hsl(var(--dashboard-border))] px-4 py-5 sm:px-6">
        <h2 className="text-sm font-bold text-[hsl(var(--dashboard-ink))]">Filtros de solicitações</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <label className="block min-w-0 text-xs font-semibold text-[hsl(var(--dashboard-muted))]">
            Tipo de solicitação
            <select
              value={requestType}
              onChange={(event) => { setRequestType(event.target.value as RequestType); setPage(1); }}
              className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-sm font-normal text-[hsl(var(--dashboard-ink))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
            >
              <option value="all">Todas</option>
              <option value="quote">Solicitou orçamento</option>
              <option value="contact">Solicitou contato</option>
            </select>
          </label>
          <label className="block min-w-0 text-xs font-semibold text-[hsl(var(--dashboard-muted))]">
            E-mail contém
            <input
              type="search"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Buscar por e-mail"
              autoComplete="off"
              className="mt-1.5 h-10 w-full rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-sm font-normal text-[hsl(var(--dashboard-ink))] placeholder:text-[hsl(var(--dashboard-muted))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
            />
          </label>
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-10 justify-self-start px-2 text-xs font-semibold text-[hsl(var(--dashboard-accent))] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--dashboard-accent))]"
          >
            Limpar filtros
          </button>
        </div>
        {period === 'custom' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-[hsl(var(--dashboard-muted))]">
              Data inicial
              <input type="date" value={customFrom} onChange={(event) => { setCustomFrom(event.target.value); setPage(1); }} className="mt-1.5 block h-10 w-full rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-sm font-normal text-[hsl(var(--dashboard-ink))]" />
            </label>
            <label className="text-xs font-semibold text-[hsl(var(--dashboard-muted))]">
              Data final
              <input type="date" value={customTo} onChange={(event) => { setCustomTo(event.target.value); setPage(1); }} className="mt-1.5 block h-10 w-full rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-sm font-normal text-[hsl(var(--dashboard-ink))]" />
            </label>
          </div>
        )}
        {!validDates && <p role="alert" className="mt-2 text-xs text-red-600">Informe um intervalo de datas válido.</p>}
      </div>

      <div className="px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div aria-live="polite" className="text-sm font-bold text-[hsl(var(--dashboard-ink))]">
            {loading ? 'Carregando solicitações...' : total + (total === 1 ? ' solicitação encontrada' : ' solicitações encontradas')}
          </div>
          <button
            type="button"
            onClick={exportFiltered}
            disabled={loading || exporting || !total || !validDates}
            className="min-h-9 text-xs font-semibold text-[hsl(var(--dashboard-accent))] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--dashboard-accent))] disabled:cursor-not-allowed disabled:text-[hsl(var(--dashboard-muted))] disabled:no-underline"
          >
            {exporting ? 'Exportando...' : 'Baixar solicitações (CSV)'}
          </button>
        </div>

        {exportError && <p role="alert" className="mb-3 text-xs text-red-600">{exportError}</p>}
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
            <p>Não foi possível carregar as solicitações. {error}</p>
            <button type="button" onClick={() => setRefresh((count) => count + 1)} className="mt-3 font-semibold text-[hsl(var(--dashboard-accent))] underline">
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div data-testid="company-leads-loading" className="space-y-2" aria-label="Carregando lista">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-[hsl(var(--dashboard-surface))]" />)}
          </div>
        ) : leads.length === 0 ? (
          <div role="status" className="rounded-xl border border-dashed border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface)/0.2)] p-8 text-center">
            <p className="text-sm font-semibold text-[hsl(var(--dashboard-ink))]">Nenhuma solicitação neste período.</p>
            <p className="mt-2 text-xs text-[hsl(var(--dashboard-muted))]">Ajuste os filtros para consultar outros registros.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <caption className="sr-only">Solicitações recebidas pela empresa</caption>
                <thead>
                  <tr className="border-b border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-muted))]">
                    <th scope="col" className="w-[27%] px-3 py-3 font-semibold">Contato</th>
                    <th scope="col" className="w-[20%] px-3 py-3 font-semibold">Segmento</th>
                    <th scope="col" className="w-[23%] px-3 py-3 font-semibold">Tipo de solicitação</th>
                    <th scope="col" className="w-[18%] px-3 py-3 font-semibold">Data de envio</th>
                    <th scope="col" className="w-[12%] px-2 py-3 font-semibold">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[hsl(var(--dashboard-border))] last:border-b-0 hover:bg-[hsl(var(--dashboard-surface))] transition-colors">
                      <td className="px-3 py-3 align-top">
                        <div className="truncate font-semibold text-[hsl(var(--dashboard-ink))]" title={readable(lead.name)}>{readable(lead.name)}</div>
                        <div className="mt-1 truncate text-[11px] text-[hsl(var(--dashboard-muted))]" title={lead.email ?? ''}>{readable(lead.email)}</div>
                      </td>
                      <td className="px-3 py-3 align-middle text-[hsl(var(--dashboard-muted))]">{readable(lead.product_vertical)}</td>
                      <td className="px-3 py-3 align-middle text-[hsl(var(--dashboard-muted))]">{requestLabel(lead.request_type)}</td>
                      <td className="px-3 py-3 align-middle text-[hsl(var(--dashboard-muted))]">{toDate(lead.created_at)}</td>
                      <td className="px-2 py-3 align-middle">
                        <button type="button" onClick={() => setSelected(lead)} className="min-h-9 whitespace-nowrap font-semibold text-[hsl(var(--dashboard-accent))] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--dashboard-accent))]" aria-label={'Ver detalhes de ' + readable(lead.name)}>
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[hsl(var(--dashboard-border))] rounded-xl border border-[hsl(var(--dashboard-border))] lg:hidden">
              {leads.map((lead) => (
                <article key={lead.id} className="px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[hsl(var(--dashboard-ink))]">{readable(lead.name)}</h3>
                      <p className="mt-0.5 truncate text-xs text-[hsl(var(--dashboard-muted))]">{readable(lead.email)}</p>
                    </div>
                    <time className="shrink-0 text-[11px] text-[hsl(var(--dashboard-muted))]" dateTime={lead.created_at}>{toDate(lead.created_at)}</time>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 text-xs text-[hsl(var(--dashboard-muted))]">
                      <span className="font-semibold text-[hsl(var(--dashboard-ink))]">{requestLabel(lead.request_type)}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{readable(lead.product_vertical)}</span>
                    </div>
                    <button type="button" onClick={() => setSelected(lead)} className="min-h-9 whitespace-nowrap text-xs font-semibold text-[hsl(var(--dashboard-accent))] hover:underline" aria-label={'Ver detalhes de ' + readable(lead.name)}>
                      Ver detalhes
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!loading && !error && totalPages > 1 && (
          <nav aria-label="Paginação de solicitações" className="mt-5 flex items-center justify-between gap-3 border-t border-[hsl(var(--dashboard-border))] pt-4">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="min-h-9 rounded-lg border border-[hsl(var(--dashboard-border))] px-3 text-xs font-semibold text-[hsl(var(--dashboard-ink))] hover:bg-[hsl(var(--dashboard-surface))] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs text-[hsl(var(--dashboard-muted))]">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className="min-h-9 rounded-lg border border-[hsl(var(--dashboard-border))] px-3 text-xs font-semibold text-[hsl(var(--dashboard-ink))] hover:bg-[hsl(var(--dashboard-surface))] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </nav>
        )}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] text-[hsl(var(--dashboard-ink))]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[hsl(var(--dashboard-ink))]">Detalhes da solicitação</DialogTitle>
            <DialogDescription className="text-xs text-[hsl(var(--dashboard-muted))]">Informações do registro associado à empresa selecionada.</DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {([
                ['Nome', selected.name],
                ['E-mail', selected.email],
                ['Telefone', selected.phone],
                ['Segmento', selected.product_vertical],
                ['Tipo', requestLabel(selected.request_type)],
                ['Data', toDate(selected.created_at)],
                ['Localização', [selected.city, selected.state].filter(Boolean).join(' / ') || selected.location],
                ['Origem', selected.source],
              ] as [string, string | null | undefined][]).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-semibold text-[hsl(var(--dashboard-muted))]">{label}</dt>
                  <dd className="mt-1 break-words text-[hsl(var(--dashboard-ink))]">{readable(value)}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-[hsl(var(--dashboard-muted))]">Mensagem</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-[hsl(var(--dashboard-ink))]">{readable(selected.message)}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
