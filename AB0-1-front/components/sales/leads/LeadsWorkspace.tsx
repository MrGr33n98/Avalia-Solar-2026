'use client';

import { useState, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  Kanban,
  LayoutList,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateLeadModal from './create/CreateLeadModal';
import SalesCommandCenter from '@/components/sales/SalesCommandCenter';
import NutshellReportCanvas from '@/components/sales/reports/nutshell/NutshellReportCanvas';
import { SalesLead } from '@/lib/api/sales/types';
import { salesKeys } from '@/lib/api/sales/queryKeys';

export default function LeadsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() || '/dashboard/sales/leads';
  const [, startTransition] = useTransition();

  const urlView = searchParams?.get?.('view') as 'list' | 'kanban' | 'map' | 'analytics' | null;
  const initialView =
    urlView && ['list', 'kanban', 'map', 'analytics'].includes(urlView) ? urlView : 'kanban';

  const [view, setView] = useState<'list' | 'kanban' | 'map' | 'analytics'>(initialView);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | undefined>();
  const [boardRefreshVersion, setBoardRefreshVersion] = useState(0);
  const queryClient = useQueryClient();

  const handleViewChange = (nextView: 'list' | 'kanban' | 'map' | 'analytics') => {
    setView(nextView);
    startTransition(() => {
      try {
        const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
        params.set('view', nextView);
        router.replace(`${pathname}?${params.toString()}`);
      } catch {
        // Fallback for tests or non-standard environments
      }
    });
  };

  const handleLeadCreated = (lead: SalesLead) => {
    if (lead.sales_pipeline_id) setSelectedPipelineId(lead.sales_pipeline_id);
    void queryClient.invalidateQueries({ queryKey: salesKeys.pipelines() });
    void queryClient.invalidateQueries({ queryKey: salesKeys.pipelineBoards() });
    setBoardRefreshVersion((current) => current + 1);
  };

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col gap-4 sm:gap-6 font-sans">
        {/* Workspace Top Header Bar - 2 Rows Responsive Architecture */}
        <div className="w-full min-w-0 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 lg:p-5 shadow-2xs">
          {/* Row 1 — Title, Identity and Primary Actions */}
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-900">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Leads
                </h1>
                <p className="truncate text-xs text-slate-500">
                  Gestão de oportunidades comerciais
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link href="/dashboard/sales/import?entity=leads">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex h-9 items-center gap-1.5 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
                  aria-label="Importar leads via CSV"
                >
                  <Download className="h-4 w-4 text-blue-700" />
                  <span className="hidden sm:inline">Importar CSV</span>
                  <span className="sm:hidden">Importar</span>
                </Button>
              </Link>

              <Button
                onClick={() => setCreateModalOpen(true)}
                size="sm"
                className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-900 px-3.5 text-xs font-bold text-white shadow-md hover:bg-indigo-950"
                aria-label="Adicionar Lead"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar Lead</span>
              </Button>
            </div>
          </div>

          {/* Row 2 — View Switcher Controls with internal horizontal scroll on mobile */}
          <div className="min-w-0 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/60 bg-slate-100 p-1 [scrollbar-width:none]">
                <button
                  onClick={() => handleViewChange('kanban')}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    view === 'kanban'
                      ? 'bg-white text-indigo-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-pressed={view === 'kanban'}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    view === 'list'
                      ? 'bg-white text-indigo-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-pressed={view === 'list'}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => handleViewChange('map')}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    view === 'map'
                      ? 'bg-white text-indigo-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-pressed={view === 'map'}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Mapa</span>
                </button>
                <button
                  onClick={() => handleViewChange('analytics')}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    view === 'analytics'
                      ? 'bg-white text-indigo-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-pressed={view === 'analytics'}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Métricas</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Saved Views Quick Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] py-0.5 text-xs min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Filtros:
            </span>
            {[
              { id: 'all', label: 'Todos os Leads' },
              { id: 'my_leads', label: 'Meus Leads' },
              { id: 'hot', label: 'Leads Quentes 🔥' },
              { id: 'closing_this_week', label: 'Fechando esta Semana' },
              { id: 'unassigned', label: 'Sem Responsável' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`shrink-0 px-3 py-1 rounded-xl font-semibold transition-all text-xs ${
                  activeFilter === f.id
                    ? 'bg-indigo-900 text-white shadow-2xs font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0 shrink-0">
            <div className="relative flex-1 sm:w-64 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <Input
                placeholder="Buscar lead por nome ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs border-slate-200 rounded-lg w-full bg-slate-50 focus:bg-white"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: salesKeys.pipelineBoards() });
                setBoardRefreshVersion((current) => current + 1);
              }}
              className="h-8 w-8 p-0 text-slate-500 shrink-0"
              aria-label="Atualizar dados"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Main Leads Workspace View Container */}
        {view === 'kanban' || view === 'list' ? (
          <SalesCommandCenter
            hideLayout
            pipelineOnly
            pipelineId={selectedPipelineId}
            refreshVersion={boardRefreshVersion}
            initialView={view === 'list' ? 'table' : 'kanban'}
            searchQuery={search}
            activeQuickFilter={activeFilter}
          />
        ) : view === 'map' ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
            <MapPin className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Visão Geográfica de Leads</h3>
            <p className="text-xs">Mapeamento espacial das usinas e projetos solares dos leads cadastrados.</p>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <NutshellReportCanvas
              initialReportType="sales"
              titleOverride="Relatório & Funil de Conversão"
              subtitleOverride="Análise de vendas, projeções e novos leads no pipeline comercial com dados 100% reais."
            />
          </div>
        )}
      </div>

      {/* Canonical Create Lead Modal */}
      <CreateLeadModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleLeadCreated}
      />
    </SalesLayoutWrapper>
  );
}
