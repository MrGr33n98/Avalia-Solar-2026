'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateLeadModal from './create/CreateLeadModal';
import SalesCommandCenter from '@/components/sales/SalesCommandCenter';
import { SalesLead } from '@/lib/api/sales/types';

export default function LeadsWorkspace() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get('view') as 'list' | 'kanban' | 'map' | 'analytics') || 'kanban';

  const [view, setView] = useState<'list' | 'kanban' | 'map' | 'analytics'>(initialView);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | undefined>();
  const [boardRefreshVersion, setBoardRefreshVersion] = useState(0);

  const handleLeadCreated = (lead: SalesLead) => {
    if (lead.sales_pipeline_id) setSelectedPipelineId(lead.sales_pipeline_id);
  };

  return (
    <SalesLayoutWrapper>
      <div className="flex flex-col gap-6 font-sans">
        {/* Workspace Top Header Bar */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-900 border border-indigo-100">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                Leads Workspace
                <Badge className="bg-indigo-100 text-indigo-800 text-[11px] font-bold">Avalia Solar CRM</Badge>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gerencie todos os leads comerciais B2B, oportunidades e estágios do seu pipeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Controls */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'kanban' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'list' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" /> Lista
              </button>
              <button
                onClick={() => setView('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'map' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Mapa
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'analytics' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Métricas
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard/sales/import?entity=leads">
                <Button
                  variant="outline"
                  className="h-11 px-4 text-xs font-bold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-blue-700" /> Importar CSV
                </Button>
              </Link>

              <Button
                onClick={() => setCreateModalOpen(true)}
                className="h-11 px-5 text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary Saved Views Quick Navigation Bar */}
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filtros Rápidos:</span>
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
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  activeFilter === f.id
                    ? 'bg-indigo-900 text-white shadow-2xs font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <Input
                placeholder="Buscar lead por nome ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs border-slate-200 rounded-lg w-64 bg-slate-50 focus:bg-white"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBoardRefreshVersion((current) => current + 1)}
              className="h-8 text-xs text-slate-500"
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
          />
        ) : view === 'map' ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
            <MapPin className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Visão Geográfica de Leads</h3>
            <p className="text-xs">Mapeamento espacial das usinas e projetos solares dos leads cadastrados.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
            <BarChart3 className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Relatório & Funil de Conversão</h3>
            <p className="text-xs">Análise agregada de taxas de ganho, ciclo médio de vendas e volume por origem.</p>
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
