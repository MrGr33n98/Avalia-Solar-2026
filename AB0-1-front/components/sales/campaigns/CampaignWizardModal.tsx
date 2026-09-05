'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CRMModal from '@/components/sales/ui/CRMModal';
import { requestApi, fetchAudienceSegments, previewAudience, AudiencePreviewResult, AudienceSegmentsOptions } from '@/lib/api-campaigns';

interface CampaignWizardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    campaign_type: string;
    email_template_id?: number | null;
    audience_filter: Record<string, unknown>;
    audience_id?: number | null;
  }) => Promise<void>;
}

export default function CampaignWizardModal({ open, onClose, onSubmit }: CampaignWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [campaignType, setCampaignType] = useState<string>('email_broadcast');
  const [emailTemplateId, setEmailTemplateId] = useState<number | null>(null);

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

  useEffect(() => {
    if (open) {
      setTemplateError('');
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
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        campaign_type: campaignType,
        email_template_id: emailTemplateId,
        audience_id: audienceId,
        audience_filter: {
          state: stateFilter || undefined,
          city: cityFilter || undefined,
          segment: segmentFilter || undefined,
          search: searchTerm || undefined,
        },
      });
      onClose();
      // Reset form
      setStep(1);
      setName('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao criar campanha.');
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

          {step < 3 ? (
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
      <div className="space-y-4 font-sans py-1">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'font-bold text-indigo-700' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px]">1</span>
            <span>Detalhes</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step === 2 ? 'font-bold text-indigo-700' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px]">2</span>
            <span>Audiência</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'font-bold text-indigo-700' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px]">3</span>
            <span>Revisão</span>
          </div>
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
            {(segments?.cities ?? []).map((city) => <option key={city}>{city}</option>)}
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
                  onChange={(e) => setStateFilter(e.target.value)}
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

        {/* Step 3: Review */}
        {step === 3 && (
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

            <p className="text-[11px] text-slate-500 italic">
              Após criar a campanha, você poderá gerar o snapshot congelado da audiência e disparar a qualquer momento.
            </p>
          </div>
        )}
      </div>
    </CRMModal>
  );
}
