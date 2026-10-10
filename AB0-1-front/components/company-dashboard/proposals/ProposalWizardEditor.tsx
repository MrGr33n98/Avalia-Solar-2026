'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  Wrench,
  X,
  Zap,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import {
  companyMarketplaceProposalsApi,
  type MarketplaceProposal,
  type MarketplaceProposalVersion,
} from '@/lib/api';
import {
  getStatusInfo,
  formatBrlCurrency,
  parseBrlToCents,
  normalizeVertical,
  TECHNICAL_FIELDS_BY_VERTICAL,
  type ProductVertical,
} from '@/lib/proposals/domain';
import { cn } from '@/lib/utils';

interface ProposalWizardEditorProps {
  proposal: MarketplaceProposal;
  companyId: number;
  onSaved: (proposal: MarketplaceProposal) => void;
  onBack: () => void;
  onPublishedSuccess: (proposal: MarketplaceProposal) => void;
  onOpenLeadDetails?: () => void;
}

export function ProposalWizardEditor({
  proposal,
  companyId,
  onSaved,
  onBack,
  onPublishedSuccess,
  onOpenLeadDetails,
}: ProposalWizardEditorProps) {
  const version = proposal.version;
  const editable = proposal.status === 'draft';
  const statusInfo = getStatusInfo(proposal.status);

  // Stepper state (1 to 7)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  const [title, setTitle] = useState(version?.title || 'Proposta em preparação');
  const [summary, setSummary] = useState(version?.summary || '');
  const [validUntil, setValidUntil] = useState(version?.valid_until?.slice(0, 10) || '');

  // Category and project profile state
  const leadVertical = normalizeVertical(proposal.lead?.product_vertical);
  const [selectedVertical, setSelectedVertical] = useState<ProductVertical>(leadVertical);
  const [projectType, setProjectType] = useState<string>(
    proposal.lead?.project_profile || 'Residencial'
  );
  const [installationLocation, setInstallationLocation] = useState<string>(
    proposal.lead?.city && proposal.lead?.state
      ? `${proposal.lead.city} - ${proposal.lead.state}`
      : proposal.lead?.city || ''
  );

  // Terms state
  const [terms, setTerms] = useState(version?.terms || []);

  // Items state
  const [items, setItems] = useState<NonNullable<MarketplaceProposalVersion['items']>>(
    version?.items || []
  );
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemKind, setItemKind] = useState<'service' | 'product'>('service');
  const [itemDescription, setItemDescription] = useState('');

  // PDF-only document total
  const [documentTotal, setDocumentTotal] = useState(
    version?.total_cents ? String(version.total_cents / 100).replace('.', ',') : ''
  );

  // Async / UI states
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const documents = version?.documents || [];

  // Computed total
  const itemsTotalCents = items.reduce((sum, it) => sum + (it.total_cents || it.unit_price_cents || 0), 0);
  const manualTotalCents = parseBrlToCents(documentTotal);
  const effectiveTotalCents = items.length > 0 ? itemsTotalCents : manualTotalCents;

  const canCreateVersion = [
    'sent',
    'viewed',
    'under_review',
    'negotiating',
    'meeting_scheduled',
  ].includes(proposal.status);
  const canWithdraw = canCreateVersion;

  // Helper for term value
  const getTermValue = (key: string) => {
    return terms.find((t) => t.key === key)?.value || '';
  };

  const setTermValue = (key: string, label: string, value: string) => {
    setTerms((current) => {
      const existing = current.find((t) => t.key === key);
      if (existing) {
        return current.map((t) => (t.key === key ? { ...t, value } : t));
      }
      return [
        ...current,
        {
          id: Date.now() + Math.random(),
          key,
          label,
          value,
          position: current.length,
        },
      ];
    });
  };

  // Payload generator
  const buildPayload = () => ({
    title,
    summary,
    valid_until: validUntil || null,
    total_cents: effectiveTotalCents,
    terms: terms
      .filter((term) => term.value.trim())
      .map((term, position) => ({
        key: term.key,
        label: term.label,
        value: term.value,
        position,
      })),
    items: items.map((item, position) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity || 1,
      unit: item.unit || 'un',
      unit_price_cents: item.unit_price_cents,
      kind: item.kind || 'service',
      position,
    })),
  });

  // Save draft
  const handleSaveDraft = async () => {
    setBusy('save');
    setError(null);
    setSaveSuccessMessage(null);
    try {
      const response = await companyMarketplaceProposalsApi.update(
        proposal.id,
        buildPayload(),
        companyId
      );
      onSaved(response.proposal);
      setSaveSuccessMessage('Rascunho salvo com sucesso!');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch {
      setError('Não foi possível salvar a proposta. Revise os campos e tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  // Publish / Send proposal
  const handlePublish = async () => {
    setBusy('publish');
    setError(null);
    try {
      await companyMarketplaceProposalsApi.update(proposal.id, buildPayload(), companyId);
      const response = await companyMarketplaceProposalsApi.send(proposal.id, companyId);
      onSaved(response.proposal);
      onPublishedSuccess(response.proposal);
    } catch {
      setError('Não foi possível publicar a proposta. Verifique as pendências e tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  // Add Item
  const handleAddItem = () => {
    const cents = parseBrlToCents(itemPrice);
    if (!itemName.trim() || cents <= 0) return;

    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        name: itemName.trim(),
        kind: itemKind,
        description: itemDescription.trim() || null,
        quantity: 1,
        unit: 'un',
        unit_price_cents: cents,
        total_cents: cents,
        position: current.length,
      },
    ]);
    setItemName('');
    setItemPrice('');
    setItemDescription('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  // Document Upload
  const handleUploadDocument = async (file?: File) => {
    if (!file || !version) return;
    setBusy('upload');
    setError(null);
    try {
      const response = await companyMarketplaceProposalsApi.uploadDocument(
        proposal.id,
        version.id,
        file,
        companyId
      );
      onSaved(response.proposal);
    } catch {
      setError('Não foi possível anexar o PDF. Certifique-se de usar arquivo PDF de até 10 MB.');
    } finally {
      setBusy(null);
    }
  };

  const handleRemoveDocument = async (documentId: number) => {
    if (!version) return;
    setBusy(`document-${documentId}`);
    setError(null);
    try {
      const response = await companyMarketplaceProposalsApi.removeDocument(
        proposal.id,
        version.id,
        documentId,
        companyId
      );
      onSaved(response.proposal);
    } catch {
      setError('Não foi possível remover o documento anexado.');
    } finally {
      setBusy(null);
    }
  };

  // Create new version
  const handleCreateVersion = async () => {
    setBusy('version');
    try {
      const response = await companyMarketplaceProposalsApi.newVersion(proposal.id, companyId);
      onSaved(response.proposal);
      setCurrentStep(1);
    } catch {
      setError('Não foi possível criar nova versão.');
    } finally {
      setBusy(null);
    }
  };

  // Withdraw
  const handleWithdraw = async () => {
    setBusy('withdraw');
    try {
      const response = await companyMarketplaceProposalsApi.withdraw(proposal.id, companyId);
      onSaved(response.proposal);
    } catch {
      setError('Não foi possível retirar a proposta.');
    } finally {
      setBusy(null);
    }
  };

  // Publication validations
  const publicationIssues: { message: string; stepTarget: number }[] = [];
  if (items.length === 0 && documents.length === 0) {
    publicationIssues.push({
      message: 'Adicione pelo menos um item ou anexe um documento PDF.',
      stepTarget: 4,
    });
  }
  if (effectiveTotalCents <= 0) {
    publicationIssues.push({
      message: 'O valor total da proposta deve ser maior que zero.',
      stepTarget: 4,
    });
  }
  if (!validUntil) {
    publicationIssues.push({
      message: 'Informe a data de validade da proposta.',
      stepTarget: 1,
    });
  } else {
    const validDate = new Date(`${validUntil}T23:59:59`);
    if (validDate.getTime() < Date.now()) {
      publicationIssues.push({
        message: 'A data de validade não pode ser no passado.',
        stepTarget: 1,
      });
    }
  }

  const stepsList = [
    { num: 1, label: 'Identificação' },
    { num: 2, label: 'Resumo' },
    { num: 3, label: 'Técnicos' },
    { num: 4, label: 'Itens' },
    { num: 5, label: 'Comercial' },
    { num: 6, label: 'Docs' },
    { num: 7, label: 'Revisão' },
  ];

  const currentTechnicalFields =
    TECHNICAL_FIELDS_BY_VERTICAL[selectedVertical] || TECHNICAL_FIELDS_BY_VERTICAL.solar;

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] w-full">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Voltar para a lista de propostas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-950 sm:text-lg">
                {editable ? 'Editar proposta' : 'Visualizar proposta'}
              </h1>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-bold',
                  statusInfo.bg,
                  statusInfo.text,
                  statusInfo.border
                )}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {proposal.reference} · v{version?.number || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateVersion && (
            <button
              type="button"
              onClick={() => void handleCreateVersion()}
              disabled={busy !== null}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {busy === 'version' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <History className="h-4 w-4" />
              )}
              Criar nova versão
            </button>
          )}
          {canWithdraw && (
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              disabled={busy !== null}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              {busy === 'withdraw' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Retirar proposta
            </button>
          )}
        </div>
      </div>

      {/* Stepper Navigation (1 to 7) */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
          {stepsList.map((st) => {
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setCurrentStep(st.num)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                    isActive
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : st.num}
                </span>
                <span className="hidden sm:inline">{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile current step indicator */}
        <div className="mt-2 flex items-center justify-between text-xs sm:hidden">
          <span className="font-bold text-slate-700">
            Passo {currentStep} de 7: {stepsList[currentStep - 1]?.label}
          </span>
          <span className="text-slate-500">{Math.round((currentStep / 7) * 100)}% concluído</span>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div
          role="alert"
          className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 sm:mx-6"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccessMessage && (
        <div
          role="status"
          className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 sm:mx-6"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Step Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 max-w-4xl mx-auto w-full pb-28">
        {/* ================= STEP 1: IDENTIFICAÇÃO ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-950">Dados da proposta</h2>
              <p className="text-xs text-slate-500">
                Identifique a oportunidade e defina a validade das condições propostas.
              </p>
            </div>

            {/* Context Card do Lead */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dados do lead
                </span>
                {onOpenLeadDetails && (
                  <button
                    type="button"
                    onClick={onOpenLeadDetails}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Ver lead completo
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                  {(proposal.lead?.name || 'C')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {proposal.lead?.name || 'Cliente'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {proposal.lead?.email || 'Sem e-mail'} ·{' '}
                    {proposal.lead?.city || 'Local não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Input: Título */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Título da proposta
              </label>
              <input
                type="text"
                disabled={!editable}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Proposta Fotovoltaica 8,5 kWp"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Input: Válida até */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Válida até
              </label>
              <input
                type="date"
                disabled={!editable}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="mt-1 block text-xs text-slate-400">
                A proposta permanecerá válida para negociação e aprovação até o fim do dia
                selecionado.
              </span>
            </div>
          </div>
        )}

        {/* ================= STEP 2: RESUMO ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-950">Resumo da proposta</h2>
              <p className="text-xs text-slate-500">
                Apresentação geral do escopo, benefícios e especificações da solução.
              </p>
            </div>

            {/* Textarea: Resumo da proposta */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Resumo descritivo
                </label>
                <span className="text-[11px] text-slate-400">{summary.length}/500</span>
              </div>
              <textarea
                disabled={!editable}
                value={summary}
                maxLength={500}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                placeholder="Descreva o objetivo da proposta, escopo do projeto e principais benefícios para o cliente."
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Categoria da solução
              </label>
              <select
                disabled={!editable}
                value={selectedVertical}
                onChange={(e) => setSelectedVertical(e.target.value as ProductVertical)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="solar">Energia Solar Fotovoltaica</option>
                <option value="ev_mobility">Mobilidade Elétrica (Carregadores)</option>
                <option value="maintenance">Operação, Manutenção & Limpeza</option>
                <option value="other">Outra solução energética</option>
              </select>
            </div>

            {/* Tipo de projeto */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tipo de instalação / perfil
              </label>
              <select
                disabled={!editable}
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Residencial">Residencial unifamiliar</option>
                <option value="Condomínio">Condomínio predial / coletivo</option>
                <option value="Comercial">Comercial / Empresa</option>
                <option value="Industrial">Industrial</option>
                <option value="Rural">Rural / Agro</option>
              </select>
            </div>

            {/* Local de instalação */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Local de instalação
              </label>
              <input
                type="text"
                disabled={!editable}
                value={installationLocation}
                onChange={(e) => setInstallationLocation(e.target.value)}
                placeholder="Ex.: Florianópolis - SC"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 3: DADOS TÉCNICOS ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-950">Dados técnicos e condições</h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {selectedVertical === 'ev_mobility' ? 'Mobilidade Elétrica' : 'Solar Fotovoltaico'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Campos adaptados especificamente para a categoria selecionada.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {currentTechnicalFields.map((field) => {
                const currentVal = getTermValue(field.key);
                return (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      {field.label}
                    </label>
                    {field.type === 'select' && field.options ? (
                      <select
                        disabled={!editable}
                        value={currentVal}
                        onChange={(e) => setTermValue(field.key, field.label, e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Selecione...</option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          disabled={!editable}
                          value={currentVal}
                          onChange={(e) => setTermValue(field.key, field.label, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className={cn(
                            'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
                            field.suffix && 'pr-16'
                          )}
                        />
                        {field.suffix && (
                          <span className="pointer-events-none absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                            {field.suffix}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 4: ITENS E VALORES ================= */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-950">Itens e valores</h2>
                <p className="text-xs text-slate-500">
                  Adicione produtos, equipamentos e serviços componentes da proposta.
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 px-3.5 py-1.5 text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Total estimado
                </span>
                <span className="text-base font-black text-blue-700">
                  {formatBrlCurrency(effectiveTotalCents, false)}
                </span>
              </div>
            </div>

            {/* Lista de itens */}
            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {it.kind === 'service' ? (
                        <Wrench className="h-5 w-5" />
                      ) : (
                        <Zap className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{it.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        {it.description || (it.kind === 'service' ? 'Serviço técnico' : 'Equipamento')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {formatBrlCurrency(it.total_cents || it.unit_price_cents, false)}
                    </span>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        aria-label="Remover item"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    Nenhum item detalhado adicionado.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Você pode adicionar itens abaixo ou informar o valor manual caso anexe proposta
                    em PDF.
                  </p>
                </div>
              )}
            </div>

            {/* Formulário de adicionar item */}
            {editable && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  + Adicionar novo item
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Nome do produto ou serviço"
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="Valor em R$ (ex: 4.500,00)"
                    inputMode="decimal"
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Descrição complementar (opcional)"
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={itemKind}
                      onChange={(e) => setItemKind(e.target.value as 'service' | 'product')}
                      className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700"
                    >
                      <option value="service">Serviço</option>
                      <option value="product">Produto / Peça</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" /> Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Alternativa para Proposta Documental PDF-only */}
            {items.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Valor total da proposta (PDF único)
                </label>
                <input
                  type="text"
                  disabled={!editable}
                  value={documentTotal}
                  onChange={(e) => setDocumentTotal(e.target.value)}
                  placeholder="Ex.: 25.750,00"
                  inputMode="decimal"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  Obrigatório quando a proposta for anexada exclusivamente em documento PDF.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 5: CONDIÇÕES COMERCIAIS ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-950">Condições comerciais</h2>
              <p className="text-xs text-slate-500">
                Prazos, modalidades de pagamento, garantias e observações da negociação.
              </p>
            </div>

            {/* Prazo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Prazo de instalação / execução
              </label>
              <input
                type="text"
                disabled={!editable}
                value={getTermValue('installation_deadline')}
                onChange={(e) =>
                  setTermValue('installation_deadline', 'Prazo de instalação', e.target.value)
                }
                placeholder="Ex.: 15 dias úteis após assinatura"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Condições de pagamento */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Condições de pagamento
              </label>
              <input
                type="text"
                disabled={!editable}
                value={getTermValue('payment_terms')}
                onChange={(e) =>
                  setTermValue('payment_terms', 'Condições de pagamento', e.target.value)
                }
                placeholder="Ex.: 50% entrada, 50% na conclusão ou financiamento bancário"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Garantia */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Garantia e suporte
              </label>
              <input
                type="text"
                disabled={!editable}
                value={getTermValue('warranty')}
                onChange={(e) => setTermValue('warranty', 'Garantia', e.target.value)}
                placeholder="Ex.: 2 anos de instalação, garantia de fábrica nos equipamentos"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Premissas e observações */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Premissas e observações
              </label>
              <textarea
                disabled={!editable}
                value={getTermValue('assumptions')}
                onChange={(e) =>
                  setTermValue('assumptions', 'Premissas e observações', e.target.value)
                }
                rows={3}
                placeholder="Ex.: Incluso vistoria técnica preliminar. Não incluso reforço estrutural ou adequação do padrão de entrada."
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 6: DOCUMENTOS ================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-950">Documentos da proposta</h2>
              <p className="text-xs text-slate-500">
                PDF privado, verificado e limitado a 10 MB por arquivo.
              </p>
            </div>

            {/* Upload Area */}
            {editable && (
              <label className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-6 text-center cursor-pointer hover:bg-blue-50/70 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white mb-2 shadow-sm">
                  {busy === 'upload' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <span className="text-sm font-bold text-blue-900">Anexar documento PDF</span>
                <span className="text-xs text-slate-500 mt-0.5">
                  Selecione do seu dispositivo (máximo 10 MB)
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={busy !== null}
                  onChange={(e) => {
                    void handleUploadDocument(e.target.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            )}

            {/* Documents List */}
            <div className="space-y-2.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{doc.filename}</p>
                      <p className="text-xs text-slate-400">
                        {(doc.byte_size / 1024 / 1024).toFixed(1)} MB · v{version?.number || 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={companyMarketplaceProposalsApi.documentDownloadUrl(
                        proposal.id,
                        version!.id,
                        doc.id,
                        companyId,
                        true
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Visualizar ${doc.filename}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <a
                      href={companyMarketplaceProposalsApi.documentDownloadUrl(
                        proposal.id,
                        version!.id,
                        doc.id,
                        companyId
                      )}
                      aria-label={`Baixar ${doc.filename}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveDocument(doc.id)}
                        disabled={busy !== null}
                        aria-label={`Remover ${doc.filename}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        {busy === `document-${doc.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  Nenhum arquivo PDF anexado nesta versão.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 7: REVISÃO ================= */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-950">Revisão e publicação</h2>
              <p className="text-xs text-slate-500">
                Confira todos os dados antes de publicar a proposta para o cliente.
              </p>
            </div>

            {/* Validation issues banner */}
            {publicationIssues.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Pendências para publicação
                  </span>
                </div>
                <ul className="space-y-1.5 pl-6 text-xs text-amber-800 list-disc">
                  {publicationIssues.map((issue, idx) => (
                    <li key={idx}>
                      <span>{issue.message} </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(issue.stepTarget)}
                        className="font-bold underline text-amber-900 hover:text-amber-950"
                      >
                        Corrigir no Passo {issue.stepTarget}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Review Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-950">Resumo da proposta</h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="block text-slate-400">Título</span>
                  <span className="font-bold text-slate-900">{title || '—'}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Cliente</span>
                  <span className="font-bold text-slate-900">{proposal.lead?.name || '—'}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Categoria</span>
                  <span className="font-bold text-slate-900">
                    {selectedVertical === 'ev_mobility'
                      ? 'Mobilidade Elétrica'
                      : 'Energia Solar Fotovoltaica'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Válida até</span>
                  <span className="font-bold text-slate-900">
                    {validUntil ? new Date(validUntil + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Total estimado</span>
                  <span className="font-black text-blue-700 text-sm">
                    {formatBrlCurrency(effectiveTotalCents, false)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Itens / Documentos</span>
                  <span className="font-bold text-slate-900">
                    {items.length} itens · {documents.length} anexo(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar with Safe Area */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                onBack();
              }
            }}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep > 1 ? 'Anterior' : 'Voltar'}
          </button>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {editable && (
              <button
                type="button"
                onClick={() => void handleSaveDraft()}
                disabled={busy !== null}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {busy === 'save' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Salvar rascunho</span>
                <span className="sm:hidden">Salvar</span>
              </button>
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <span>Próximo passo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : editable ? (
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={busy !== null || publicationIssues.length > 0}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {busy === 'publish' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publicar proposta
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
