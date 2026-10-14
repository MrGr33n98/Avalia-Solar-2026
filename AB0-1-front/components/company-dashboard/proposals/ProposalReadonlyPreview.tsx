'use client';

import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  Globe,
  Building2,
  ShieldCheck,
  Clock,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  companyMarketplaceProposalsApi,
  type MarketplaceProposal,
} from '@/lib/api';
import {
  formatBrlCurrency,
  getStatusInfo,
  parseProposalStudioState,
  ORIGINAL_PDF_TEMPLATES,
} from '@/lib/proposals/domain';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProposalReadonlyPreviewProps {
  isOpen: boolean;
  proposal: MarketplaceProposal | null;
  companyId: number | string;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return 'Não informada';
  const parsed = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'Não informada' : parsed.toLocaleDateString('pt-BR');
}

export function ProposalReadonlyPreview({
  isOpen,
  proposal,
  companyId,
  onClose,
}: ProposalReadonlyPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'pdf' | 'digital'>('pdf');

  if (!proposal) return null;

  const version = proposal.version;
  const documents = version?.documents || [];
  const statusInfo = getStatusInfo(proposal.status);
  const primaryDocument = documents[0];
  const primaryDocumentPreviewUrl =
    primaryDocument && version
      ? companyMarketplaceProposalsApi.documentDownloadUrl(
          proposal.id,
          version.id,
          primaryDocument.id,
          companyId,
          true
        )
      : null;

  const studioState = parseProposalStudioState(version?.terms);
  const currentTemplate =
    ORIGINAL_PDF_TEMPLATES.find((t) => t.id === studioState.templateId) ||
    ORIGINAL_PDF_TEMPLATES[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[min(94dvh,980px)] w-[min(96vw,1200px)] max-w-none flex-col gap-0 overflow-hidden p-0"
        fallbackTitle={null}
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-5 py-3.5 pr-16 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-lg font-black text-slate-950">
                Pré-visualização da proposta
              </DialogTitle>
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
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {currentTemplate.name}
              </span>
            </div>

            {/* Alternador de Modo: PDF vs Digital */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode('pdf')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  previewMode === 'pdf'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <FileText className="h-3.5 w-3.5 text-rose-600" />
                <span>Documento PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('digital')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  previewMode === 'digital'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Globe className="h-3.5 w-3.5 text-blue-600" />
                <span>Proposta Digital</span>
              </button>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Visualização de {proposal.reference} · versão {version?.number || 1} · {previewMode === 'pdf' ? 'Layout formatado para impressão e download' : 'Visualização web interativa do cliente'}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 bg-slate-100/70 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Área Principal de Pré-visualização */}
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {previewMode === 'pdf' ? (
              primaryDocumentPreviewUrl ? (
                <iframe
                  src={primaryDocumentPreviewUrl}
                  title={`PDF da proposta ${proposal.reference}`}
                  className="h-full min-h-[580px] w-full rounded-xl border border-slate-200 bg-white shadow-sm"
                />
              ) : (
                /* Simulação do PDF Gerado com o Modelo Original Selecionado */
                <article
                  aria-label={`Conteúdo da proposta ${proposal.reference}`}
                  className="mx-auto min-h-full w-full max-w-[800px] rounded-xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
                  style={{ borderTop: `4px solid ${studioState.mainColor}` }}
                >
                  {/* Cabeçalho do Documento */}
                  <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: studioState.mainColor }}
                        />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {proposal.company?.name || 'Integrador Solar'}
                        </p>
                      </div>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        {version?.title || 'Proposta para seu projeto'}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Preparada para <strong>{proposal.lead?.name || 'Comprador'}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                        REF: {proposal.reference}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        Emissão: {formatDate(proposal.created_at)}
                      </p>
                    </div>
                  </header>

                  {/* Resumo Financeiro / Métricas */}
                  <dl className="grid gap-3 border-b border-slate-200 py-6 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3.5">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Investimento Total
                      </dt>
                      <dd
                        className="mt-1 text-xl font-black"
                        style={{ color: studioState.mainColor }}
                      >
                        {formatBrlCurrency(proposal.total_cents)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3.5">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Validade da Proposta
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-slate-800">
                        {formatDate(proposal.expires_at || version?.valid_until)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3.5">
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Condição de Pagamento
                      </dt>
                      <dd className="mt-1 text-xs font-semibold text-slate-800">
                        {studioState.paymentCondition || 'À vista ou Financiamento'}
                      </dd>
                    </div>
                  </dl>

                  {/* Resumo do Escopo */}
                  {version?.summary && (
                    <section className="py-5 border-b border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Escopo do Projeto
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {version.summary}
                      </p>
                    </section>
                  )}

                  {/* Tabela de Itens e Serviços */}
                  <section className="py-5 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Itens & Equipamentos
                    </h3>
                    {version?.items && version.items.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full min-w-[500px] text-left text-sm">
                          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-3.5 py-2">Item / Descrição</th>
                              <th className="px-3.5 py-2 text-center">Qtd</th>
                              <th className="px-3.5 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {version.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3.5 py-2.5">
                                  <p className="font-bold text-slate-900">{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                                  )}
                                </td>
                                <td className="px-3.5 py-2.5 text-center text-slate-700">
                                  {item.quantity || 1} {item.unit || 'un'}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                  {formatBrlCurrency(item.total_cents || item.unit_price_cents, false)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Nenhum item individual listado.</p>
                    )}
                  </section>

                  {/* Seções Modulares do PDF Ativadas */}
                  {studioState.sectionAboutCompany && studioState.sectionAboutCompanyContent && (
                    <section className="py-5 border-b border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Sobre a Empresa
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {studioState.sectionAboutCompanyContent}
                      </p>
                    </section>
                  )}

                  {studioState.sectionWarranties && studioState.sectionWarrantiesContent && (
                    <section className="py-5 border-b border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Garantias Asseguradas
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {studioState.sectionWarrantiesContent}
                      </p>
                    </section>
                  )}

                  {studioState.sectionSchedule && studioState.sectionScheduleContent && (
                    <section className="py-5 border-b border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Cronograma de Implantação
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {studioState.sectionScheduleContent}
                      </p>
                    </section>
                  )}

                  {studioState.sectionTerms && studioState.sectionTermsContent && (
                    <section className="py-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Termos e Condições Comerciais
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                        {studioState.sectionTermsContent}
                      </p>
                    </section>
                  )}
                </article>
              )
            ) : (
              /* Proposta Digital Web Interativa */
              <div className="mx-auto max-w-[800px] space-y-4">
                {/* Hero Banner Digital */}
                {studioState.digitalHeroBanner && (
                  <div
                    className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md sm:p-8"
                    style={{
                      background: `linear-gradient(135deg, ${studioState.mainColor} 0%, #0F172A 100%)`,
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90">
                      <Sparkles className="h-4 w-4" />
                      <span>Proposta Digital Personalizada</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      {version?.title || 'Sua Usina Solar com Alta Eficiência'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-200">
                      Elaborada para <strong>{proposal.lead?.name || 'Cliente'}</strong> por {proposal.company?.name || 'Integrador Autorizado'}.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4 border-t border-white/20 pt-4">
                      <div>
                        <span className="text-[11px] font-medium text-slate-300">Investimento</span>
                        <p className="text-xl font-black">{formatBrlCurrency(proposal.total_cents)}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-300">Validade</span>
                        <p className="text-sm font-bold">{formatDate(proposal.expires_at || version?.valid_until)}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-300">Pagamento</span>
                        <p className="text-sm font-bold">{studioState.paymentCondition || 'Condições flexíveis'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Métricas de Economia e Payback */}
                {studioState.digitalDisplayRoi && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Zap className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Geração Limpa</span>
                      </div>
                      <p className="mt-1 text-lg font-black text-slate-900">
                        {proposal.lead?.monthly_kwh ? `Até ${proposal.lead.monthly_kwh} kWh/mês` : 'Dimensionamento ideal'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Suprindo seu consumo atual</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Garantia</span>
                      </div>
                      <p className="mt-1 text-lg font-black text-slate-900">Até 25 anos</p>
                      <p className="text-xs text-slate-500 mt-0.5">Performance fotovoltaica</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Retorno Estimado</span>
                      </div>
                      <p className="mt-1 text-lg font-black text-slate-900">3 a 5 anos</p>
                      <p className="text-xs text-slate-500 mt-0.5">Payback típico em geração solar</p>
                    </div>
                  </div>
                )}

                {/* Lista de Itens Digital */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h3 className="text-sm font-black text-slate-950 mb-3">Equipamentos e Serviços Inclusos</h3>
                  <div className="divide-y divide-slate-100">
                    {version?.items?.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.name}</p>
                          {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 mr-2">{item.quantity || 1} {item.unit || 'un'}</span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatBrlCurrency(item.total_cents || item.unit_price_cents, false)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botões de Ação do Comprador (Simulação) */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Área de Decisão do Comprador
                    </h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Quando o cliente acessar o link da proposta, terá botões diretos de aceite e negociação no chat.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 opacity-70 cursor-not-allowed"
                    >
                      Solicitar Ajustes
                    </button>
                    <button
                      type="button"
                      disabled
                      className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white opacity-70 cursor-not-allowed"
                    >
                      Aceitar Proposta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Painel Lateral: Documentos e Informações de Versão */}
          <aside className="min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-black text-slate-950">Documentos da versão</h3>
            <p className="mt-1 text-xs text-slate-500">
              {primaryDocumentPreviewUrl
                ? 'Documento PDF oficial anexado pela sua empresa.'
                : 'Nenhum PDF foi anexado; exibindo os dados estruturados da versão.'}
            </p>

            <div className="mt-4 space-y-2">
              {documents.length > 0 ? (
                documents.map((document) => {
                  const previewUrl = version
                    ? companyMarketplaceProposalsApi.documentDownloadUrl(
                        proposal.id,
                        version.id,
                        document.id,
                        companyId,
                        true
                      )
                    : '#';
                  const downloadUrl = version
                    ? companyMarketplaceProposalsApi.documentDownloadUrl(
                        proposal.id,
                        version.id,
                        document.id,
                        companyId
                      )
                    : '#';

                  return (
                    <div key={document.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                        <span className="truncate text-xs font-bold text-slate-900">
                          {document.filename}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {(document.byte_size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          Abrir
                        </a>
                        <a
                          href={downloadUrl}
                          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Download className="h-3 w-3" aria-hidden="true" />
                          Baixar
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <FileText className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">Nenhum PDF anexado</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Você pode anexar seu próprio PDF ou gerar usando o modelo Avalia Solar.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

