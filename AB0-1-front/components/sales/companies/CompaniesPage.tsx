'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateCompanyModal from '@/components/sales/create/CreateCompanyModal';
import { Button } from '@/components/ui/button';
import CompaniesColumnsDialog, { CompanyColumnConfig } from './CompaniesColumnsDialog';
import CompaniesDuplicateManager from './CompaniesDuplicateManager';
import CompaniesTable, { CompanyListItem } from './CompaniesTable';
import CompaniesToolbar from './CompaniesToolbar';
import CRMAdvancedFilterPanel, { CRMFilterState, INITIAL_FILTER_STATE } from '@/components/sales/filters/CRMAdvancedFilterPanel';
import CRMEntityViewsSidebar from '@/components/sales/views/CRMEntityViewsSidebar';
import CRMBulkActionBar from '@/components/sales/bulk/CRMBulkActionBar';

export default function CompaniesPage() {
  const [accounts, setAccounts] = useState<CompanyListItem[]>([]);
  const [query, setQuery] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false);
  const [isDuplicateManagerOpen, setIsDuplicateManagerOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isViewsSidebarOpen, setIsViewsSidebarOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<CRMFilterState>(INITIAL_FILTER_STATE);

  const [columns, setColumns] = useState<CompanyColumnConfig>(() => {
    const defaults: CompanyColumnConfig = {
      company_name: true,
      primary_contact: true,
      last_contact: true,
      address: true,
      company_type: true,
      tags: true,
      open_opps: true,
    };
    if (typeof window === 'undefined') return defaults;
    try {
      return {
        ...defaults,
        ...JSON.parse(window.localStorage.getItem('crm:accounts:columns') || '{}'),
      };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('crm:accounts:columns', JSON.stringify(columns));
  }, [columns]);

  const { user } = useAuth();

  const fetchAccounts = useCallback(() => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      setError('Sem conexão com a internet. Verifique sua rede e tente novamente.');
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedOwnerId === 'me' && user?.id) {
      params.set('owner_id', String(user.id));
    } else if (selectedOwnerId && selectedOwnerId !== 'me') {
      params.set('owner_id', selectedOwnerId);
    }
    if (selectedType) params.set('segment', selectedType);

    // Advanced Filter parameters
    if (advancedFilters.segment) params.set('segment', advancedFilters.segment);
    if (advancedFilters.state) params.set('state', advancedFilters.state);
    if (advancedFilters.city) params.set('city', advancedFilters.city);
    if (advancedFilters.status) params.set('status', advancedFilters.status);
    if (advancedFilters.owner_id === 'me' && user?.id) {
      params.set('owner_id', String(user.id));
    } else if (advancedFilters.owner_id && advancedFilters.owner_id !== 'me') {
      params.set('owner_id', advancedFilters.owner_id);
    }
    if (advancedFilters.has_email) params.set('has_email', 'true');
    if (advancedFilters.has_phone) params.set('has_phone', 'true');

    params.set('page', String(page));
    params.set('per_page', '50');

    fetch(`/api/v1/sales/accounts?${params.toString()}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 401) throw new Error('Sessão expirada. Por favor, faça login novamente.');
        if (res.status === 403) throw new Error('Acesso não autorizado para visualizar empresas.');
        if (res.status >= 500) throw new Error('Servidor indisponível no momento. Tente novamente.');
        if (!res.ok) throw new Error('Não foi possível carregar a lista de empresas.');
        return res.json();
      })
      .then((data) => {
        setAccounts(data.accounts ?? []);
        setTotalPages(data.meta?.total_pages ?? 1);
        setTotalCount(data.meta?.total ?? 0);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
          setError('Não foi possível alcançar a API do CRM. Verifique sua conexão.');
        } else {
          setError(err.message || 'Erro ao conectar à API do CRM.');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query, selectedOwnerId, selectedType, advancedFilters, page, user?.id]);

  useEffect(() => {
    const cleanup = fetchAccounts();
    const handleAccountCreated = () => fetchAccounts();
    if (typeof window !== 'undefined') {
      window.addEventListener('crm:account-created', handleAccountCreated);
    }
    return () => {
      cleanup?.();
      if (typeof window !== 'undefined') {
        window.removeEventListener('crm:account-created', handleAccountCreated);
      }
    };
  }, [fetchAccounts]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedOwnerId === 'me' && user?.id) {
        params.set('owner_id', String(user.id));
      } else if (selectedOwnerId && selectedOwnerId !== 'me') {
        params.set('owner_id', selectedOwnerId);
      }
      if (selectedType) params.set('segment', selectedType);
      if (selectedIds.length > 0) {
        selectedIds.forEach((id) => params.append('ids[]', String(id)));
      }

      const response = await fetch('/api/v1/sales/accounts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar arquivo de exportação no servidor.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `companies_export_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar CSV.');
    }
  };

  const activeFilterCount = Object.entries(advancedFilters).filter(([_, val]) =>
    typeof val === 'boolean' ? val : Boolean(val)
  ).length;

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6 font-sans pb-16">
        <CompaniesToolbar
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          count={totalCount}
          selectedOwnerId={selectedOwnerId}
          onOwnerSelect={setSelectedOwnerId}
          selectedType={selectedType}
          onTypeSelect={(value) => {
            setSelectedType(value);
            setPage(1);
          }}
          onOpenColumnsDialog={() => setIsColumnsDialogOpen(true)}
          onCreateCompany={() => setIsCreateCompanyModalOpen(true)}
          onExportCsv={handleExportCsv}
          onManageDuplicates={() => setIsDuplicateManagerOpen(true)}
          onOpenViewsSidebar={() => setIsViewsSidebarOpen(true)}
          onOpenAdvancedFilters={() => setIsAdvancedFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />

        <CompaniesTable
          accounts={accounts}
          loading={loading}
          error={error}
          columns={columns}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelect={handleToggleSelect}
          onRetry={fetchAccounts}
          onCreateCompany={() => setIsCreateCompanyModalOpen(true)}
        />

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

        <CompaniesColumnsDialog
          open={isColumnsDialogOpen}
          onClose={() => setIsColumnsDialogOpen(false)}
          columns={columns}
          onChange={setColumns}
        />

        <CompaniesDuplicateManager
          open={isDuplicateManagerOpen}
          onClose={() => setIsDuplicateManagerOpen(false)}
          onMerged={fetchAccounts}
        />

        <CreateCompanyModal
          open={isCreateCompanyModalOpen}
          onClose={() => setIsCreateCompanyModalOpen(false)}
          onSuccess={fetchAccounts}
        />

        <CRMEntityViewsSidebar
          open={isViewsSidebarOpen}
          onClose={() => setIsViewsSidebarOpen(false)}
          activeFilterState={advancedFilters}
          onSelectView={(viewFilters, name) => {
            setAdvancedFilters({
              ...INITIAL_FILTER_STATE,
              ...viewFilters,
            });
            setPage(1);
          }}
        />

        <CRMAdvancedFilterPanel
          open={isAdvancedFiltersOpen}
          onClose={() => setIsAdvancedFiltersOpen(false)}
          filters={advancedFilters}
          onApply={(newFilters) => {
            setAdvancedFilters(newFilters);
            setPage(1);
          }}
          onReset={() => {
            setAdvancedFilters(INITIAL_FILTER_STATE);
            setPage(1);
          }}
        />

        <CRMBulkActionBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          onSuccess={fetchAccounts}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
