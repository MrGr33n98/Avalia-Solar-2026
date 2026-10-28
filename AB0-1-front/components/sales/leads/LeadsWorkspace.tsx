'use client';

import { useState, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  Download,
  Layers,
  MapPin,
  Plus,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateLeadModal from './create/CreateLeadModal';
import CreatePipelineModal from '../pipeline/CreatePipelineModal';
import SalesCommandCenter from '@/components/sales/SalesCommandCenter';
import LeadsAnalyticsView from './views/LeadsAnalyticsView';
import { SalesLead, NutshellFilterCriteria } from '@/lib/api/sales/types';
import { salesKeys } from '@/lib/api/sales/queryKeys';
import { useSalesPipelines } from '@/lib/api/sales/queries';
import NutshellFilterBar from '@/components/sales/filters/NutshellFilterBar';

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
  const [createPipelineModalOpen, setCreatePipelineModalOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | undefined>();
  const [boardRefreshVersion, setBoardRefreshVersion] = useState(0);
  const [nutshellFilters, setNutshellFilters] = useState<NutshellFilterCriteria>({});
  const queryClient = useQueryClient();

  const { data: pipelines = [] } = useSalesPipelines();
  const activePipeline = useMemo(() => {
    if (selectedPipelineId) return pipelines.find((p) => p.id === selectedPipelineId);
    return pipelines.find((p) => p.active) || pipelines[0];
  }, [pipelines, selectedPipelineId]);

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
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Leads
                  </h1>
                  {/* Seletor de Pipeline Ativo */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 rounded-lg border-indigo-200 bg-indigo-50/70 px-2 text-xs font-bold text-indigo-950 hover:bg-indigo-100 transition-colors shadow-2xs"
                        aria-label="Trocar pipeline"
                      >
                        <Layers className="h-3 w-3 text-indigo-700" />
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">
                          {activePipeline?.name || 'Vendas B2B'}
                        </span>
                        <ChevronDown className="h-3 w-3 text-indigo-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60 text-xs font-sans">
                      <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Funis / Pipelines Ativos
                      </DropdownMenuLabel>
                      {pipelines.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => {
                            setSelectedPipelineId(p.id);
                            void queryClient.invalidateQueries({ queryKey: salesKeys.pipelineBoards() });
                            setBoardRefreshVersion((v) => v + 1);
                          }}
                          className={`flex items-center justify-between cursor-pointer py-2 ${
                            p.id === activePipeline?.id ? 'bg-indigo-50 text-indigo-900 font-bold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{p.name}</span>
                          </div>
                          {p.id === activePipeline?.id && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setCreatePipelineModalOpen(true)}
                        className="gap-2 text-indigo-700 font-bold cursor-pointer py-2 hover:bg-indigo-50"
                      >
                        <Plus className="h-3.5 w-3.5 text-indigo-700" />
                        <span>Criar Novo Pipeline...</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="truncate text-xs text-slate-500">
                  Gestão de oportunidades comerciais e implantação
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatePipelineModalOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
                aria-label="Criar novo funil"
              >
                <Layers className="h-4 w-4 text-indigo-700" />
                <span className="hidden sm:inline">Novo Funil</span>
              </Button>

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

        </div>

        {/* Barra de Filtros Horizontal + Menu Cascata [+] (IBM Carbon Style) */}
        <NutshellFilterBar
          filters={nutshellFilters}
          onChange={setNutshellFilters}
          searchQuery={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={handleViewChange}
          activePipelineName={activePipeline?.name}
          onClearAll={() => {
            setNutshellFilters({});
            setSearch('');
            setActiveFilter('all');
          }}
        />

        {/* Main Leads Workspace View Container */}
        {view === 'kanban' || view === 'list' ? (
          <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs p-1">
            <SalesCommandCenter
              hideLayout
              pipelineOnly
              pipelineId={selectedPipelineId}
              refreshVersion={boardRefreshVersion}
              initialView={view === 'list' ? 'table' : 'kanban'}
              searchQuery={search}
              activeQuickFilter={activeFilter}
              customFilters={nutshellFilters}
            />
          </div>
        ) : view === 'map' ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
            <MapPin className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Visão Geográfica de Leads</h3>
            <p className="text-xs">Mapeamento espacial das usinas e projetos solares dos leads cadastrados.</p>
          </div>
        ) : (
          <LeadsAnalyticsView
            pipelineId={selectedPipelineId}
            searchQuery={search}
            filters={nutshellFilters}
          />
        )}
      </div>

      {/* Canonical Create Lead Modal */}
      <CreateLeadModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleLeadCreated}
      />

      {/* Modal de Criação de Pipelines (ex: Onboarding, Vendas) */}
      <CreatePipelineModal
        open={createPipelineModalOpen}
        onClose={() => setCreatePipelineModalOpen(false)}
        onSuccess={(created) => {
          setSelectedPipelineId(created.id);
          void queryClient.invalidateQueries({ queryKey: salesKeys.pipelines() });
          void queryClient.invalidateQueries({ queryKey: salesKeys.pipelineBoards() });
          setBoardRefreshVersion((v) => v + 1);
        }}
      />
    </SalesLayoutWrapper>
  );
}
