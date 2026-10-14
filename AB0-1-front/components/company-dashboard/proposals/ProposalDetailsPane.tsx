'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Calendar,
  DollarSign,
  Download,
  Upload,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Zap,
  Phone,
  Mail,
  Edit2,
  Eye,
  History,
  Layers,
  FileCheck2,
  Loader2,
  Trash2,
  MessageSquare,
  Send,
  Sparkles,
  ShieldCheck,
  Check,
  Globe,
  SlidersHorizontal,
  Palette,
  LayoutTemplate,
  Info,
  ChevronDown,
  ChevronUp,
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
  type ProposalStudioTabId,
  type ProposalStudioState,
  type ProposalFormFieldConfig,
  ORIGINAL_PDF_TEMPLATES,
  DEFAULT_PROPOSAL_FORM_FIELDS,
  parseProposalStudioState,
  serializeProposalStudioToTerms,
} from '@/lib/proposals/domain';
import { cn } from '@/lib/utils';
import { ProposalSettingsStudio } from './ProposalSettingsStudio';

interface ProposalDetailsPaneProps {
  proposal: MarketplaceProposal | null;
  companyId: number | string;
  onOpenEditor: (proposal: MarketplaceProposal) => void;
  onViewProposalModal: (proposal: MarketplaceProposal) => void;
  onCreateNewVersion: (proposal: MarketplaceProposal) => Promise<void>;
  onProposalUpdated: (updatedProposal: MarketplaceProposal) => void;
  onOpenChatMobile?: () => void;
  isCreatingVersion?: boolean;
}

export function ProposalDetailsPane({
  proposal,
  companyId,
  onOpenEditor,
  onViewProposalModal,
  onCreateNewVersion,
  onProposalUpdated,
  onOpenChatMobile,
  isCreatingVersion,
}: ProposalDetailsPaneProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProposalStudioTabId>('resumo');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [showConfirmNewVersion, setShowConfirmNewVersion] = useState(false);
  const [isSendingProposal, setIsSendingProposal] = useState(false);

  // Proposal Studio state
  const currentVersion = proposal?.version;
  const [studioState, setStudioState] = useState<ProposalStudioState>(() =>
    parseProposalStudioState(currentVersion?.terms)
  );
  const [isSavingStudio, setIsSavingStudio] = useState(false);
  const [studioSaveSuccess, setStudioSaveSuccess] = useState<string | null>(null);
  const [studioSaveError, setStudioSaveError] = useState<string | null>(null);
  const [isSettingsStudioOpen, setIsSettingsStudioOpen] = useState(false);

  // Add custom field modal/inline state
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<ProposalFormFieldConfig['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Expandable section editor states in PDF Template tab
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Sync studio state on proposal/version change
  useEffect(() => {
    if (currentVersion?.terms) {
      setStudioState(parseProposalStudioState(currentVersion.terms));
    }
  }, [currentVersion]);

  if (!proposal) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <FileText className="h-10 w-10 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Nenhuma proposta selecionada</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Selecione uma proposta na lista ao lado para visualizar os detalhes comerciais, documentos técnicos e histórico.
        </p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(proposal.status);
  const lead = proposal.lead;
  const isDraft = proposal.status === 'draft';
  const documents = currentVersion?.documents || [];

  // Salvar estado do Studio persistindo nos terms da versão
  const handleSaveStudio = async (updatedState: ProposalStudioState, message = 'Configurações salvas!') => {
    setIsSavingStudio(true);
    setStudioSaveSuccess(null);
    setStudioSaveError(null);
    try {
      const serializedTerms = serializeProposalStudioToTerms(updatedState, currentVersion?.terms);
      const response = await companyMarketplaceProposalsApi.update(
        proposal.id,
        {
          terms: serializedTerms,
          valid_until: updatedState.validityDate || currentVersion?.valid_until || null,
        },
        companyId
      );
      setStudioState(updatedState);
      onProposalUpdated(response.proposal);
      setStudioSaveSuccess(message);
      setTimeout(() => setStudioSaveSuccess(null), 3000);
    } catch {
      setStudioSaveError('Não foi possível salvar as configurações. Tente novamente.');
    } finally {
      setIsSavingStudio(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentVersion) return;

    if (file.type !== 'application/pdf') {
      setDocError('Apenas arquivos em formato PDF são aceitos.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setDocError('O arquivo deve ter no máximo 10MB.');
      return;
    }

    setUploadingDoc(true);
    setDocError(null);
    try {
      const response = await companyMarketplaceProposalsApi.uploadDocument(
        proposal.id,
        currentVersion.id,
        file,
        companyId
      );
      onProposalUpdated(response.proposal);
    } catch {
      setDocError('Erro ao enviar o documento PDF da proposta.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = async (documentId: number) => {
    if (!currentVersion) return;
    if (!confirm('Deseja realmente remover este documento da versão atual?')) return;

    try {
      const response = await companyMarketplaceProposalsApi.removeDocument(
        proposal.id,
        currentVersion.id,
        documentId,
        companyId
      );
      onProposalUpdated(response.proposal);
    } catch {
      alert('Não foi possível remover o documento.');
    }
  };

  const handleSendProposal = async () => {
    if (!confirm('Deseja publicar e enviar esta proposta oficial ao comprador?')) return;
    setIsSendingProposal(true);
    try {
      const response = await companyMarketplaceProposalsApi.send(proposal.id, companyId);
      onProposalUpdated(response.proposal);
      alert('Proposta enviada com sucesso ao comprador!');
    } catch {
      alert('Não foi possível enviar a proposta. Certifique-se de que há itens cadastrados ou documento PDF anexado com validade futura.');
    } finally {
      setIsSendingProposal(false);
    }
  };

  // Tabs do Proposal Studio Enterprise A+++
  const studioTabs: Array<{ id: ProposalStudioTabId; label: string; badge?: string | number }> = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'itens', label: 'Itens & Técnico' },
    { id: 'formulario', label: 'Formulário', badge: '2' },
    { id: 'template_pdf', label: 'Template PDF', badge: '3' },
    { id: 'digital', label: 'Proposta Digital', badge: '4' },
    { id: 'comercial', label: 'Condições Comerciais', badge: '5' },
    { id: 'docs', label: 'Documentos', badge: documents.length },
    { id: 'historico', label: 'Histórico', badge: proposal.versions?.length || 1 },
  ];

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-100 p-4 sm:p-5 bg-slate-50/50 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                {proposal.reference}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border',
                  statusInfo.bg,
                  statusInfo.text,
                  statusInfo.border
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusInfo.dot)} />
                {statusInfo.label}
              </span>
              {currentVersion?.number && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  v{currentVersion.number}
                </span>
              )}
            </div>

            <h2 className="mt-1.5 text-lg font-black text-slate-900 sm:text-xl">
              {currentVersion?.title || 'Proposta comercial'}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {lead?.name || 'Comprador sem nome'}
              </span>
              {lead?.email && <span>· {lead.email}</span>}
              {(lead?.city || lead?.state) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {[lead.city, lead.state].filter(Boolean).join(' - ')}
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            {proposal.conversation_id ? (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/inbox?conversation_id=${proposal.conversation_id}`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                title="Abrir conversa com o lead na Central de Mensagens"
              >
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Abrir conversa</span>
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed select-none"
                title="Nenhuma conversa vinculada a esta proposta"
              >
                <MessageSquare className="h-4 w-4 text-slate-300" />
                <span>Sem conversa vinculada</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => onViewProposalModal(proposal)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              title="Pré-visualizar proposta em PDF ou Digital"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Pré-visualizar</span>
            </button>

            {isDraft ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenEditor(proposal)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Edit2 className="h-4 w-4 text-slate-500" />
                  <span>Editar rascunho</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendProposal}
                  disabled={isSendingProposal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSendingProposal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Enviar proposta</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmNewVersion(true)}
                disabled={isCreatingVersion}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-600 bg-white px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {isCreatingVersion ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Criar nova versão</span>
              </button>
            )}
          </div>
        </div>

        {/* Notificações de Sucesso/Erro do Studio */}
        {studioSaveSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{studioSaveSuccess}</span>
          </div>
        )}
        {studioSaveError && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{studioSaveError}</span>
          </div>
        )}

        {/* 8-Tab Journey Navigation (Scroll horizontal seguro) */}
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-200/60 pt-3 overflow-x-auto scrollbar-none">
          {studioTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all shrink-0',
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              )}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-black',
                    activeTab === tab.id
                      ? 'bg-blue-200/80 text-blue-800'
                      : 'bg-slate-200/80 text-slate-700'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pane Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: RESUMO                                                  */}
        {/* ============================================================== */}
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Valor Total
                </span>
                <p className="mt-1 text-base sm:text-lg font-black text-slate-900">
                  {proposal.total_cents ? formatBrlCurrency(proposal.total_cents) : 'A calcular'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Validade
                </span>
                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-800">
                  {proposal.expires_at || currentVersion?.valid_until
                    ? new Date(proposal.expires_at || currentVersion?.valid_until || '').toLocaleDateString('pt-BR')
                    : 'Não informada'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Publicação
                </span>
                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-800">
                  {proposal.published_at
                    ? new Date(proposal.published_at).toLocaleDateString('pt-BR')
                    : 'Em rascunho'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Consumo Estimado
                </span>
                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-800">
                  {lead?.monthly_kwh ? `${lead.monthly_kwh} kWh/mês` : 'Não informado'}
                </p>
              </div>
            </div>

            {/* Resumo da Proposta */}
            {currentVersion?.summary && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Descrição e Escopo
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {currentVersion.summary}
                </p>
              </div>
            )}

            {/* Informações do Comprador */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Dados do Comprador / Solicitação
              </h4>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-slate-400">Nome: </span>
                  <span className="font-semibold text-slate-800">{lead?.name || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-slate-400">E-mail: </span>
                  <span className="font-semibold text-slate-800">{lead?.email || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Telefone: </span>
                  <span className="font-semibold text-slate-800">{lead?.phone || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Perfil: </span>
                  <span className="font-semibold text-slate-800">{lead?.project_profile || 'Não informado'}</span>
                </div>
                {lead?.address_full && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Endereço de instalação: </span>
                    <span className="font-semibold text-slate-800">{lead.address_full}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline de Eventos Reais */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Timeline de Eventos
              </h4>
              {proposal.events && proposal.events.length > 0 ? (
                <div className="space-y-3 relative pl-4 border-l border-slate-200 ml-2">
                  {proposal.events.map((ev) => (
                    <div key={ev.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="font-bold text-slate-800">
                        {ev.event_type.replace('proposal.', '').replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ev.occurred_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nenhum evento registrado até o momento.</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ITENS & TÉCNICO                                         */}
        {/* ============================================================== */}
        {activeTab === 'itens' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lista de Itens, Equipamentos e Serviços
              </h4>
              {currentVersion?.items && currentVersion.items.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600">
                      <tr>
                        <th className="px-3.5 py-2.5">Item</th>
                        <th className="px-3.5 py-2.5">Tipo</th>
                        <th className="px-3.5 py-2.5 text-center">Qtd</th>
                        <th className="px-3.5 py-2.5 text-right">Valor Unitário</th>
                        <th className="px-3.5 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentVersion.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">
                            {item.name}
                            {item.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500">
                            {item.kind === 'product' ? 'Equipamento' : 'Serviço'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-slate-700 font-semibold">
                            {item.quantity || 1} {item.unit || 'un'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-700">
                            {formatBrlCurrency(item.unit_price_cents)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                            {formatBrlCurrency(
                              item.total_cents || (item.unit_price_cents || 0) * (item.quantity || 1)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  Nenhum item individual cadastrado nesta proposta.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Condições e Termos Específicos
              </h4>
              {currentVersion?.terms && currentVersion.terms.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentVersion.terms.map((term, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                      <span className="text-[11px] font-bold text-slate-500">{term.label}</span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{term.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  Nenhum termo ou condição adicional especificado.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: FORMULÁRIO (2)                                          */}
        {/* ============================================================== */}
        {activeTab === 'formulario' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Construtor de Campos do Formulário
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ative ou desative os campos que serão solicitados e exibidos na proposta para o comprador.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingField(!isAddingField)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5 text-blue-600" />
                  <span>Adicionar Campo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveStudio(studioState, 'Formulário atualizado com sucesso!')}
                  disabled={isSavingStudio}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingStudio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Salvar Formulário</span>
                </button>
              </div>
            </div>

            {/* Adicionar Campo Personalizado Form Inline */}
            {isAddingField && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Novo Campo Personalizado
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Rótulo do Campo</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Ex.: Padrão de Entrada Bifásico"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Tipo de Dado</label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as ProposalFormFieldConfig['type'])}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="text">Texto Curto</option>
                      <option value="number">Numérico</option>
                      <option value="currency">Valor Monetário (R$)</option>
                      <option value="boolean">Sim / Não (Booleano)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="newFieldReq"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <label htmlFor="newFieldReq" className="text-xs font-bold text-slate-700">
                      Obrigatório para o comprador
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingField(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFieldLabel.trim()) return;
                      const customField: ProposalFormFieldConfig = {
                        id: `cust_${Date.now()}`,
                        key: newFieldLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                        label: newFieldLabel.trim(),
                        type: newFieldType,
                        category: 'personalizado',
                        enabled: true,
                        required: newFieldRequired,
                      };
                      setStudioState((prev) => ({
                        ...prev,
                        formFields: [...prev.formFields, customField],
                      }));
                      setNewFieldLabel('');
                      setIsAddingField(false);
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Inserir Campo
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Campos do Formulário com Switches */}
            <div className="space-y-2.5">
              {studioState.formFields.map((field) => (
                <div
                  key={field.id}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-3.5 transition-all',
                    field.enabled ? 'border-slate-200 bg-white' : 'border-slate-200/60 bg-slate-50/50 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.enabled}
                      onClick={() => {
                        setStudioState((prev) => ({
                          ...prev,
                          formFields: prev.formFields.map((f) =>
                            f.id === field.id ? { ...f, enabled: !f.enabled } : f
                          ),
                        }));
                      }}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                        field.enabled ? 'bg-blue-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                          field.enabled ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{field.label}</span>
                        {field.required && (
                          <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 border border-rose-200/60">
                            Obrigatório
                          </span>
                        )}
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-500 uppercase">
                          {field.category}
                        </span>
                      </div>
                      {field.helperText && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{field.helperText}</p>
                      )}
                    </div>
                  </div>

                  {field.category === 'personalizado' && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudioState((prev) => ({
                          ...prev,
                          formFields: prev.formFields.filter((f) => f.id !== field.id),
                        }));
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Remover campo personalizado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TEMPLATE PDF (3)                                        */}
        {/* ============================================================== */}
        {activeTab === 'template_pdf' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Estúdio de Template e Identidade do PDF
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha o modelo oficial Avalia Solar e personalize cores, seções modulares e capas institucionais.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsStudioOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  <span>Definições da Empresa</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveStudio(studioState, 'Modelo e seções do PDF salvos com sucesso!')}
                  disabled={isSavingStudio}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingStudio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Salvar Configurações do PDF</span>
                </button>
              </div>
            </div>

            {/* Modelos Oficiais Avalia Solar (5 opções) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Selecione o Modelo Base Original
              </label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ORIGINAL_PDF_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => setStudioState((prev) => ({ ...prev, templateId: tmpl.id }))}
                    className={cn(
                      'cursor-pointer rounded-xl border p-4 transition-all relative',
                      studioState.templateId === tmpl.id
                        ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{tmpl.tagline}</p>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{tmpl.recommendedFor}</span>
                      {studioState.templateId === tmpl.id && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identidade Visual: Cor Principal da Marca */}
            <div className="space-y-3 border-t border-slate-200/80 pt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Cor Principal da Marca (Destaque em Cabeçalhos e Títulos)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {['#0066FF', '#0F172A', '#0284C7', '#475569', '#D97706'].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setStudioState((prev) => ({ ...prev, mainColor: hex }))}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform',
                      studioState.mainColor.toLowerCase() === hex.toLowerCase()
                        ? 'scale-110 border-slate-900 shadow-sm'
                        : 'border-white hover:scale-105'
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-xs text-slate-500">Hex:</span>
                  <input
                    type="text"
                    value={studioState.mainColor}
                    onChange={(e) => setStudioState((prev) => ({ ...prev, mainColor: e.target.value }))}
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Seções Modulares do PDF com Validação e Editores Expansíveis */}
            <div className="space-y-3 border-t border-slate-200/80 pt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Seções Modulares do Documento PDF
              </label>

              {/* Seção Sobre a Empresa */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={studioState.sectionAboutCompany}
                      onClick={() =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionAboutCompany: !prev.sectionAboutCompany,
                        }))
                      }
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                        studioState.sectionAboutCompany ? 'bg-blue-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                          studioState.sectionAboutCompany ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Sobre a Empresa</span>
                      <p className="text-[11px] text-slate-500">Apresenta o histórico e diferenciais técnicos do integrador</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingSection(editingSection === 'about' ? null : 'about')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    {editingSection === 'about' ? 'Ocultar editor' : 'Editar texto'}
                  </button>
                </div>

                {editingSection === 'about' && (
                  <div className="pt-2">
                    <textarea
                      rows={3}
                      value={studioState.sectionAboutCompanyContent}
                      onChange={(e) =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionAboutCompanyContent: e.target.value,
                        }))
                      }
                      placeholder="Descreva sua empresa, tempo de mercado e diferenciais..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Seção Garantias */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={studioState.sectionWarranties}
                      onClick={() =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionWarranties: !prev.sectionWarranties,
                        }))
                      }
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                        studioState.sectionWarranties ? 'bg-blue-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                          studioState.sectionWarranties ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Garantias Asseguradas</span>
                      <p className="text-[11px] text-slate-500">Garantias de módulos, inversores e instalação do integrador</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingSection(editingSection === 'warranties' ? null : 'warranties')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    {editingSection === 'warranties' ? 'Ocultar editor' : 'Editar texto'}
                  </button>
                </div>

                {editingSection === 'warranties' && (
                  <div className="pt-2">
                    <textarea
                      rows={3}
                      value={studioState.sectionWarrantiesContent}
                      onChange={(e) =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionWarrantiesContent: e.target.value,
                        }))
                      }
                      placeholder="Especifique os prazos e termos de garantia..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Seção Cronograma */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={studioState.sectionSchedule}
                      onClick={() =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionSchedule: !prev.sectionSchedule,
                        }))
                      }
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                        studioState.sectionSchedule ? 'bg-blue-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                          studioState.sectionSchedule ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Cronograma de Implantação</span>
                      <p className="text-[11px] text-slate-500">Passos desde a assinatura até a homologação na concessionária</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingSection(editingSection === 'schedule' ? null : 'schedule')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    {editingSection === 'schedule' ? 'Ocultar editor' : 'Editar texto'}
                  </button>
                </div>

                {editingSection === 'schedule' && (
                  <div className="pt-2">
                    <textarea
                      rows={3}
                      value={studioState.sectionScheduleContent}
                      onChange={(e) =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionScheduleContent: e.target.value,
                        }))
                      }
                      placeholder="Passos e prazos de instalação e ligação..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Seção Termos e Condições */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={studioState.sectionTerms}
                      onClick={() =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionTerms: !prev.sectionTerms,
                        }))
                      }
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                        studioState.sectionTerms ? 'bg-blue-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                          studioState.sectionTerms ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Termos e Condições Comerciais</span>
                      <p className="text-[11px] text-slate-500">Cláusulas de responsabilidade e regras contratuais</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingSection(editingSection === 'terms' ? null : 'terms')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    {editingSection === 'terms' ? 'Ocultar editor' : 'Editar texto'}
                  </button>
                </div>

                {editingSection === 'terms' && (
                  <div className="pt-2">
                    <textarea
                      rows={3}
                      value={studioState.sectionTermsContent}
                      onChange={(e) =>
                        setStudioState((prev) => ({
                          ...prev,
                          sectionTermsContent: e.target.value,
                        }))
                      }
                      placeholder="Condições comerciais e técnicas..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: PROPOSTA DIGITAL (4)                                    */}
        {/* ============================================================== */}
        {activeTab === 'digital' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Configurações da Proposta Digital Web
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Governa a experiência do comprador quando visualizar a proposta pelo smartphone ou navegador.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveStudio(studioState, 'Configurações digitais salvas com sucesso!')}
                disabled={isSavingStudio}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingStudio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Salvar Configurações Digitais</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Hero Banner Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={studioState.digitalHeroBanner}
                    onClick={() =>
                      setStudioState((prev) => ({ ...prev, digitalHeroBanner: !prev.digitalHeroBanner }))
                    }
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      studioState.digitalHeroBanner ? 'bg-blue-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                        studioState.digitalHeroBanner ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Banner de Destaque (Hero)</span>
                    <p className="text-[11px] text-slate-500">
                      Exibe cartão moderno com degradê da marca, valor e informações principais do cliente
                    </p>
                  </div>
                </div>
              </div>

              {/* ROI & Payback Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={studioState.digitalDisplayRoi}
                    onClick={() =>
                      setStudioState((prev) => ({ ...prev, digitalDisplayRoi: !prev.digitalDisplayRoi }))
                    }
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      studioState.digitalDisplayRoi ? 'bg-blue-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                        studioState.digitalDisplayRoi ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Métricas de Retorno (Payback Estimado)</span>
                    <p className="text-[11px] text-slate-500">
                      Apresenta estimativa transparente do tempo de retorno do investimento fotovoltaico
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhes Técnicos Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={studioState.digitalProductConfigDetailed}
                    onClick={() =>
                      setStudioState((prev) => ({
                        ...prev,
                        digitalProductConfigDetailed: !prev.digitalProductConfigDetailed,
                      }))
                    }
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      studioState.digitalProductConfigDetailed ? 'bg-blue-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                        studioState.digitalProductConfigDetailed ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Detalhamento Técnico de Equipamentos</span>
                    <p className="text-[11px] text-slate-500">
                      Permite ao comprador ver marcas, modelos e garantias detalhadas de cada equipamento
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Visualização da Proposta Digital
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Clique para conferir exatamente como o comprador interagirá com a proposta no navegador.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onViewProposalModal(proposal)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Abrir Prévia Digital</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: CONDIÇÕES COMERCIAIS (5)                                */}
        {/* ============================================================== */}
        {activeTab === 'comercial' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Condições Comerciais e Formas de Pagamento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure prazos de validade, regras de faturamento e descontos especiais aplicados nesta proposta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveStudio(studioState, 'Condições comerciais salvas com sucesso!')}
                disabled={isSavingStudio}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingStudio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Salvar Condições</span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Validade da Proposta</label>
                <input
                  type="date"
                  value={studioState.validityDate}
                  onChange={(e) => setStudioState((prev) => ({ ...prev, validityDate: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Data limite para aprovação pelo comprador</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Formas de Pagamento Aceitas</label>
                <input
                  type="text"
                  value={studioState.paymentCondition}
                  onChange={(e) => setStudioState((prev) => ({ ...prev, paymentCondition: e.target.value }))}
                  placeholder="Ex.: À vista (Pix / TED) ou Financiamento Solar até 84x"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Exibido no documento PDF e na proposta web</p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Observações e Notas Comerciais</label>
                <textarea
                  rows={3}
                  value={studioState.commercialNotes}
                  onChange={(e) => setStudioState((prev) => ({ ...prev, commercialNotes: e.target.value }))}
                  placeholder="Notas internas ou observações comerciais para o cliente..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={studioState.displayConditionsOnDoc}
                    onClick={() =>
                      setStudioState((prev) => ({
                        ...prev,
                        displayConditionsOnDoc: !prev.displayConditionsOnDoc,
                      }))
                    }
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      studioState.displayConditionsOnDoc ? 'bg-blue-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                        studioState.displayConditionsOnDoc ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <span className="text-xs font-bold text-slate-900">
                    Exibir condições de pagamento e validade no documento PDF impresso
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: DOCUMENTOS (PDF)                                        */}
        {/* ============================================================== */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Documentos Anexados (PDF da Proposta)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documentos vinculados à versão atual (v{currentVersion?.number || 1})
                </p>
              </div>

              {isDraft && (
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{uploadingDoc ? 'Enviando...' : 'Anexar PDF Próprio'}</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {docError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{docError}</span>
              </div>
            )}

            {documents.length > 0 ? (
              <div className="space-y-2.5">
                {documents.map((doc) => {
                  const downloadUrl = companyMarketplaceProposalsApi.documentDownloadUrl(
                    proposal.id,
                    currentVersion?.id || 0,
                    doc.id,
                    companyId
                  );

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {doc.filename || 'Documento da proposta'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {doc.byte_size ? `${(doc.byte_size / 1024).toFixed(1)} KB` : 'PDF'}
                            {doc.created_at && ` · ${new Date(doc.created_at).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          <span>Baixar</span>
                        </a>

                        {isDraft && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Remover documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Nenhum documento PDF anexado</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Você pode anexar seu próprio PDF ou gerar usando o modelo oficial Avalia Solar.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: HISTÓRICO                                               */}
        {/* ============================================================== */}
        {activeTab === 'historico' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Versões Desta Proposta
              </h4>
              {proposal.versions && proposal.versions.length > 0 ? (
                <div className="space-y-2">
                  {proposal.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-3.5 text-xs',
                        ver.id === currentVersion?.id
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-slate-200 bg-white'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Versão {ver.number}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {ver.status}
                          </span>
                          {ver.id === currentVersion?.id && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{ver.title}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          {formatBrlCurrency(ver.total_cents)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {ver.published_at
                            ? new Date(ver.published_at).toLocaleDateString('pt-BR')
                            : 'Rascunho'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nenhuma versão anterior.</p>
              )}
            </div>

            {/* Reuniões Agendadas */}
            {proposal.meetings && proposal.meetings.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Reuniões Agendadas
                </h4>
                <div className="space-y-2">
                  {proposal.meetings.map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{m.meeting_type}</span>
                        <span className="font-semibold text-slate-600">{m.status}</span>
                      </div>
                      {m.scheduled_at && (
                        <p className="text-slate-500 text-[11px] mt-1">
                          Data: {new Date(m.scheduled_at).toLocaleString('pt-BR')}
                        </p>
                      )}
                      {m.notes && <p className="text-slate-600 text-[11px] mt-0.5">{m.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Nova Versão */}
      {showConfirmNewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Criar Nova Versão da Proposta?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Esta ação criará um novo rascunho (versão {(currentVersion?.number || 1) + 1}) mantendo a versão anterior publicada intacta para auditoria e histórico do comprador.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmNewVersion(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowConfirmNewVersion(false);
                  await onCreateNewVersion(proposal);
                }}
                disabled={isCreatingVersion}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                {isCreatingVersion ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Confirmar e Criar Versão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações das Propostas (Padrão 77SOL / Avalia Solar) */}
      {isSettingsStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-7xl h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <ProposalSettingsStudio onClose={() => setIsSettingsStudioOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
