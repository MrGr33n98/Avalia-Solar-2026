'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CRMModal from '@/components/sales/ui/CRMModal';
import { requestApi, fetchAudienceSegments, previewAudience, fetchPreflight, AudiencePreviewResult, AudienceSegmentsOptions } from '@/lib/api-campaigns';

interface CampaignWizardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    campaign_type: string;
    email_template_id?: number | null;
    audience_filter: Record<string, unknown>;
    audience_id?: number | null;
    scheduled_at?: string | null;
  }) => Promise<{ campaign: { id: number } }>;
}

export default function CampaignWizardModal({ open, onClose, onSubmit }: CampaignWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [campaignType, setCampaignType] = useState<string>('email_broadcast');
  const [emailTemplateId, setEmailTemplateId] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');

  const [templates, setTemplates] = useState<Array<{ id: number; name: string }>>([]);
  const [audiences, setAudiences] = useState<Array<{ id: number; name: string; filter_definition?: Record<string, unknown> }>>([]);
  const [audienceId, setAudienceId] = useState<number | null>(null);
  const [templateError, setTemplateError] = useState('');

  // Audience Filter State
  const [stateFilter, setStateFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [segments, setSegments] = useState<AudienceSegmentsOptions | null>(null);
  const [audiencePreview, setAudiencePreview] = useState<AudiencePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState('');
  const [preflight, setPreflight] = useState<{ ready: boolean; blockers: Array<{ code: string; message: string }>; warnings: Array<{ code: string; message: string }> } | null>(null);

  useEffect(() => {
    if (open) {
      setTemplateError('');
      setFormError('');
      setPreflight(null);
      requestApi<{ templates: Array<{ id: number; name: string }> }>('/email_templates')
        .then((result) => setTemplates(result.templates))
        .catch((err) => setTemplateError(err.message || 'Falha ao carregar templates.'));
      fetchAudienceSegments()
        .then(setSegments)
        .catch((err) => console.error('Erro ao carregar segmentos:', err));
      requestApi<{ audiences: Array<{ id: number; name: string; filter_definition?: Record<string, unknown> }> }>('/audiences?per_page=100')
        .then((result) => setAudiences(result.audiences))
        .catch((err) => setTemplateError(err.message || 'Falha ao carregar audiências.'));
    }
  }, [open]);

  useEffect(() => {
    if (open && step === 2) {
      const hasFilter = Boolean(stateFilter || cityFilter || segmentFilter || searchTerm || audienceId);
      if (!hasFilter) { setAudiencePreview(null); return; }
      setPreviewLoading(true);
      const filter = {
        state: stateFilter.trim() || undefined,
        city: cityFilter.trim() || undefined,
        segment: segmentFilter.trim() || undefined,
        search: searchTerm.trim() || undefined,
      };

      previewAudience(filter, 1, 5)
        .then(setAudiencePreview)
        .catch(console.error)
        .finally(() => setPreviewLoading(false));
    }
  }, [open, step, stateFilter, cityFilter, segmentFilter, searchTerm]);

  const handleFinish = async () => {
    if (!name.trim() || !emailTemplateId) { setFormError('Informe nome e template antes de continuar.'); return; }
    if (audiencePreview && audiencePreview.total_count <= 0) { setFormError('Nenhum destinatário elegível encontrado. Ajuste a audiência.'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      const created = await onSubmit({
        name,
        campaign_type: campaignType,
        email_template_id: emailTemplateId,
        audience_id: audienceId,
        scheduled_at: scheduledAt || null,
        audience_filter: {
          state: stateFilter || undefined,
          city: cityFilter || undefined,
          segment: segmentFilter || undefined,
          search: searchTerm || undefined,
        },
      });
      const result = await fetchPreflight(created.campaign.id);
      setPreflight(result.preflight);
      if (!result.preflight.ready) return;
      onClose();
      // Reset form
      setStep(1);
      setName('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar campanha.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CRMModal
      open={open}
      onClose={onClose}
      title="Criar Nova Campanha de E-mail Marketing"
      description="Configure os detalhes, segmento de audiência e modelo de mensagem."
      icon={<Megaphone className="w-5 h-5 text-indigo-700" />}
      size="md"
      footer={
        <div className="w-full flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              className="h-8 px-3 text-xs border-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <Button
              size="sm"
              disabled={!name.trim()}
              onClick={() => setStep(step + 1)}
              className="h-8 px-4 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs"
            >
              Próximo Passo <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={submitting || !name.trim()}
              onClick={handleFinish}
              className="h-8 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
            >
              {submitting ? 'Criando...' : 'Salvar Rascunho de Campanha'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 font-sans py-1">{formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>}
        {/* Step Indicator */}
        <div className="grid grid-cols-6 gap-1 border-b border-slate-100 pb-3 text-center text-[10px]">
          {['Básico', 'Audiência', 'Conteúdo', 'Remetente', 'Agenda', 'Revisão'].map((label, index) => (
            <div key={label} className={`flex flex-col items-center gap-1 ${step === index + 1 ? 'font-bold text-indigo-700' : 'text-slate-500'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${step >= index + 1 ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'}`}>{index + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Info */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Campanha *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Disparo Inbound RS - Q3 2026"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Campanha</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="email_broadcast">E-mail Broadcast (Disparo Direto em Lote)</option>

              </select>
            </div>
          </div>
        )}

        {step === 1 && <label className="block text-xs font-semibold">Template de e-mail
          <select className="block w-full border rounded p-2" value={emailTemplateId ?? ''} onChange={(event) => setEmailTemplateId(event.target.value ? Number(event.target.value) : null)}>
            <option value="">Selecione um template</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
          {templateError && <span role="alert">{templateError}</span>}
          {!templateError && templates.length === 0 && <span>Nenhum template disponível.</span>}
        </label>}

        {step === 2 && <label className="block text-xs font-semibold">Cidade
          <select className="block w-full border rounded p-2" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="">Todas</option>
            {(stateFilter ? (segments?.cities_by_state?.[stateFilter] ?? []) : (segments?.cities ?? [])).map((city) => <option key={city}>{city}</option>)}
          </select>
        </label>}

        {/* Step 2: Audience Filter */}
        {step === 2 && (<>
            <label className="block text-sm font-medium">Audiência salva
              <select className="mt-1 w-full rounded border p-2" value={audienceId ?? ''} onChange={(event) => { const id = Number(event.target.value); const selected = audiences.find((item) => item.id === id); setAudienceId(id || null); if (selected?.filter_definition) { setStateFilter(String(selected.filter_definition.state || '')); setCityFilter(String(selected.filter_definition.city || '')); setSegmentFilter(String(selected.filter_definition.segment || '')); setSearchTerm(String(selected.filter_definition.search || '')); } }}>
                <option value="">Filtros manuais</option>{audiences.map((audience) => <option key={audience.id} value={audience.id}>{audience.name}</option>)}
              </select>
            </label>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Estado (UF)</label>
                <select
                  value={stateFilter}
                  onChange={(e) => { setStateFilter(e.target.value); setCityFilter(''); }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Todos os Estados</option>
                  {(segments?.states || []).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Segmento da Empresa</label>
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Todos os Segmentos</option>
                  {(segments?.company_types || []).map((seg) => (
                    <option key={seg} value={seg}>{seg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Busca por Nome ou E-mail</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por palavra-chave..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            {/* Live Count Preview Card */}
            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-700" />
                <span className="font-semibold text-indigo-950">Destinatários Estimados</span>
              </div>
              <span className="font-bold text-sm text-indigo-900">
                {previewLoading ? '...' : `${audiencePreview?.total_count || 0} contatos`}
              </span>
            </div>
          </div>
          </>)}

        {/* Step 3: Content */}
        {step === 3 && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs"><p className="font-semibold text-slate-900">Conteúdo da mensagem</p><p className="text-slate-600">Template selecionado: <strong>{templates.find((item) => item.id === emailTemplateId)?.name || 'Nenhum'}</strong></p><p className="text-slate-500">A edição completa do template acontece na biblioteca de templates. O preflight validará o conteúdo antes do envio.</p></div>
        )}

        {step === 4 && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs"><p className="font-semibold text-slate-900">Remetente</p><p className="text-slate-600">Identidade vinculada ao usuário atual.</p><p className="rounded bg-amber-50 p-2 text-amber-800">A verificação do provedor será confirmada no preflight antes do envio.</p></div>
        )}

        {step === 5 && (
          <div className="space-y-2"><label className="block text-xs font-semibold text-slate-700">Agendar envio (opcional)<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-1 block w-full rounded border border-slate-200 p-2 text-sm" /></label><p className="text-[11px] text-slate-500">Sem horário: campanha permanece como rascunho.</p></div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nome:</span>
                <span className="font-bold text-slate-900">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo:</span>
                <span className="font-semibold text-slate-800">{campaignType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Audiência Prevista:</span>
                <span className="font-bold text-indigo-700">{audiencePreview?.total_count || 0} contatos</span>
              </div>
            </div>

            {preflight && <div className={`rounded-lg border p-3 ${preflight.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}><strong>{preflight.ready ? 'Pré-flight aprovado' : 'Pré-flight bloqueado'}</strong>{!preflight.ready && <ul className="mt-2 list-disc pl-4">{preflight.blockers.map((item) => <li key={item.code}>{item.message}</li>)}</ul>}{preflight.ready && preflight.warnings.length > 0 && <ul className="mt-2 list-disc pl-4">{preflight.warnings.map((item) => <li key={item.code}>{item.message}</li>)}</ul>}</div>}
            <p className="text-[11px] text-slate-500 italic">
              Após criar a campanha, você poderá gerar o snapshot congelado da audiência e disparar a qualquer momento.
            </p>
          </div>
        )}
      </div>
    </CRMModal>
  );
}
