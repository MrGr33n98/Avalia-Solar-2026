'use client';

import { useCallback, useEffect, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateContactModal from '@/components/sales/create/CreateContactModal';
import PeopleColumnsDialog, { PeopleColumnConfig } from './PeopleColumnsDialog';
import PeopleTable, { PersonListItem } from './PeopleTable';
import PeopleToolbar from './PeopleToolbar';
import PeopleMapView from './views/PeopleMapView';

export default function PeoplePage() {
  const [contacts, setContacts] = useState<PersonListItem[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);

  const [columns, setColumns] = useState<PeopleColumnConfig>(() => {
    const defaults = { person_name: true, company_job: true, decision_role: true, last_contact: true, contact_info: true };
    if (typeof window === 'undefined') return defaults;
    try { return { ...defaults, ...JSON.parse(localStorage.getItem('crm.people.columns') || '{}') }; } catch { return defaults; }
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('crm.people.filters') || '{}');
      setQuery(saved.query || '');
      setSelectedRole(saved.selectedRole || null);
      setSelectedOwnerId(saved.selectedOwnerId || null);
      setViewMode(saved.viewMode || 'list');
    } catch { /* preferir filtros vazios */ }
  }, []);

  useEffect(() => {
    localStorage.setItem('crm.people.filters', JSON.stringify({ query, selectedRole, selectedOwnerId, viewMode }));
  }, [query, selectedRole, selectedOwnerId, viewMode]);

  useEffect(() => {
    localStorage.setItem('crm.people.columns', JSON.stringify(columns));
  }, [columns]);

  const fetchContacts = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedRole) params.set('decision_role', selectedRole);
    if (selectedOwnerId) params.set('owner_id', selectedOwnerId);
    params.set('per_page', '100');

    fetch(`/api/v1/sales/contacts?${params.toString()}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar as pessoas e decisores.');
        return res.json();
      })
      .then((data) => {
        setContacts(data.contacts ?? []);
        setTotalContacts(data.meta?.total ?? data.contacts?.length ?? 0);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao conectar à API do CRM.');
      })
      .finally(() => setLoading(false));
  }, [query, selectedRole, selectedOwnerId]);

  useEffect(() => {
    const timer = window.setTimeout(fetchContacts, 250);
    return () => window.clearTimeout(timer);
  }, [fetchContacts]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCsv = () => {
    if (contacts.length === 0) return alert('Nenhuma pessoa para exportar.');
    const headers = ['ID', 'Nome', 'Empresa', 'Cargo', 'E-mail', 'Telefone', 'Papel de Decisão'];
    const rows = contacts.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.account_name || ''}"`,
      `"${c.job_title || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || c.whatsapp || ''}"`,
      `"${c.decision_role || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `people_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SalesLayoutWrapper>
      <div className="space-y-6 font-sans">
        <PeopleToolbar
          query={query}
          onQueryChange={setQuery}
          count={totalContacts}
          selectedRole={selectedRole}
          onRoleSelect={setSelectedRole}
          selectedOwnerId={selectedOwnerId}
          onOwnerSelect={setSelectedOwnerId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenColumnsDialog={() => setIsColumnsDialogOpen(true)}
          onCreatePerson={() => setIsCreatePersonModalOpen(true)}
          onExportCsv={handleExportCsv}
        />

        {viewMode === 'list' ? (
          <PeopleTable
            contacts={contacts}
            loading={loading}
            error={error}
            columns={columns}
            selectedIds={selectedIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelect={handleToggleSelect}
            onRetry={fetchContacts}
          />
        ) : (
          <PeopleMapView contacts={contacts} />
        )}

        <PeopleColumnsDialog
          open={isColumnsDialogOpen}
          onClose={() => setIsColumnsDialogOpen(false)}
          columns={columns}
          onChange={setColumns}
        />

        <CreateContactModal
          open={isCreatePersonModalOpen}
          onClose={() => setIsCreatePersonModalOpen(false)}
          onSuccess={fetchContacts}
        />
      </div>
    </SalesLayoutWrapper>
  );
}
