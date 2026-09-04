'use client';

import { useCallback, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateCompanyModal from '@/components/sales/create/CreateCompanyModal';
import { Button } from '@/components/ui/button';
import CompaniesColumnsDialog, { CompanyColumnConfig } from './CompaniesColumnsDialog';
import CompaniesDuplicateManager from './CompaniesDuplicateManager';
import CompaniesTable, { CompanyListItem } from './CompaniesTable';
import CompaniesToolbar from './CompaniesToolbar';

export default function CompaniesPage() {
  const [accounts, setAccounts] = useState<CompanyListItem[]>([]);
  const [query, setQuery] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false);
  const [isDuplicateManagerOpen, setIsDuplicateManagerOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);

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
    if (selectedOwnerId === 'me') params.set('owner_id', '1');
    if (selectedType) params.set('segment', selectedType);
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
  }, [query, selectedOwnerId, selectedType, page]);

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

  const handleExportCsv = () => {
    if (accounts.length === 0) return alert('Nenhuma empresa para exportar.');
    const headers = ['ID', 'Nome', 'Contato Principal', 'Cidade', 'Estado', 'Tipo'];
    const rows = accounts.map((a) => [
      a.id,
      `"${a.name}"`,
      `"${a.primary_contact ? `${a.primary_contact.first_name} ${a.primary_contact.last_name || ''}` : ''}"`,
      `"${a.city || ''}"`,
      `"${a.state || ''}"`,
      `"${a.company_type || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `companies_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6 font-sans">
        <CompaniesToolbar
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          count={accounts.length}
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
        />

        <CreateCompanyModal
          open={isCreateCompanyModalOpen}
          onClose={() => setIsCreateCompanyModalOpen(false)}
          onSuccess={fetchAccounts}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
