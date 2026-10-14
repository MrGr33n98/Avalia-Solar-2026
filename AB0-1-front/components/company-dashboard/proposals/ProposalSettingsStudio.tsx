'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight,
  Maximize2,
  Check,
  Pencil,
  Plus,
  X,
  Trash2,
  Upload,
  Info,
  DollarSign,
  Layers,
  FileText,
  Sliders,
  Palette,
  ShieldCheck,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCompanyContext } from '@/context/CompanyContext';
import { companyProposalSettingsApi, type CompanyProposalSettingsPayload } from '@/lib/api';
import { SettingsSidebarNav } from './settings/SettingsSidebarNav';
import { PdfModelChooserDrawer } from './settings/PdfModelChooserDrawer';
import { PdfPreviewModal } from './settings/PdfPreviewModal';
import { SectionEditorDrawer, type EditingTarget } from './settings/SectionEditorDrawer';

export interface ProposalSettingsStudioProps {
  onClose?: () => void;
  className?: string;
  isStandalonePage?: boolean;
}

export type ProposalPdfModelId = 'modelo_1' | 'modelo_2' | 'modelo_3';

export interface PaymentConditionItem {
  id: string;
  name: string;
  enabled: boolean;
  hasInfo?: boolean;
  infoText?: string;
  installments?: number;
  discountPercent?: number;
}

export interface PricingCostTier {
  id: string;
  status: boolean;
  costName: string;
  pricePerKwp: number;
  fromKwp: number;
  toKwp: number;
  calculationType: 'Por kWp' | 'Fixo por projeto' | 'Percentual';
}

export interface SectionSettingItem {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  content?: string;
  details?: Record<string, any>;
}

export function ProposalSettingsStudio({
  onClose,
  className,
  isStandalonePage = false,
}: ProposalSettingsStudioProps) {
  const { activeCompany } = useCompanyContext();
  const companyId = activeCompany?.id ? String(activeCompany.id) : undefined;
  const companyName = activeCompany?.name || 'Sua Empresa';

  // Submenu Lateral
  const [activeSubSection, setActiveSubSection] = useState<string>('pdf_configuracoes');

  // Loading & Saving states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Model states
  const [selectedModel, setSelectedModel] = useState<ProposalPdfModelId>('modelo_1');
  const [savedModel, setSavedModel] = useState<ProposalPdfModelId>('modelo_1');
  const [isModelDrawerOpen, setIsModelDrawerOpen] = useState(false);
  const [expandedModelPreview, setExpandedModelPreview] = useState<ProposalPdfModelId | null>(null);

  // Colors & Cover states
  const [pdfColors, setPdfColors] = useState({
    primary: '#0066FF',
    secondary: '#0F172A',
    accent: '#F6E85A',
  });
  const [coverImageOption, setCoverImageOption] = useState<'padrao' | 'solar_ceu' | 'usina_solo' | 'custom'>('solar_ceu');

  // PDF Sections
  const [pdfSections, setPdfSections] = useState<SectionSettingItem[]>([
    { id: '1', key: 'sobre_empresa', label: 'Sobre a empresa', enabled: true, content: '' },
    { id: '2', key: 'imagem_obras', label: 'Imagens de obras', enabled: true, content: '' },
    { id: '3', key: 'titulo', label: 'Título', enabled: false, content: 'Proposta Comercial de Energia Solar' },
    { id: '4', key: 'garantias', label: 'Garantias', enabled: false, content: '' },
    { id: '5', key: 'termos_condicoes', label: 'Termos e Condições', enabled: true, content: '' },
    { id: '6', key: 'cronograma', label: 'Cronograma', enabled: true, content: '' },
  ]);

  // Payment Conditions
  const [paymentConditions, setPaymentConditions] = useState<PaymentConditionItem[]>([
    { id: 'boleto', name: 'Boleto', enabled: true, installments: 1, discountPercent: 5 },
    { id: 'cartao', name: 'Cartão de crédito', enabled: false, installments: 12, discountPercent: 0 },
    { id: 'financiamento', name: 'Calculadora de financiamentos', enabled: false, hasInfo: true, infoText: 'Exibe simulação bancária de até 72x no documento', installments: 72 },
    { id: 'transferencia', name: 'Transferência', enabled: true, installments: 1, discountPercent: 5 },
  ]);

  // Digital Sections
  const [digitalSections, setDigitalSections] = useState<SectionSettingItem[]>([
    { id: 'd1', key: 'cronograma', label: 'Cronograma', enabled: false },
    { id: 'd2', key: 'imagens_obras', label: 'Imagens de obras', enabled: false },
    { id: 'd3', key: 'imagem_capa', label: 'Imagem de capa', enabled: false },
  ]);

  // Pricing Tiers (Mão de obra e precificação)
  const [pricingTiers, setPricingTiers] = useState<PricingCostTier[]>([
    {
      id: 'p1',
      status: true,
      costName: 'Mão de Obra e Instalação Padrão',
      pricePerKwp: 650.0,
      fromKwp: 0,
      toKwp: 10,
      calculationType: 'Por kWp',
    },
    {
      id: 'p2',
      status: true,
      costName: 'Engenharia e Homologação na Concessionária',
      pricePerKwp: 1200.0,
      fromKwp: 0,
      toKwp: 0,
      calculationType: 'Fixo por projeto',
    },
  ]);

  // Editing drawer for section / color / cover / pricing
  const [editingModal, setEditingModal] = useState<EditingTarget>({ type: null });

  // Load from backend on mount or company change
  const loadSettingsFromBackend = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const response = await companyProposalSettingsApi.get(companyId);
      const s = response?.proposal_settings;
      if (s) {
        if (s.selected_model && ['modelo_1', 'modelo_2', 'modelo_3'].includes(s.selected_model)) {
          setSelectedModel(s.selected_model as ProposalPdfModelId);
          setSavedModel(s.selected_model as ProposalPdfModelId);
        }
        if (s.pdf_colors) {
          setPdfColors({
            primary: s.pdf_colors.primary || '#0066FF',
            secondary: s.pdf_colors.secondary || '#0F172A',
            accent: s.pdf_colors.accent || '#F6E85A',
          });
        }
        if (s.cover_mode && ['padrao', 'solar_ceu', 'usina_solo', 'custom'].includes(s.cover_mode)) {
          setCoverImageOption(s.cover_mode as any);
        }
        if (Array.isArray(s.pdf_sections) && s.pdf_sections.length > 0) {
          setPdfSections(s.pdf_sections);
        }
        if (Array.isArray(s.pricing_tiers) && s.pricing_tiers.length > 0) {
          setPricingTiers(s.pricing_tiers);
        }
        if (Array.isArray(s.payment_conditions) && s.payment_conditions.length > 0) {
          setPaymentConditions(s.payment_conditions);
        }
        if (Array.isArray(s.digital_sections) && s.digital_sections.length > 0) {
          setDigitalSections(s.digital_sections);
        }
      }
    } catch {
      // Fallback gracioso para local storage se backend ainda não responder
      try {
        const storageKey = `avalia_solar_proposal_settings_${companyId}`;
        const local = localStorage.getItem(storageKey);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.selectedModel) {
            setSelectedModel(parsed.selectedModel);
            setSavedModel(parsed.selectedModel);
          }
          if (parsed.pdfColors) setPdfColors(parsed.pdfColors);
          if (parsed.coverImageOption) setCoverImageOption(parsed.coverImageOption);
          if (parsed.pdfSections) setPdfSections(parsed.pdfSections);
          if (parsed.pricingTiers) setPricingTiers(parsed.pricingTiers);
          if (parsed.paymentConditions) setPaymentConditions(parsed.paymentConditions);
        }
      } catch (_) {}
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadSettingsFromBackend();
  }, [loadSettingsFromBackend]);

  // Save settings with backend persistence & optimistic update
  const persistSettings = async (
    overridePayload?: Partial<CompanyProposalSettingsPayload>,
    successMessage = 'Configurações de proposta salvas com sucesso!'
  ) => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const payload: CompanyProposalSettingsPayload = {
      selected_model: overridePayload?.selected_model || selectedModel,
      pdf_colors: overridePayload?.pdf_colors || pdfColors,
      cover_mode: overridePayload?.cover_mode || coverImageOption,
      pdf_sections: overridePayload?.pdf_sections || pdfSections,
      pricing_tiers: overridePayload?.pricing_tiers || pricingTiers,
      payment_conditions: overridePayload?.payment_conditions || paymentConditions,
      digital_sections: overridePayload?.digital_sections || digitalSections,
    };

    try {
      await companyProposalSettingsApi.update(payload, companyId);
      if (payload.selected_model) {
        setSavedModel(payload.selected_model as ProposalPdfModelId);
      }
      setSaveSuccessMsg(successMessage);
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      // Sincronizar cache local seguro
      if (typeof window !== 'undefined' && companyId) {
        localStorage.setItem(
          `avalia_solar_proposal_settings_${companyId}`,
          JSON.stringify({ ...payload, updatedAt: new Date().toISOString() })
        );
      }
    } catch (err: any) {
      setSaveErrorMsg('Não foi possível sincronizar com o servidor. Verifique sua conexão e permissões.');
      setTimeout(() => setSaveErrorMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePdfSection = (id: string) => {
    const section = pdfSections.find((s) => s.id === id);
    // Se estiver ativando e o conteúdo estiver vazio para seções textuais, abrir drawer para preencher
    if (section && !section.enabled && !section.content && ['1', '4', '5', '6'].includes(id)) {
      setEditingModal({ type: 'secao', item: section });
      return;
    }
    const updated = pdfSections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setPdfSections(updated);
    void persistSettings({ pdf_sections: updated });
  };

  const handleTogglePaymentCondition = (id: string) => {
    const updated = paymentConditions.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setPaymentConditions(updated);
    void persistSettings({ payment_conditions: updated });
  };

  const handleTogglePricingTier = (id: string) => {
    const updated = pricingTiers.map((t) => (t.id === id ? { ...t, status: !t.status } : t));
    setPricingTiers(updated);
    void persistSettings({ pricing_tiers: updated });
  };

  const handleDeletePricingTier = (id: string) => {
    const updated = pricingTiers.filter((t) => t.id !== id);
    setPricingTiers(updated);
    void persistSettings({ pricing_tiers: updated });
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800',
        className
      )}
    >
      {/* Top Header: Configurações & Abas Empresa / Definições de propostas */}
      <div className="border-b border-slate-200 bg-white px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Configurações
            </h1>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md border border-slate-200">
              {companyName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span>Carregando do servidor...</span>
              </span>
            )}

            {saveSuccessMsg && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </span>
            )}

            {saveErrorMsg && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg animate-in fade-in">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>{saveErrorMsg}</span>
              </span>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Voltar para propostas"
                title="Voltar para lista de propostas"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Abas Superiores Estilo 77SOL: Empresa | Definições de propostas */}
        <div className="flex items-center gap-8 text-sm font-bold border-b border-transparent -mb-[1px]">
          <button
            type="button"
            className="pb-3 text-slate-500 hover:text-slate-800 transition-colors font-medium text-[13px]"
          >
            Empresa
          </button>
          <button
            type="button"
            className="pb-3 text-blue-600 border-b-2 border-blue-600 font-bold text-[13px]"
          >
            Definições de propostas
          </button>
        </div>
      </div>

      {/* Miolo: Menu Lateral (Zona A) + Canvas Central (Zona B) + Drawers (Zona C) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* ZONA A: Submenu Lateral */}
        <SettingsSidebarNav
          activeSection={activeSubSection}
          onSelectSection={setActiveSubSection}
        />

        {/* ZONA B: Canvas Central */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/40">
          {/* SEÇÃO 1: Proposta PDF -> Configurações */}
          {activeSubSection === 'pdf_configuracoes' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Configurações Proposta PDF
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione e configure as informações da sua proposta PDF oficial.
                </p>
              </div>

              {/* Banner Destacado: Definir Modelo da Proposta */}
              <div
                onClick={() => setIsModelDrawerOpen(true)}
                className="cursor-pointer rounded-2xl bg-blue-600 p-5 text-white shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Definir Modelo da Proposta</h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      Modelo ativo:{' '}
                      <strong className="underline underline-offset-2">
                        {selectedModel === 'modelo_1' && 'Modelo 1 (Essencial Técnico)'}
                        {selectedModel === 'modelo_2' && 'Modelo 2 (Executivo Azul)'}
                        {selectedModel === 'modelo_3' && 'Modelo 3 (Técnico Solar)'}
                      </strong>
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/80 shrink-0" />
              </div>

              {/* Linha: Cores da Proposta */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
                    style={{ backgroundColor: pdfColors.primary }}
                  >
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Cores da proposta PDF</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {pdfColors.primary} • {pdfColors.secondary} • {pdfColors.accent}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingModal({ type: 'cores' })}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Editar
                </button>
              </div>

              {/* Linha: Imagem de Capa */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Imagem de capa</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {coverImageOption === 'solar_ceu' && 'Céu Límpido com Painéis'}
                      {coverImageOption === 'usina_solo' && 'Usina Fotovoltaica de Solo'}
                      {coverImageOption === 'padrao' && 'Fundo Neutro com Logotipo'}
                      {coverImageOption === 'custom' && 'Imagem personalizada'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingModal({ type: 'capa' })}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Editar
                </button>
              </div>

              {/* Tabela Compacta de Seções (Switch + Label + Editar) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Status</span>
                  <span>Informações</span>
                  <span className="text-right">Ação</span>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  {pdfSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={sec.enabled}
                          onCheckedChange={() => handleTogglePdfSection(sec.id)}
                          aria-label={`Ativar seção ${sec.label}`}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{sec.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 max-w-md truncate">
                            {sec.content || 'Nenhum conteúdo configurado'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingModal({ type: 'secao', item: sec })}
                        className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 2: Geral -> Mão de obra */}
          {activeSubSection === 'geral_mao_de_obra' && (
            <div className="max-w-4xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Precificação
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure os valores abaixo por R$/kWp ou R$/dimensionamento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingModal({ type: 'precificacao_novo' })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Inserir custo</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Custo</th>
                      <th className="p-3.5">Preço/kWp</th>
                      <th className="p-3.5">De (kWp)</th>
                      <th className="p-3.5">Até (kWp)</th>
                      <th className="p-3.5">Cálculo</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pricingTiers.map((tier) => (
                      <tr key={tier.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <Switch
                            checked={tier.status}
                            onCheckedChange={() => handleTogglePricingTier(tier.id)}
                            aria-label={`Status do custo ${tier.costName}`}
                          />
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{tier.costName}</td>
                        <td className="p-3.5 font-mono font-bold text-blue-600">
                          R$ {tier.pricePerKwp.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-slate-600">{tier.fromKwp}</td>
                        <td className="p-3.5 text-slate-600">{tier.toKwp || 'Ilimitado'}</td>
                        <td className="p-3.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {tier.calculationType}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePricingTier(tier.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remover custo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: Geral -> Condições de pagamento */}
          {activeSubSection === 'geral_pagamento' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Condições de pagamento
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Configure as condições de pagamento que você deseja mostrar nas suas propostas
                </p>
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {paymentConditions.map((cond) => (
                  <div
                    key={cond.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={cond.enabled}
                        onCheckedChange={() => handleTogglePaymentCondition(cond.id)}
                        aria-label={`Ativar forma de pagamento ${cond.name}`}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cond.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {cond.discountPercent ? `${cond.discountPercent}% de desconto à vista • ` : ''}
                          Até {cond.installments || 1}x
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingModal({ type: 'condicao_pagamento', item: cond })}
                      className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEÇÃO 4: Proposta Digital */}
          {activeSubSection.startsWith('digital_') && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Proposta Digital Interativa
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Configurações da experiência web visualizada pelo cliente no link seguro da proposta.
                </p>
              </div>

              {activeSubSection === 'digital_roi' && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 text-xs text-blue-900 leading-relaxed">
                  <h4 className="font-bold text-sm text-blue-950 mb-1">
                    Cálculo de Retorno do Investimento (ROI / Payback)
                  </h4>
                  <p>
                    O cálculo financeiro de retorno do investimento é calculado dinamicamente com base nas premissas de geração e tarifa da distribuidora vinculadas a cada proposta e lead específico.
                  </p>
                </div>
              )}

              {activeSubSection === 'digital_configuracoes' && (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  {digitalSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={sec.enabled}
                          onCheckedChange={() => {
                            const updated = digitalSections.map((d) => (d.id === sec.id ? { ...d, enabled: !d.enabled } : d));
                            setDigitalSections(updated);
                            void persistSettings({ digital_sections: updated });
                          }}
                          aria-label={`Ativar seção digital ${sec.label}`}
                        />
                        <p className="text-xs font-bold text-slate-900">{sec.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSubSection === 'digital_cores' && (
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Paleta Digital Sincronizada</h4>
                  <p className="text-xs text-slate-500">
                    A Proposta Digital utiliza as cores institucionais configuradas na Proposta PDF ({pdfColors.primary}).
                  </p>
                </div>
              )}

              {activeSubSection === 'digital_produtos' && (
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Catálogo de Equipamentos Homologados</h4>
                  <p className="text-xs text-slate-500">
                    Os equipamentos cadastrados nas versões das propostas são apresentados com selos de eficiência energética e dados técnicos originais.
                  </p>
                </div>
              )}

              {activeSubSection === 'digital_comissao' && (
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Comissionamento de Vendas</h4>
                  <p className="text-xs text-slate-500">
                    Módulo de controle interno restrito a gestores comerciais autenticados. Dados de comissão nunca são expostos ao comprador.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ZONA C: Gaveta de Modelo PDF */}
        <PdfModelChooserDrawer
          isOpen={isModelDrawerOpen}
          selectedModel={selectedModel}
          savedModel={savedModel}
          companyName={companyName}
          isSaving={isSaving}
          onSelectModel={setSelectedModel}
          onExpandPreview={(id) => setExpandedModelPreview(id)}
          onSave={() => {
            void persistSettings(
              { selected_model: selectedModel },
              `Modelo ${selectedModel.replace('modelo_', '')} salvo como padrão!`
            );
            setIsModelDrawerOpen(false);
          }}
          onClose={() => setIsModelDrawerOpen(false)}
        />

        {/* ZONA C: Gaveta de Edição de Seção / Cores / Capa */}
        <SectionEditorDrawer
          editingTarget={editingModal}
          companyName={companyName}
          pdfColors={pdfColors}
          coverOption={coverImageOption}
          onSaveColors={(colors) => {
            setPdfColors(colors);
            void persistSettings({ pdf_colors: colors }, 'Cores salvas com sucesso!');
          }}
          onSaveCover={(cover) => {
            setCoverImageOption(cover);
            void persistSettings({ cover_mode: cover }, 'Capa atualizada com sucesso!');
          }}
          onSaveSection={(id, content) => {
            const updated = pdfSections.map((s) => (s.id === id ? { ...s, content, enabled: true } : s));
            setPdfSections(updated);
            void persistSettings({ pdf_sections: updated }, 'Seção atualizada com sucesso!');
          }}
          onSavePaymentCondition={(item) => {
            const updated = paymentConditions.map((c) => (c.id === item.id ? item : c));
            setPaymentConditions(updated);
            void persistSettings({ payment_conditions: updated }, 'Condições de pagamento salvas!');
          }}
          onSavePricingTier={(tier) => {
            const newTier: PricingCostTier = {
              ...tier,
              id: `p_${Date.now()}`,
            };
            const updated = [...pricingTiers, newTier];
            setPricingTiers(updated);
            void persistSettings({ pricing_tiers: updated }, 'Novo custo de mão de obra inserido!');
          }}
          onClose={() => setEditingModal({ type: null })}
        />
      </div>

      {/* MODAL FULLSCREEN DE PRÉVIA EXPANDIDA DO MODELO (A4 PAGINADO REAL) */}
      <PdfPreviewModal
        modelId={expandedModelPreview}
        companyName={companyName}
        onClose={() => setExpandedModelPreview(null)}
        onSelectAndSave={(modelId) => {
          setSelectedModel(modelId);
          void persistSettings(
            { selected_model: modelId },
            `Modelo ${modelId.replace('modelo_', '')} selecionado e salvo como padrão!`
          );
          setExpandedModelPreview(null);
          setIsModelDrawerOpen(false);
        }}
      />
    </div>
  );
}
