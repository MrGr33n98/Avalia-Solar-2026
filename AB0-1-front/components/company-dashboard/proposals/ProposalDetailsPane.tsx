'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  companyMarketplaceProposalsApi,
  type MarketplaceProposal,
  type MarketplaceProposalVersion,
} from '@/lib/api';
import {
  getStatusInfo,
  formatBrlCurrency,
  type ProductVertical,
} from '@/lib/proposals/domain';
import { cn } from '@/lib/utils';

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
  const [activeTab, setActiveTab] = useState<'resumo' | 'itens' | 'docs' | 'historico'>('resumo');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [showConfirmNewVersion, setShowConfirmNewVersion] = useState(false);

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

  const currentVersion = proposal.version;
  const statusInfo = getStatusInfo(proposal.status);
  const lead = proposal.lead;
  const isDraft = proposal.status === 'draft';
  const documents = currentVersion?.documents || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentVersion) return;

    if (file.type !== 'application/pdf') {
      setDocError('Apenas arquivos em formato PDF são aceitos.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setDocError('O arquivo deve ter no máximo 20MB.');
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

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-100 p-5 bg-slate-50/50 shrink-0">
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
          <div className="flex items-center gap-2">
            {onOpenChatMobile && (
              <button
                type="button"
                onClick={onOpenChatMobile}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 lg:hidden shadow-sm"
              >
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Conversa</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewProposalModal(proposal)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Ver proposta</span>
            </button>

            {isDraft ? (
              <button
                type="button"
                onClick={() => onOpenEditor(proposal)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span>Editar rascunho</span>
              </button>
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

        {/* Tab Navigation */}
        <div className="mt-4 flex items-center gap-1 border-t border-slate-200/60 pt-3">
          {[
            { id: 'resumo', label: 'Resumo Comercial' },
            { id: 'itens', label: 'Itens & Técnico' },
            { id: 'docs', label: `Documentos PDF (${documents.length})` },
            { id: 'historico', label: 'Histórico & Versões' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pane Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
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

        {activeTab === 'itens' && (
          <div className="space-y-6">
            {/* Tabela de Itens e Serviços */}
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

            {/* Termos Técnicos e Comerciais */}
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
                  <span>{uploadingDoc ? 'Enviando...' : 'Anexar PDF'}</span>
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
                  Anexe seu documento PDF personalizado para apresentar ao comprador.
                </p>
              </div>
            )}
          </div>
        )}

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
    </div>
  );
}
