'use client';

import { useMemo, useState } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  Route,
  Users,
  Code2,
  Cpu,
  Settings,
  Link2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { companyDashboardApi } from '@/lib/api';

import ProspectsOverviewTab from './prospects/ProspectsOverviewTab';
import ProspectsJourneyTab from './prospects/ProspectsJourneyTab';
import ProspectsVisitorsTab from './prospects/ProspectsVisitorsTab';
import ProspectsInstallationTab from './prospects/ProspectsInstallationTab';
import ProspectsIntegrationsTab from './prospects/ProspectsIntegrationsTab';
import ProspectsSettingsTab from './prospects/ProspectsSettingsTab';
import ProspectJourneyDrawer from './prospects/ProspectJourneyDrawer';
import UtmLinkBuilder from './UtmLinkBuilder';

type CompanyProps = {
  id?: number | string;
  slug?: string | null;
  name?: string | null;
};

type Props = { companyId: string; company?: CompanyProps };
type WorkspaceTab = 'overview' | 'journey' | 'visitors' | 'installation' | 'integrations' | 'settings' | 'utm_builder';

const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'journey', label: 'Jornada', icon: Route },
  { id: 'visitors', label: 'Contas e visitantes', icon: Users },
  { id: 'installation', label: 'Instalação da tag', icon: Code2 },
  { id: 'integrations', label: 'Integrações', icon: Cpu },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'utm_builder', label: 'Links UTM', icon: Link2 },
];

export default function TrackingAttributionWorkspace({ companyId, company }: Props) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [preset, setPreset] = useState<'7d' | '30d' | '90d' | '180d' | '365d'>('30d');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [evidenceFilter, setEvidenceFilter] = useState('');
  const [selectedClickId, setSelectedClickId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['prospects-workspace', companyId, preset, page, search, evidenceFilter],
    queryFn: () =>
      companyDashboardApi.getProspectsWorkspace(companyId, {
        preset,
        page,
        per_page: 15,
        search: search || undefined,
        evidence_status: evidenceFilter || undefined,
      }),
    enabled: Boolean(companyId),
    retry: 1,
  });

  const data = query.data;
  const isTagMissing = data?.status === 'tag_not_installed';
  const isInactive = data?.status === 'inactive';
  const isUnavailable = query.isError || data?.status === 'unavailable' || data?.status === 'error';

  const statusDescription = useMemo(() => {
    if (isTagMissing) return 'A tag de rastreamento ainda não foi instrumentada no site parceiro.';
    if (isInactive) return 'O rastreamento da tag está pausado no momento.';
    if (data?.status === 'configured_no_evidence') return 'Tag configurada. Aguardando os primeiros cliques e chegadas.';
    if (data?.status === 'active_no_attributed_traffic') return 'Nenhum tráfego atribuído foi identificado neste período selecionado.';
    if (isUnavailable) return 'A telemetria está temporariamente indisponível no servidor.';
    return 'Telemetria e atribuição determinística ponta a ponta em tempo real.';
  }, [data?.status, isTagMissing, isInactive, isUnavailable]);

  return (
    <main className="space-y-6" aria-labelledby="tracking-workspace-title">
      {/* Workspace Header & Shell Breadcrumb */}
      <header className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[hsl(var(--dashboard-muted))]">
                Performance &gt;
              </span>
              <span className="text-xs font-semibold text-[hsl(var(--dashboard-ink))]">
                Track Your Prospects
              </span>
              {company?.name && (
                <Badge variant="outline" className="text-xs">
                  {company.name}
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Telemetria Auditável (Sem Mocks)
              </span>
            </div>

            <h1
              id="tracking-workspace-title"
              className="text-2xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))] sm:text-3xl"
            >
              Track Your Prospects
            </h1>

            <p className="text-sm leading-relaxed text-[hsl(var(--dashboard-muted))]">
              Monitore compradores qualificados que descobrem sua empresa no Avalia Solar e aterrissam no seu site com atribuição determinística via Tag Parceira V2 e conformidade LGPD.
            </p>
          </div>

          {/* Time Controls */}
          <div className="flex flex-wrap items-center gap-2" aria-label="Seletor de Período">
            {(['7d', '30d', '90d', '180d', '365d'] as const).map((opt) => (
              <Button
                key={opt}
                type="button"
                size="sm"
                variant={preset === opt ? 'default' : 'outline'}
                onClick={() => {
                  setPreset(opt);
                  setPage(1);
                }}
                className="h-8 rounded-xl text-xs"
              >
                {opt}
              </Button>
            ))}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="h-8 rounded-xl text-xs gap-1.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Atualizar
            </Button>
          </div>
        </div>

        <p role="status" className="mt-4 text-xs font-medium text-[hsl(var(--dashboard-muted))]">
          {statusDescription}
        </p>
      </header>

      {/* 6 Tabs Navigation */}
      <nav
        aria-label="Abas do Track Your Prospects"
        className="overflow-x-auto border-b border-[hsl(var(--dashboard-border))]"
      >
        <div className="flex min-w-max gap-1" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-[hsl(var(--dashboard-muted))] hover:text-[hsl(var(--dashboard-ink))]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      {query.isLoading ? (
        <div className="space-y-4" aria-label="Carregando workspace">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : isUnavailable ? (
        <section
          role="alert"
          className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-sm space-y-3"
        >
          <h2 className="text-base font-semibold text-amber-700 dark:text-amber-400">
            Telemetria temporariamente indisponível
          </h2>
          <p className="text-xs text-[hsl(var(--dashboard-muted))]">
            Não foi possível carregar os registros de prospecção para este período.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </section>
      ) : data ? (
        <>
          {activeTab === 'overview' && (
            <ProspectsOverviewTab
              data={data}
              companyId={companyId}
              onSelectProspect={(id) => setSelectedClickId(id)}
              onPageChange={(p) => setPage(p)}
              onFilterChange={(f) => {
                if (f.search !== undefined) setSearch(f.search);
                if (f.evidence_status !== undefined) setEvidenceFilter(f.evidence_status);
                setPage(1);
              }}
              currentSearch={search}
              currentEvidenceFilter={evidenceFilter}
            />
          )}

          {activeTab === 'journey' && (
            <ProspectsJourneyTab
              data={data}
              onSelectProspect={(id) => setSelectedClickId(id)}
            />
          )}

          {activeTab === 'visitors' && (
            <ProspectsVisitorsTab
              data={data}
              onSelectProspect={(id) => setSelectedClickId(id)}
            />
          )}

          {activeTab === 'installation' && (
            <ProspectsInstallationTab
              data={data}
              companyId={companyId}
              onRefresh={() => query.refetch()}
            />
          )}

          {activeTab === 'integrations' && (
            <ProspectsIntegrationsTab
              data={data}
              companyId={companyId}
              onRefresh={() => query.refetch()}
            />
          )}

          {activeTab === 'settings' && (
            <ProspectsSettingsTab
              data={data}
              companyId={companyId}
              onRefresh={() => query.refetch()}
            />
          )}

          {activeTab === 'utm_builder' && (
            <UtmLinkBuilder companyId={companyId} company={company} />
          )}

          {/* Lateral Journey Drawer & Mobile Sheet */}
          <ProspectJourneyDrawer
            companyId={companyId}
            clickId={selectedClickId}
            open={Boolean(selectedClickId)}
            onClose={() => setSelectedClickId(null)}
          />
        </>
      ) : null}
    </main>
  );
}
