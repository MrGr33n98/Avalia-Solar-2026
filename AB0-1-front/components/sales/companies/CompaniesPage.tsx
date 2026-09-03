'use client';

import { useCallback, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateCompanyModal from '@/components/sales/create/CreateCompanyModal';
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
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false);
  const [isDuplicateManagerOpen, setIsDuplicateManagerOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);

  const [columns, setColumns] = useState<CompanyColumnConfig>({
    company_name: true,
    primary_contact: true,
    last_contact: true,
    address: true,
    company_type: true,
    tags: true,
    open_opps: true,
  });

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedOwnerId === 'me') params.set('owner_id', '1');
    if (selectedType) params.set('company_type', selectedType);

    fetch(`/api/v1/sales/accounts?${params.toString()}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar as empresas.');
        return res.json();
      })
      .then((data) => {
        setAccounts(data.accounts ?? []);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao conectar à API.');
      })
      .finally(() => setLoading(false));
  }, [query, selectedOwnerId, selectedType]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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
          onQueryChange={setQuery}
          count={accounts.length}
          selectedOwnerId={selectedOwnerId}
          onOwnerSelect={setSelectedOwnerId}
          selectedType={selectedType}
          onTypeSelect={setSelectedType}
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
        />

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
