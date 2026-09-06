'use client';

import { useEffect, useState, useCallback } from 'react';
import type {
  EmailTemplate,
  EmailTemplatePayload,
  PaginationMeta,
  TemplateStats as StatsType,
  TemplateListParams,
  VariableGroup,
  TemplatePreviewResult,
} from './types';
import {
  listEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  duplicateEmailTemplate,
  archiveEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
  sendTemplateTest,
  getTemplateStats,
  getTemplateVariables,
  getTemplateCategories,
} from '@/lib/api/sales/emailTemplates';

import WorkspaceFrame from '@/components/sales/campaigns/WorkspaceFrame';
import { TemplateLibrary } from './library/TemplateLibrary';
import { TemplateEditor } from './editor/TemplateEditor';
import { TemplatePreview } from './preview/TemplatePreview';
import { TemplateTestEmailDialog } from './dialogs/TemplateTestEmailDialog';
import { TemplateDeleteDialog } from './dialogs/TemplateDeleteDialog';

export default function TemplatesWorkspace() {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [variableGroups, setVariableGroups] = useState<VariableGroup[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tabFilter, setTabFilter] = useState('all');
  const [sort, setSort] = useState('updated_at');
  const [page, setPage] = useState(1);

  // Editor State
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Modals
  const [previewData, setPreviewData] = useState<TemplatePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewContextMode, setPreviewContextMode] = useState<'sample' | 'real'>('sample');
  const [testSendTarget, setTestSendTarget] = useState<EmailTemplate | Partial<EmailTemplate> | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const scopeParam = tabFilter === 'shared' ? 'shared' : tabFilter === 'mine' ? 'mine' : undefined;
      const statusParam = tabFilter === 'active' || tabFilter === 'draft' || tabFilter === 'archived' ? tabFilter : statusFilter || undefined;

      const [listRes, statsRes, varsRes, catsRes] = await Promise.all([
        listEmailTemplates({
          page,
          per_page: 12,
          q: search,
          category: categoryFilter,
          status: statusParam,
          scope: scopeParam,
          sort: sort as TemplateListParams['sort'],
          direction: 'desc',
        }),
        getTemplateStats(),
        getTemplateVariables(),
        getTemplateCategories(),
      ]);

      setTemplates(listRes.templates);
      setMeta(listRes.meta);
      setStats(statsRes);
      setVariableGroups(varsRes.groups);
      setCategoriesList(catsRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar templates.');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter, tabFilter, sort]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setView('editor');
    setSuccess('');
    setError('');
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setView('editor');
    setSuccess('');
    setError('');
  };

  const handleSaveTemplate = async (payload: EmailTemplatePayload) => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, payload);
        setSuccess('Template atualizado com sucesso.');
      } else {
        await createEmailTemplate(payload);
        setSuccess('Template criado com sucesso.');
      }
      setView('library');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar template.');
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    setBusy(true);
    setError('');
    try {
      const res = await duplicateEmailTemplate(template.id);
      setSuccess(`Cópia criada: "${res.template.name}".`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao duplicar template.');
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveTemplate = async (template: EmailTemplate) => {
    setBusy(true);
    setError('');
    try {
      await archiveEmailTemplate(template.id);
      setSuccess(`Template "${template.name}" arquivado.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao arquivar template.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTemplate) return;
    setBusy(true);
    setError('');
    try {
      await deleteEmailTemplate(deletingTemplate.id);
      setSuccess(`Template "${deletingTemplate.name}" removido.`);
      setDeletingTemplate(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover template.');
    } finally {
      setBusy(false);
    }
  };

  const handleShowPreview = async (templateData: EmailTemplate | Partial<EmailTemplate>) => {
    if (previewLoading) return;
    setPreviewLoading(true);
    setError('');
    try {
      const res = await previewEmailTemplate(templateData.id, {
        draft: {
          name: templateData.name,
          subject_template: templateData.subject_template,
          preheader: templateData.preheader,
          body_json: templateData.body_json,
          body_html: templateData.body_html,
        },
      });
      setPreviewData(res.preview);
      setPreviewContextMode(res.context_mode || 'sample');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar prévia.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTestSendExecute = async (email: string) => {
    if (!testSendTarget) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await sendTemplateTest(testSendTarget.id, {
        to_email: email,
        draft: {
          name: testSendTarget.name,
          subject_template: testSendTarget.subject_template,
          preheader: testSendTarget.preheader,
          body_json: testSendTarget.body_json,
          body_html: testSendTarget.body_html,
        },
      });
      setSuccess(res.message || `E-mail de teste enviado com sucesso para ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar e-mail de teste.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setTabFilter('all');
    setSort('updated_at');
    setPage(1);
  };

  return (
    <WorkspaceFrame title="Templates de E-mail">
      {error && (
        <div role="alert" className="p-4 mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex justify-between items-center">
          <p>{error}</p>
          <button type="button" onClick={() => setError('')} className="font-semibold text-xs underline">Dispensar</button>
        </div>
      )}

      {success && (
        <div role="status" className="p-4 mb-4 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-200 rounded-md">
          {success}
        </div>
      )}

      {view === 'library' ? (
        <TemplateLibrary
          templates={templates}
          meta={meta}
          stats={stats}
          categoriesList={categoriesList}
          loading={loading}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          categoryFilter={categoryFilter}
          onCategoryChange={(v) => { setCategoryFilter(v); setPage(1); }}
          statusFilter={statusFilter}
          onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
          tabFilter={tabFilter}
          onTabChange={(v) => { setTabFilter(v); setPage(1); }}
          sort={sort}
          onSortChange={setSort}
          page={page}
          onPageChange={setPage}
          onNewTemplate={handleNewTemplate}
          onEdit={handleEditTemplate}
          onPreview={handleShowPreview}
          onDuplicate={handleDuplicateTemplate}
          onArchive={handleArchiveTemplate}
          onTestSend={(t) => setTestSendTarget(t)}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <TemplateEditor
          initialTemplate={editingTemplate}
          variableGroups={variableGroups}
          onSave={handleSaveTemplate}
          onCancel={() => setView('library')}
          onPreview={handleShowPreview}
          onTestSend={(t) => setTestSendTarget(t)}
          busy={busy}
        />
      )}

      {previewData && (
        <TemplatePreview
          preview={previewData}
          contextMode={previewContextMode}
          onClose={() => setPreviewData(null)}
          onOpenTestSend={() => {
            const current = editingTemplate || { subject_template: previewData.subject };
            setTestSendTarget(current);
          }}
        />
      )}

      {testSendTarget && (
        <TemplateTestEmailDialog
          isOpen={!!testSendTarget}
          onClose={() => setTestSendTarget(null)}
          onSendTest={handleTestSendExecute}
        />
      )}

      {deletingTemplate && (
        <TemplateDeleteDialog
          isOpen={!!deletingTemplate}
          templateName={deletingTemplate.name}
          onClose={() => setDeletingTemplate(null)}
          onConfirm={handleDeleteConfirm}
          loading={busy}
        />
      )}
    </WorkspaceFrame>
  );
}
