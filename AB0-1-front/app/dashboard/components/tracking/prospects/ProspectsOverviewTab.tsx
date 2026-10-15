'use client';

import { useState } from 'react';
import {
  MousePointerClick,
  CheckCircle,
  TrendingUp,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ProspectsWorkspaceResponse, ProspectRecord } from '@/lib/api';

interface Props {
  data: ProspectsWorkspaceResponse;
  companyId: string | number;
  onSelectProspect: (clickId: string) => void;
  onPageChange: (newPage: number) => void;
  onFilterChange: (filters: { search?: string; evidence_status?: string }) => void;
  currentSearch: string;
  currentEvidenceFilter: string;
}

export default function ProspectsOverviewTab({
  data,
  companyId,
  onSelectProspect,
  onPageChange,
  onFilterChange,
  currentSearch,
  currentEvidenceFilter,
}: Props) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const { summary, timeseries, source_breakdown, records, pagination } = data;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchInput, evidence_status: currentEvidenceFilter });
  };

  const handleEvidenceSelect = (status: string) => {
    onFilterChange({ search: currentSearch, evidence_status: status });
  };

  const getEvidenceBadge = (status: ProspectRecord['evidence_status']) => {
    switch (status) {
      case 'click_only':
        return (
          <Badge variant="outline" className="border-slate-500/30 text-slate-600 bg-slate-500/10">
            Apenas clique
          </Badge>
        );
      case 'landing_verified':
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
            Chegada verificada
          </Badge>
        );
      case 'form_event_observed':
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10">
            Formulário observado
          </Badge>
        );
      case 'lead_confirmed':
        return (
          <Badge variant="outline" className="border-purple-500/30 text-purple-600 bg-purple-500/10">
            Lead confirmado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderTrend = (value: number | null) => {
    if (value === null || value === undefined) {
      return <span className="text-xs text-[hsl(var(--dashboard-muted))]">— vs período anterior</span>;
    }
    const isPositive = value >= 0;
    return (
      <span
        className={`inline-flex items-center text-xs font-semibold ${
          isPositive ? 'text-emerald-600' : 'text-rose-600'
        }`}
      >
        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {Math.abs(value)}% vs anterior
      </span>
    );
  };

  const exportCsvUrl = `/api/v1/company_dashboard/analytics/prospects/export?company_id=${companyId}&from=${data.range.from}&to=${data.range.to}${
    currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ''
  }${currentEvidenceFilter ? `&evidence_status=${encodeURIComponent(currentEvidenceFilter)}` : ''}`;

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Métricas de Desempenho">
        {/* Card 1: Cliques Reais */}
        <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--dashboard-muted))]">
              Cliques no Marketplace
            </span>
            <div className="rounded-xl p-2 bg-blue-500/10 text-blue-600">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">
            {summary.clicks.toLocaleString('pt-BR')}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {renderTrend(summary.trends.clicks_change_pct)}
            <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">Origem Avalia Solar</span>
          </div>
        </div>

        {/* Card 2: Chegadas Verificadas */}
        <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--dashboard-muted))]">
              Chegadas Verificadas
            </span>
            <div className="rounded-xl p-2 bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">
            {summary.verified_landings.toLocaleString('pt-BR')}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {renderTrend(summary.trends.landings_change_pct)}
            <span className="text-[11px] font-medium text-emerald-600">
              {summary.landing_rate !== null ? `${summary.landing_rate}% do total` : '—'}
            </span>
          </div>
        </div>

        {/* Card 3: Conversões Confirmadas */}
        <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--dashboard-muted))]">
              Conversões Confirmadas
            </span>
            <div className="rounded-xl p-2 bg-purple-500/10 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">
            {summary.confirmed_conversions.toLocaleString('pt-BR')}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {renderTrend(summary.trends.conversions_change_pct)}
            <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">Verificadas</span>
          </div>
        </div>

        {/* Card 4: Taxa de Conversão */}
        <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--dashboard-muted))]">
              Taxa de Conversão
            </span>
            <div className="rounded-xl p-2 bg-amber-500/10 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">
            {summary.conversion_rate !== null ? `${summary.conversion_rate}%` : '—'}
          </p>
          <div className="mt-2">
            <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">
              {summary.verified_landings > 0
                ? `${summary.confirmed_conversions} de ${summary.verified_landings} chegadas`
                : 'Aguardando chegadas'}
            </span>
          </div>
        </div>
      </section>

      {/* Gráfico Temporal e Distribuição por Origem */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico Temporal (2 cols) */}
        <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
                Evolução Temporal no Período
              </h3>
              <p className="text-xs text-[hsl(var(--dashboard-muted))]">
                Cliques de saída no marketplace vs. chegadas verificadas no seu site
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[hsl(var(--dashboard-muted))]">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Cliques
              </span>
              <span className="flex items-center gap-1 text-[hsl(var(--dashboard-muted))]">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Chegadas
              </span>
              <span className="flex items-center gap-1 text-[hsl(var(--dashboard-muted))]">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Conversões
              </span>
            </div>
          </div>

          {timeseries.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[hsl(var(--dashboard-muted))] border border-dashed rounded-xl">
              Nenhuma telemetria registrada neste intervalo.
            </div>
          ) : (
            <div className="h-52 w-full pt-4">
              <div className="flex h-40 items-end gap-1.5 overflow-x-auto pb-2">
                {timeseries.map((pt, i) => {
                  const maxVal = Math.max(...timeseries.map((t) => Math.max(t.clicks, t.verified_landings)), 1);
                  const clicksH = Math.max((pt.clicks / maxVal) * 100, 4);
                  const landingsH = Math.max((pt.verified_landings / maxVal) * 100, pt.verified_landings > 0 ? 4 : 0);
                  const shortDate = pt.date.slice(5);

                  return (
                    <div
                      key={i}
                      className="group relative flex-1 min-w-[20px] flex flex-col items-center justify-end h-full gap-0.5"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-12 z-20 hidden rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block whitespace-nowrap">
                        <div className="font-semibold">{pt.date}</div>
                        <div>Cliques: {pt.clicks} | Chegadas: {pt.verified_landings} | Conv: {pt.conversions}</div>
                      </div>

                      {/* Bar columns */}
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div
                          style={{ height: `${clicksH}%` }}
                          className="w-2 rounded-t-xs bg-blue-500/80 hover:bg-blue-600 transition-all"
                        />
                        {pt.verified_landings > 0 && (
                          <div
                            style={{ height: `${landingsH}%` }}
                            className="w-2 rounded-t-xs bg-emerald-500/80 hover:bg-emerald-600 transition-all"
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-[hsl(var(--dashboard-muted))] truncate w-full text-center">
                        {shortDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Breakdown por Origem (1 col) */}
        <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
              Origem no Marketplace
            </h3>
            <p className="text-xs text-[hsl(var(--dashboard-muted))]">
              Distribuição por ponto de contato
            </p>
          </div>

          {source_breakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[hsl(var(--dashboard-muted))] border border-dashed rounded-xl">
              Nenhuma origem observada no período.
            </div>
          ) : (
            <div className="space-y-3">
              {source_breakdown.map((src) => (
                <div key={src.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[hsl(var(--dashboard-ink))]">{src.label}</span>
                    <span className="text-[hsl(var(--dashboard-muted))]">
                      {src.clicks} cliques ({src.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[hsl(var(--dashboard-surface))] overflow-hidden flex">
                    <div
                      style={{ width: `${src.percentage}%` }}
                      className="bg-blue-600 rounded-full transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Registros com Filtros e Exportação */}
      <section className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-[hsl(var(--dashboard-border))] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))]">
              Registros e Atribuições
            </h3>
            <p className="text-xs text-[hsl(var(--dashboard-muted))]">
              Telemetria individual de cada interação de tráfego ({pagination.total_count} registros)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--dashboard-muted))]" />
              <Input
                type="search"
                placeholder="Buscar por URL ou origem..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-9 text-xs w-56 rounded-xl"
              />
            </form>

            {/* Evidence Status Filter */}
            <div className="flex items-center rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleEvidenceSelect('')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  currentEvidenceFilter === '' ? 'bg-[hsl(var(--dashboard-panel))] shadow-xs' : 'text-[hsl(var(--dashboard-muted))]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => handleEvidenceSelect('landing_verified')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  currentEvidenceFilter === 'landing_verified' ? 'bg-[hsl(var(--dashboard-panel))] shadow-xs text-emerald-600' : 'text-[hsl(var(--dashboard-muted))]'
                }`}
              >
                Verificados
              </button>
              <button
                type="button"
                onClick={() => handleEvidenceSelect('click_only')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  currentEvidenceFilter === 'click_only' ? 'bg-[hsl(var(--dashboard-panel))] shadow-xs' : 'text-[hsl(var(--dashboard-muted))]'
                }`}
              >
                Apenas Clique
              </button>
            </div>

            {/* CSV Export Button */}
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl">
              <a href={exportCsvUrl} download>
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </a>
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[hsl(var(--dashboard-surface))] border-b border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-muted))]">
              <tr>
                <th className="py-3 px-4 font-semibold">Data/Hora (BRT)</th>
                <th className="py-3 px-4 font-semibold">Origem</th>
                <th className="py-3 px-4 font-semibold">Destino</th>
                <th className="py-3 px-4 font-semibold">Status de Evidência</th>
                <th className="py-3 px-4 font-semibold">Conta</th>
                <th className="py-3 px-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--dashboard-border))]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[hsl(var(--dashboard-muted))]">
                    Nenhum registro encontrado para este filtro ou período.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[hsl(var(--dashboard-surface)/40)] transition-colors cursor-pointer"
                    onClick={() => onSelectProspect(r.id)}
                  >
                    <td className="py-3 px-4 font-mono text-[hsl(var(--dashboard-ink))]">
                      {new Date(r.clicked_at).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[hsl(var(--dashboard-ink))]">{r.source_label}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <span className="text-[hsl(var(--dashboard-muted))]">{r.target_url}</span>
                    </td>
                    <td className="py-3 px-4">{getEvidenceBadge(r.evidence_status)}</td>
                    <td className="py-3 px-4 text-[hsl(var(--dashboard-ink))] font-medium">
                      {r.account_name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProspect(r.id);
                        }}
                        className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver Trilha
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.total_pages > 1 && (
          <div className="p-4 border-t border-[hsl(var(--dashboard-border))] flex items-center justify-between text-xs text-[hsl(var(--dashboard-muted))]">
            <span>
              Página {pagination.current_page} de {pagination.total_pages} ({pagination.total_count} itens)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className="h-8 px-2"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
