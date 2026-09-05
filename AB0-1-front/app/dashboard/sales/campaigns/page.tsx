'use client';

import React, { useCallback, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CampaignsHeader from '@/components/sales/campaigns/CampaignsHeader';
import CampaignAnalyticsCards from '@/components/sales/campaigns/CampaignAnalyticsCards';
import CampaignsTable from '@/components/sales/campaigns/CampaignsTable';
import CampaignWizardModal from '@/components/sales/campaigns/CampaignWizardModal';
import {
  fetchCampaigns,
  createCampaign,
  snapshotCampaign,
  dispatchCampaign,
  pauseCampaign,
  resumeCampaign,
  retryFailedCampaign,
  CampaignSummary,
} from '@/lib/api-campaigns';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function CampaignsWorkspacePage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [query, setQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  const loadCampaigns = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchCampaigns({ page, per_page: 20, q: query || undefined, status: statusFilter || undefined })
      .then((data) => {
        setCampaigns(data.campaigns ?? []);
        setTotalPages(data.meta?.total_pages ?? 1);
      })
      .catch((err) => {
        setError(err.message || 'Falha ao carregar campanhas de marketing.');
      })
      .finally(() => setLoading(false));
  }, [page, query, statusFilter]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleCreateCampaign = async (payload: {
    name: string;
    campaign_type: string;
    email_template_id?: number | null;
    audience_filter: Record<string, any>;
  }) => {
    await createCampaign(payload);
    loadCampaigns();
  };

  const handleSnapshot = async (id: number) => {
    try {
      await snapshotCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar snapshot da audiência.');
    }
  };

  const handleDispatch = async (id: number) => {
    try {
      await dispatchCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar disparo da campanha.');
    }
  };

  const handlePause = async (id: number) => {
    try {
      await pauseCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Erro ao pausar campanha.');
    }
  };

  const handleResume = async (id: number) => {
    try {
      await resumeCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Erro ao retomar campanha.');
    }
  };

  const handleRetryFailed = async (id: number) => {
    try {
      await retryFailedCampaign(id);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Erro ao re-tentar destinatários com falha.');
    }
  };

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6 font-sans pb-16">
        <CampaignsHeader onCreateCampaign={() => setIsWizardOpen(true)} />

        <CampaignAnalyticsCards campaigns={campaigns} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar campanhas por nome ou chave..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="scheduled">Agendado</option>
              <option value="dispatching">Disparando</option>
              <option value="paused">Pausado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
        </div>

        {/* Campaigns Table */}
        <CampaignsTable
          campaigns={campaigns}
          loading={loading}
          error={error}
          onSnapshot={handleSnapshot}
          onDispatch={handleDispatch}
          onPause={handlePause}
          onResume={handleResume}
          onRetryFailed={handleRetryFailed}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <span className="text-slate-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}

        <CampaignWizardModal
          open={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSubmit={handleCreateCampaign}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
