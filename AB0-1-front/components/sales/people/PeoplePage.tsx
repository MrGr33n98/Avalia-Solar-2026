'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import CreateContactModal from '@/components/sales/create/CreateContactModal';
import SendEmailModal from '@/components/sales/create/SendEmailModal';
import PeopleColumnsDialog, { PeopleColumnConfig } from './PeopleColumnsDialog';
import PeopleTable, { PersonListItem } from './PeopleTable';
import PeopleToolbar from './PeopleToolbar';
import PeopleMapView from './views/PeopleMapView';
import PeopleCardView from './views/PeopleCardView';
import PeopleNutshellSidebar from './PeopleNutshellSidebar';
import PeopleProspectingTopBar, {
  DEFAULT_PRESET_VIEWS,
  SavedView,
} from './PeopleProspectingTopBar';

export default function PeoplePage() {
  const [contacts, setContacts] = useState<PersonListItem[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Layout
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'map'>('cards');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Selection & Dialogs
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);

  // Quick Email Outreach Modal
  const [emailModalTarget, setEmailModalTarget] = useState<PersonListItem | null>(null);

  // Column Configuration
  const [columns, setColumns] = useState<PeopleColumnConfig>(() => {
    const defaults = {
      person_name: true,
      company_job: true,
      decision_role: true,
      last_contact: true,
      contact_info: true,
    };
    if (typeof window === 'undefined') return defaults;
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem('crm.people.columns') || '{}') };
    } catch {
      return defaults;
    }
  });

  // Nutshell Filters State
  const [filters, setFilters] = useState({
    query: '',
    hasEmail: false,
    hasPhone: false,
    hasLinkedin: false,
    jobTitle: '',
    titleExact: false,
    companyName: '',
    state: '',
    segment: '',
    selectedRole: null as string | null,
    selectedOwnerId: null as string | null,
  });

  // Saved Views State
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PRESET_VIEWS;
    try {
      const stored = localStorage.getItem('crm.people.saved_views');
      return stored ? JSON.parse(stored) : DEFAULT_PRESET_VIEWS;
    } catch {
      return DEFAULT_PRESET_VIEWS;
    }
  });
  const [currentView, setCurrentView] = useState<SavedView | null>(DEFAULT_PRESET_VIEWS[0]);

  // Sync state to local storage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('crm.people.filters') || '{}');
      if (saved.viewMode) setViewMode(saved.viewMode);
      if (saved.sidebarOpen !== undefined) setSidebarOpen(saved.sidebarOpen);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'crm.people.filters',
      JSON.stringify({ viewMode, sidebarOpen })
    );
  }, [viewMode, sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('crm.people.columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('crm.people.saved_views', JSON.stringify(savedViews));
  }, [savedViews]);

  // Has any active filter?
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.query ||
        filters.hasEmail ||
        filters.hasPhone ||
        filters.hasLinkedin ||
        filters.jobTitle ||
        filters.companyName ||
        filters.state ||
        filters.segment ||
        filters.selectedRole ||
        filters.selectedOwnerId
    );
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      query: '',
      hasEmail: false,
      hasPhone: false,
      hasLinkedin: false,
      jobTitle: '',
      titleExact: false,
      companyName: '',
      state: '',
      segment: '',
      selectedRole: null,
      selectedOwnerId: null,
    });
    setPage(1);
    setCurrentView(DEFAULT_PRESET_VIEWS[0]);
  }, []);

  const handleFilterUpdate = useCallback((updates: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  }, []);

  // Fetch Contacts with Rich Filters
  const fetchContacts = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();

    if (filters.query) params.set('q', filters.query);
    if (filters.selectedRole) params.set('decision_role', filters.selectedRole);
    if (filters.selectedOwnerId) params.set('owner_id', filters.selectedOwnerId);
    if (filters.hasEmail) params.set('has_email', 'true');
    if (filters.hasPhone) params.set('has_phone', 'true');
    if (filters.hasLinkedin) params.set('has_linkedin', 'true');
    if (filters.jobTitle) {
      params.set('job_title', filters.jobTitle);
      if (filters.titleExact) params.set('title_exact', 'true');
    }
    if (filters.companyName) params.set('company_name', filters.companyName);
    if (filters.state) params.set('state', filters.state);
    if (filters.segment) params.set('segment', filters.segment);

    params.set('page', String(page));
    params.set('per_page', String(perPage));

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
  }, [filters, page]);

  useEffect(() => {
    const timer = window.setTimeout(fetchContacts, 250);
    return () => window.clearTimeout(timer);
  }, [fetchContacts]);

  // Saved Views Handlers
  const handleSelectView = (view: SavedView) => {
    setCurrentView(view);
    setFilters((prev) => ({
      ...prev,
      query: view.filters.query || '',
      hasEmail: Boolean(view.filters.hasEmail),
      hasPhone: Boolean(view.filters.hasPhone),
      hasLinkedin: Boolean(view.filters.hasLinkedin),
      jobTitle: view.filters.jobTitle || '',
      titleExact: Boolean(view.filters.titleExact),
      companyName: view.filters.companyName || '',
      state: view.filters.state || '',
      segment: view.filters.segment || '',
      selectedRole: view.filters.decisionRole || null,
    }));
    setPage(1);
  };

  const handleSaveNewView = (name: string) => {
    const newView: SavedView = {
      id: `view_${Date.now()}`,
      name,
      filters: {
        query: filters.query || undefined,
        hasEmail: filters.hasEmail || undefined,
        hasPhone: filters.hasPhone || undefined,
        hasLinkedin: filters.hasLinkedin || undefined,
        jobTitle: filters.jobTitle || undefined,
        titleExact: filters.titleExact || undefined,
        companyName: filters.companyName || undefined,
        state: filters.state || undefined,
        segment: filters.segment || undefined,
        decisionRole: filters.selectedRole || undefined,
      },
    };
    setSavedViews((prev) => [...prev, newView]);
    setCurrentView(newView);
  };

  const handleDeleteView = (viewId: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
    if (currentView?.id === viewId) {
      setCurrentView(DEFAULT_PRESET_VIEWS[0]);
    }
  };

  // Selection Handlers
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

  // Export CSV
  const handleExportCsv = () => {
    if (contacts.length === 0) return alert('Nenhuma pessoa para exportar.');
    const headers = [
      'ID',
      'Nome',
      'Empresa',
      'Cargo',
      'E-mail',
      'Telefone',
      'LinkedIn',
      'Cidade',
      'UF',
      'Segmento',
      'Porte',
      'Papel de Decisão',
    ];
    const rows = contacts.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.account_name || ''}"`,
      `"${c.job_title || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || c.whatsapp || ''}"`,
      `"${c.linkedin_url || ''}"`,
      `"${c.account_city || ''}"`,
      `"${c.account_state || ''}"`,
      `"${c.account_segment || ''}"`,
      `"${c.account_company_size || ''}"`,
      `"${c.decision_role || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `people_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(totalContacts / perPage));

  return (
    <SalesLayoutWrapper>
      <div className="space-y-4 font-sans">
        {/* Header Toolbar */}
        <PeopleToolbar
          query={filters.query}
          onQueryChange={(q) => handleFilterUpdate({ query: q })}
          count={totalContacts}
          selectedRole={filters.selectedRole}
          onRoleSelect={(role) => handleFilterUpdate({ selectedRole: role })}
          selectedOwnerId={filters.selectedOwnerId}
          onOwnerSelect={(ownerId) => handleFilterUpdate({ selectedOwnerId: ownerId })}
          viewMode={viewMode === 'map' ? 'map' : 'list'}
          onViewModeChange={(m) => setViewMode(m === 'map' ? 'map' : 'cards')}
          onOpenColumnsDialog={() => setIsColumnsDialogOpen(true)}
          onCreatePerson={() => setIsCreatePersonModalOpen(true)}
          onExportCsv={handleExportCsv}
        />

        {/* Main Workspace: Collapsible Sidebar + Content Area */}
        <div className="flex items-start gap-4">
          {/* Nutshell Sidebar */}
          {sidebarOpen && (
            <div className="hidden lg:block shrink-0 shadow-2xs rounded-lg overflow-hidden border border-slate-200">
              <PeopleNutshellSidebar
                filters={filters}
                onFilterChange={handleFilterUpdate}
                onClearFilters={handleClearFilters}
                totalCount={totalContacts}
              />
            </div>
          )}

          {/* Right Column: Top Bar + Active View */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Top Bar with Saved Views, Top Pagination & Mode Selector */}
            <PeopleProspectingTopBar
              currentView={currentView}
              savedViews={savedViews}
              onSelectView={handleSelectView}
              onSaveNewView={handleSaveNewView}
              onDeleteView={handleDeleteView}
              totalCount={totalContacts}
              hasActiveFilters={hasActiveFilters}
              onRemoveFilters={handleClearFilters}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Views Switcher */}
            {viewMode === 'cards' && (
              <PeopleCardView
                contacts={contacts}
                loading={loading}
                error={error}
                selectedIds={selectedIds}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleSelect={handleToggleSelect}
                onEmailContact={(contact) => setEmailModalTarget(contact)}
                onRetry={fetchContacts}
              />
            )}

            {viewMode === 'table' && (
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
            )}

            {viewMode === 'map' && <PeopleMapView contacts={contacts} />}
          </div>
        </div>

        {/* Dialogs & Modals */}
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

        {/* Quick Send Email Modal */}
        {emailModalTarget && (
          <SendEmailModal
            open={Boolean(emailModalTarget)}
            onClose={() => setEmailModalTarget(null)}
            contactId={emailModalTarget.id}
            contactEmail={emailModalTarget.email || undefined}
            contactName={emailModalTarget.name}
            companyName={emailModalTarget.account_name || undefined}
            accountId={emailModalTarget.sales_account_id || undefined}
            onSuccess={() => {
              setEmailModalTarget(null);
              fetchContacts();
            }}
          />
        )}
      </div>
    </SalesLayoutWrapper>
  );
}
