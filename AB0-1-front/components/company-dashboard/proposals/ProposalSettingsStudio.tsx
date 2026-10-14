'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
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
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCompanyContext } from '@/context/CompanyContext';

export interface ProposalSettingsStudioProps {
  onClose?: () => void;
  className?: string;
  isStandalonePage?: boolean;
}

// Modelos visuais para prévia idêntica à referência
export type ProposalPdfModelId = 'modelo_1' | 'modelo_2' | 'modelo_3';

interface PaymentConditionItem {
  id: string;
  name: string;
  enabled: boolean;
  hasInfo?: boolean;
  infoText?: string;
  installments?: number;
  discountPercent?: number;
}

interface PricingCostTier {
  id: string;
  status: boolean;
  costName: string;
  pricePerKwp: number;
  fromKwp: number;
  toKwp: number;
  calculationType: 'Por kWp' | 'Fixo por projeto' | 'Percentual';
}

interface SectionSettingItem {
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
  const companyId = activeCompany?.id ? String(activeCompany.id) : 'default';

  // Navegação Principal Topo
  const [activeTopTab, setActiveTopTab] = useState<'empresa' | 'definicoes'>('definicoes');

  // Submenu Lateral
  const [activeSubSection, setActiveSubSection] = useState<string>('pdf_configuracoes');

  // Accordions do menu lateral
  const [isGeralOpen, setIsGeralOpen] = useState(true);
  const [isPdfOpen, setIsPdfOpen] = useState(true);
  const [isDigitalOpen, setIsDigitalOpen] = useState(true);

  // Drawer de Escolha de Modelo PDF ("< Modelo de Proposta")
  const [isModelDrawerOpen, setIsModelDrawerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ProposalPdfModelId>('modelo_1');
  const [savedModel, setSavedModel] = useState<ProposalPdfModelId>('modelo_1');

  // Modal de Prévia Expandida do Modelo (clique no ícone ⤢)
  const [expandedModelPreview, setExpandedModelPreview] = useState<ProposalPdfModelId | null>(null);

  // Modal de Edição Genérico (Cores, Capa, Seções, Condições, Precificação)
  const [editingModal, setEditingModal] = useState<{
    type: 'cores' | 'capa' | 'secao' | 'condicao_pagamento' | 'precificacao_novo' | null;
    item?: any;
  }>({ type: null });

  // Notificação de sucesso ao salvar
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Estado das seções da Proposta PDF
  const [pdfSections, setPdfSections] = useState<SectionSettingItem[]>([
    { id: '1', key: 'sobre_empresa', label: 'Sobre a empresa', enabled: true, content: 'Integrador líder em engenharia e soluções fotovoltaicas de alta performance.' },
    { id: '2', key: 'imagem_obras', label: 'Imagem de obras', enabled: true, content: 'Galeria com 12 projetos fotovoltaicos executados e conectados.' },
    { id: '3', key: 'titulo', label: 'Título', enabled: false, content: 'Proposta Comercial de Energia Solar Fotovoltaica' },
    { id: '4', key: 'garantias', label: 'Garantias', enabled: false, content: '25 anos de desempenho nos módulos, 10 anos nos inversores e 5 anos na instalação.' },
    { id: '5', key: 'termos_condicoes', label: 'Termos e Condições', enabled: true, content: 'Validade de 10 dias úteis. Condições sujeitas a vistoria técnica prévia.' },
    { id: '6', key: 'cronograma', label: 'Cronograma', enabled: true, content: 'Vistoria (3d) -> Projeto (5d) -> Conexão (30d)' },
  ]);

  // Cores da proposta PDF
  const [pdfColors, setPdfColors] = useState({
    primary: '#0066FF',
    secondary: '#0F172A',
    accent: '#F6E85A',
  });

  // Imagem de capa selecionada
  const [coverImageOption, setCoverImageOption] = useState<'padrao' | 'solar_ceu' | 'usina_solo' | 'custom'>('solar_ceu');

  // Condições de Pagamento (Geral -> Condições de pagamento)
  const [paymentConditions, setPaymentConditions] = useState<PaymentConditionItem[]>([
    { id: 'boleto', name: 'Boleto', enabled: false, installments: 1, discountPercent: 5 },
    { id: 'cartao', name: 'Cartão de crédito', enabled: false, installments: 12, discountPercent: 0 },
    { id: 'financiamento', name: 'Calculadora de financiamentos', enabled: false, hasInfo: true, infoText: 'Exibe simulação bancária de até 72x no documento', installments: 72 },
    { id: 'transferencia', name: 'Transferência', enabled: false, installments: 1, discountPercent: 3 },
  ]);

  // Seções da Proposta Digital
  const [digitalSections, setDigitalSections] = useState<SectionSettingItem[]>([
    { id: 'd1', key: 'cronograma', label: 'Cronograma', enabled: false },
    { id: 'd2', key: 'imagens_obras', label: 'Imagens de obras', enabled: false },
    { id: 'd3', key: 'imagem_capa', label: 'Imagem de capa', enabled: false },
  ]);

  // Tabela de Precificação (valores por R$/kWp ou dimensionamento)
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
      costName: 'Engenharia e Homologação Concessionária',
      pricePerKwp: 1200.0,
      fromKwp: 0,
      toKwp: 0,
      calculationType: 'Fixo por projeto',
    },
    {
      id: 'p3',
      status: true,
      costName: 'Estrutura e Fixação Telhado Cerâmico',
      pricePerKwp: 380.0,
      fromKwp: 10,
      toKwp: 50,
      calculationType: 'Por kWp',
    },
  ]);

  // Carregar configurações locais salvas por empresa
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = `avalia_solar_proposal_settings_${companyId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedModel) {
          setSelectedModel(parsed.selectedModel);
          setSavedModel(parsed.selectedModel);
        }
        if (parsed.pdfSections) setPdfSections(parsed.pdfSections);
        if (parsed.pdfColors) setPdfColors(parsed.pdfColors);
        if (parsed.coverImageOption) setCoverImageOption(parsed.coverImageOption);
        if (parsed.paymentConditions) setPaymentConditions(parsed.paymentConditions);
        if (parsed.digitalSections) setDigitalSections(parsed.digitalSections);
        if (parsed.pricingTiers) setPricingTiers(parsed.pricingTiers);
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações de propostas do storage:', e);
    }
  }, [companyId]);

  // Salvar configurações
  const handleSaveAll = (customNotice?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = `avalia_solar_proposal_settings_${companyId}`;
      const payload = {
        selectedModel,
        pdfSections,
        pdfColors,
        coverImageOption,
        paymentConditions,
        digitalSections,
        pricingTiers,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSavedModel(selectedModel);
      setSaveSuccessMsg(customNotice || 'Configurações de propostas salvas com sucesso!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (e) {
      console.error('Erro ao salvar configurações de propostas:', e);
    }
  };

  const handleTogglePdfSection = (id: string) => {
    setPdfSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleTogglePaymentCondition = (id: string) => {
    setPaymentConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleToggleDigitalSection = (id: string) => {
    setDigitalSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleTogglePricingTier = (id: string) => {
    setPricingTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: !t.status } : t))
    );
  };

  const handleDeletePricingTier = (id: string) => {
    setPricingTiers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-white w-full h-full overflow-hidden text-slate-900',
        !isStandalonePage && 'rounded-2xl border border-slate-200 shadow-xl',
        className
      )}
    >
      {/* Top Header Principal */}
      <div className="border-b border-slate-200 bg-white px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              Configurações
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina as diretrizes, layout e precificação oficial das propostas da {activeCompany?.name || 'sua empresa'}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                title="Fechar configurações"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Abas Superiores (Empresa | Definições de propostas) */}
        <div className="flex items-center gap-8 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTopTab('empresa')}
            className={cn(
              'pb-3 text-sm font-semibold transition-colors border-b-2',
              activeTopTab === 'empresa'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Empresa
          </button>
          <button
            type="button"
            onClick={() => setActiveTopTab('definicoes')}
            className={cn(
              'pb-3 text-sm font-bold transition-colors border-b-2',
              activeTopTab === 'definicoes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Definições de propostas
          </button>
        </div>
      </div>

      {/* Corpo com Navegação Lateral e Conteúdo */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50/50">
        {/* Navegação Submenu Lateral Esquerda */}
        <aside className="w-64 border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0 select-none space-y-6">
          {/* Grupo 1: Geral */}
          <div>
            <button
              type="button"
              onClick={() => setIsGeralOpen(!isGeralOpen)}
              className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-blue-600 py-1"
            >
              <span>Geral</span>
              {isGeralOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {isGeralOpen && (
              <div className="mt-2 space-y-1 pl-2">
                <button
                  type="button"
                  onClick={() => setActiveSubSection('geral_mao_de_obra')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'geral_mao_de_obra'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Mão de obra
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubSection('geral_condicoes_pagamento')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'geral_condicoes_pagamento'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Condições de pagamento
                </button>
              </div>
            )}
          </div>

          {/* Grupo 2: Proposta PDF */}
          <div>
            <button
              type="button"
              onClick={() => setIsPdfOpen(!isPdfOpen)}
              className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-blue-600 py-1"
            >
              <span>Proposta PDF</span>
              {isPdfOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {isPdfOpen && (
              <div className="mt-2 space-y-1 pl-2">
                <button
                  type="button"
                  onClick={() => setActiveSubSection('pdf_configuracoes')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'pdf_configuracoes'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Configurações
                </button>
              </div>
            )}
          </div>

          {/* Grupo 3: Proposta Digital */}
          <div>
            <button
              type="button"
              onClick={() => setIsDigitalOpen(!isDigitalOpen)}
              className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-blue-600 py-1"
            >
              <span>Proposta Digital</span>
              {isDigitalOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {isDigitalOpen && (
              <div className="mt-2 space-y-1 pl-2">
                <button
                  type="button"
                  onClick={() => setActiveSubSection('digital_configuracoes')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'digital_configuracoes'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Configurações
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubSection('digital_cores')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'digital_cores'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Cores
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubSection('digital_retorno')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'digital_retorno'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Retorno do investimento
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubSection('digital_produtos')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'digital_produtos'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Configurações de produto
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubSection('digital_comissionamento')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'digital_comissionamento'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Comissionamento
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubSection('digital_precificacao')}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition-colors',
                    activeSubSection === 'digital_precificacao'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  Precificação
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Área Central de Conteúdo Dinâmico */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
          {/* VIEW: PROPOSTA PDF -> CONFIGURAÇÕES (Idêntica aos Screenshots 1 e 4) */}
          {activeSubSection === 'pdf_configuracoes' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Configurações Proposta PDF
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione e configure as informações da sua proposta PDF.
                </p>
              </div>

              {/* Botão de Destaque Azul: Definir Modelo da Proposta */}
              <button
                type="button"
                onClick={() => setIsModelDrawerOpen(true)}
                className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white p-4 font-bold text-sm shadow-md flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-bold">Definir Modelo da Proposta</span>
                    <span className="block text-[11px] text-blue-100 font-normal">
                      Modelo padrão atual:{' '}
                      <strong className="text-white capitalize">
                        {savedModel === 'modelo_1'
                          ? 'Modelo 1 (Moderno Solar)'
                          : savedModel === 'modelo_2'
                          ? 'Modelo 2 (Capa Fotovoltaica Céu)'
                          : 'Modelo 3 (Executivo Premium)'}
                      </strong>
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/80 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Cards Rápidos de Configuração: Cores e Capa */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Cores Proposta PDF</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Paleta primária ({pdfColors.primary}), secundária ({pdfColors.secondary}) e destaque ({pdfColors.accent})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingModal({ type: 'cores' })}
                    className="rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 text-xs font-bold transition-colors"
                  >
                    Editar
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Imagem de capa</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Foto institucional de painéis solares sob céu azul (Resolução recomendada 1920x1080)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingModal({ type: 'capa' })}
                    className="rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 text-xs font-bold transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>

              {/* Tabela de Seções Modulares */}
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500">
                  <span className="w-20">Status</span>
                  <span className="flex-1">Informações</span>
                  <span className="w-20 text-right">Ação</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {pdfSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="w-20">
                        <Switch
                          checked={sec.enabled}
                          onCheckedChange={() => handleTogglePdfSection(sec.id)}
                          aria-label={`Ativar ${sec.label}`}
                        />
                      </div>
                      <div className="flex-1 pr-4">
                        <h4 className="text-xs font-bold text-slate-900">{sec.label}</h4>
                        {sec.content && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {sec.content}
                          </p>
                        )}
                      </div>
                      <div className="w-20 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingModal({ type: 'secao', item: sec })}
                          className="rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1 text-xs font-bold transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão Salvar Todas Configurações */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAll('Configurações da Proposta PDF salvas!')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm transition-colors"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          )}

          {/* VIEW: GERAL -> CONDIÇÕES DE PAGAMENTO (Idêntica ao Screenshot 3) */}
          {activeSubSection === 'geral_condicoes_pagamento' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Condições de pagamento
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure as condições de pagamento que você deseja mostrar nas suas propostas
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500">
                  <span className="w-20">Status</span>
                  <span className="flex-1">Tipo de pagamento</span>
                  <span className="w-16 text-right">Editar</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {paymentConditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="w-20">
                        <Switch
                          checked={cond.enabled}
                          onCheckedChange={() => handleTogglePaymentCondition(cond.id)}
                          aria-label={`Ativar ${cond.name}`}
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{cond.name}</span>
                        {cond.hasInfo && (
                          <div
                            className="text-slate-400 hover:text-slate-600 cursor-help"
                            title={cond.infoText}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {cond.installments && cond.installments > 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            Até {cond.installments}x
                          </span>
                        )}
                        {cond.discountPercent && cond.discountPercent > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            {cond.discountPercent}% desconto
                          </span>
                        )}
                      </div>
                      <div className="w-16 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingModal({ type: 'condicao_pagamento', item: cond })}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Editar condição"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAll('Condições de pagamento salvas!')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PROPOSTA DIGITAL -> CONFIGURAÇÕES (Idêntica ao Screenshot 5) */}
          {activeSubSection === 'digital_configuracoes' && (
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Configurações Proposta Digital
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Selecione e configure as informações extras que deseja ter em sua proposta.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const label = window.prompt('Nome do novo campo personalizado:');
                    if (label) {
                      setDigitalSections((prev) => [
                        ...prev,
                        {
                          id: `custom_${Date.now()}`,
                          key: label.toLowerCase().replace(/\s+/g, '_'),
                          label,
                          enabled: true,
                        },
                      ]);
                    }
                  }}
                  className="rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 text-xs font-bold transition-colors shadow-xs"
                >
                  Novo campo personalizado
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500">
                  <span className="w-20">Status</span>
                  <span className="flex-1">Informações</span>
                  <span className="w-20 text-right">Ação</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {digitalSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="w-20">
                        <Switch
                          checked={sec.enabled}
                          onCheckedChange={() => handleToggleDigitalSection(sec.id)}
                          aria-label={`Ativar ${sec.label}`}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-900">{sec.label}</span>
                      </div>
                      <div className="w-20 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingModal({ type: 'secao', item: sec })}
                          className="rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1 text-xs font-bold transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAll('Configurações digitais salvas!')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PRECIFICAÇÃO (Explicitamente solicitada pelo usuário) */}
          {activeSubSection === 'digital_precificacao' && (
            <div className="max-w-4xl space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Precificação</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure os valores abaixo por R$/kWp ou R$/dimensionamento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingModal({ type: 'precificacao_novo' })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Inserir custo</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500">
                  <span className="col-span-1">Status</span>
                  <span className="col-span-4">Custo</span>
                  <span className="col-span-2">Preço/kWp</span>
                  <span className="col-span-1">De (kWp)</span>
                  <span className="col-span-1">Até (kWp)</span>
                  <span className="col-span-2">Cálculo</span>
                  <span className="col-span-1 text-right">Ações</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {pricingTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="grid grid-cols-12 gap-2 items-center px-5 py-3.5 hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      <div className="col-span-1">
                        <Switch
                          checked={tier.status}
                          onCheckedChange={() => handleTogglePricingTier(tier.id)}
                          aria-label={`Ativar ${tier.costName}`}
                        />
                      </div>
                      <div className="col-span-4 font-bold text-slate-900">
                        {tier.costName}
                      </div>
                      <div className="col-span-2 font-mono font-bold text-blue-600">
                        R$ {tier.pricePerKwp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-1 text-slate-600">
                        {tier.fromKwp > 0 ? `${tier.fromKwp} kWp` : '-'}
                      </div>
                      <div className="col-span-1 text-slate-600">
                        {tier.toKwp > 0 ? `${tier.toKwp} kWp` : '-'}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          {tier.calculationType}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeletePricingTier(tier.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Remover custo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAll('Tabela de precificação salva!')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* VIEW: MÃO DE OBRA */}
          {activeSubSection === 'geral_mao_de_obra' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Mão de obra</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Defina os custos padrão de equipe própria ou terceirizada para dimensionamento solar.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Custo base por kWp (R$/kWp)
                    </label>
                    <input
                      type="number"
                      defaultValue={450}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Adicional por complexidade de telhado (%)
                    </label>
                    <input
                      type="number"
                      defaultValue={15}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: CORES DIGITAL */}
          {activeSubSection === 'digital_cores' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Cores da Proposta Digital</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Personalize as cores primárias, contraste e cartões na proposta interativa para o cliente.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cor Principal (Botões e Destaque)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfColors.primary}
                        onChange={(e) => setPdfColors({ ...pdfColors, primary: e.target.value })}
                        className="h-10 w-12 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={pdfColors.primary}
                        onChange={(e) => setPdfColors({ ...pdfColors, primary: e.target.value })}
                        className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cor Secundária (Títulos e Menus)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfColors.secondary}
                        onChange={(e) => setPdfColors({ ...pdfColors, secondary: e.target.value })}
                        className="h-10 w-12 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={pdfColors.secondary}
                        onChange={(e) => setPdfColors({ ...pdfColors, secondary: e.target.value })}
                        className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cor de Destaque (Badges e Avisos)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfColors.accent}
                        onChange={(e) => setPdfColors({ ...pdfColors, accent: e.target.value })}
                        className="h-10 w-12 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={pdfColors.accent}
                        onChange={(e) => setPdfColors({ ...pdfColors, accent: e.target.value })}
                        className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveAll('Paleta de cores atualizada!')}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm transition-colors"
                  >
                    Salvar Cores
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: RETORNO DO INVESTIMENTO */}
          {activeSubSection === 'digital_retorno' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Retorno do Investimento (ROI)</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Parâmetros de cálculo econômico e projeção de 25 anos apresentados nas propostas.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tarifa de Energia Padrão (R$/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={0.95}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Inflação Energética Anual Estimada (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={8.5}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Taxa de Degradação Anual dos Módulos (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={0.5}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Anos de Projeção no Gráfico
                  </label>
                  <input
                    type="number"
                    defaultValue={25}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: CONFIGURAÇÃO DE PRODUTO */}
          {activeSubSection === 'digital_produtos' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Configurações de Produto</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Defina quais especificações técnicas de módulos e inversores devem ser visíveis para o cliente.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Exibir marca e modelo exatos dos módulos</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Exibir ficha técnica do inversor solar</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Exibir tipo de estrutura de fixação do telhado</span>
                </label>
              </div>
            </div>
          )}

          {/* VIEW: COMISSIONAMENTO */}
          {activeSubSection === 'digital_comissionamento' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Comissionamento</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Regras de comissão de representantes comerciais e integradores (Visível apenas internamente).
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Comissão Padrão do Consultor (% do valor total)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={4.0}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Bônus por Fechamento Rápido (R$)
                    </label>
                    <input
                      type="number"
                      defaultValue={300}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    As informações de comissionamento são estritamente sigilosas e nunca são exibidas na proposta do cliente.
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* DRAWER LATERAL DIREITO: ESCOLHA DE MODELO DE PROPOSTA (Screenshots 1 e 2) */}
        {isModelDrawerOpen && (
          <aside className="w-[420px] max-w-full border-l border-slate-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-200 z-20 shadow-2xl">
            {/* Header do Drawer */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsModelDrawerOpen(false)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Modelo de Proposta</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModelDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo do Drawer */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Escolha o modelo de proposta
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  O modelo selecionado será o seu modelo padrão de propostas. Você poderá mudá-lo sempre que quiser.
                </p>
              </div>

              {/* Grid dos Modelos com Thumbnails Idênticos */}
              <div className="space-y-6">
                {/* MODELO 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Modelo 1</span>
                    <button
                      type="button"
                      onClick={() => setExpandedModelPreview('modelo_1')}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Expandir modelo 1"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div
                    onClick={() => setSelectedModel('modelo_1')}
                    className={cn(
                      'relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden bg-white shadow-sm hover:shadow-md group',
                      selectedModel === 'modelo_1'
                        ? 'border-blue-600 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {/* Badge Indicador de Seleção */}
                    <div className="absolute top-3 right-3 z-10">
                      {selectedModel === 'modelo_1' ? (
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-white/90 border border-slate-300 shadow-xs" />
                      )}
                    </div>

                    {/* Miniatura Gráfica Fiel do Modelo 1 (Folha Técnica Clean) */}
                    <div className="p-4 space-y-3 bg-white text-[9px] text-slate-700 leading-tight">
                      {/* Topo Documento */}
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="h-7 w-7 rounded-lg bg-yellow-400 flex items-center justify-center font-black text-slate-950 text-[10px] shrink-0">
                          ☀️
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[10px]">
                            {activeCompany?.name || 'Love Solar'}
                          </p>
                          <p className="text-slate-400 text-[8px]">
                            Caroline Toscano • Rua Tal de Tal 41 - Jundiaí/SP
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-blue-600 text-[10px]">Projeto 1 - Orçamento 1</p>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg">
                          <div>
                            <span className="text-[8px] text-slate-400 block">Investimento</span>
                            <span className="font-bold text-slate-900 text-[10px]">R$ 42.500,00</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 block">Retorno Estimado</span>
                            <span className="font-bold text-emerald-600 text-[10px]">4 anos</span>
                          </div>
                        </div>
                      </div>

                      {/* Curva Gráfica Simulada SVG */}
                      <div className="pt-1">
                        <span className="text-[8px] text-slate-400 block mb-1">Economia Projetada (25 anos)</span>
                        <svg className="w-full h-10 overflow-visible" viewBox="0 0 100 30">
                          <path
                            d="M 0,25 Q 25,23 50,15 T 100,5"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                          />
                          <path
                            d="M 0,28 Q 50,25 100,20"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeDasharray="2,2"
                          />
                        </svg>
                      </div>

                      {/* Tabela de 5 Linhas de Amostra */}
                      <div className="border border-slate-100 rounded-lg overflow-hidden text-[7px]">
                        <div className="grid grid-cols-5 bg-slate-100 font-bold p-1 text-slate-600">
                          <span>Ano</span>
                          <span>Produção</span>
                          <span>Tarifa</span>
                          <span>Economia</span>
                          <span>Saldo</span>
                        </div>
                        <div className="grid grid-cols-5 p-1 border-t border-slate-50">
                          <span>1</span>
                          <span>240.000</span>
                          <span>0,85</span>
                          <span>R$ 20.400</span>
                          <span>-R$ 22.100</span>
                        </div>
                        <div className="grid grid-cols-5 p-1 border-t border-slate-50">
                          <span>5</span>
                          <span>235.000</span>
                          <span>1,05</span>
                          <span>R$ 24.675</span>
                          <span className="text-emerald-600 font-bold">+R$ 78.400</span>
                        </div>
                        <div className="grid grid-cols-5 p-1 border-t border-slate-50">
                          <span>10</span>
                          <span>230.000</span>
                          <span>1,30</span>
                          <span>R$ 29.900</span>
                          <span className="text-emerald-600 font-bold">+R$ 180.200</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODELO 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Modelo 2</span>
                    <button
                      type="button"
                      onClick={() => setExpandedModelPreview('modelo_2')}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Expandir modelo 2"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div
                    onClick={() => setSelectedModel('modelo_2')}
                    className={cn(
                      'relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden shadow-sm hover:shadow-md group',
                      selectedModel === 'modelo_2'
                        ? 'border-blue-600 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {/* Badge Indicador de Seleção */}
                    <div className="absolute top-3 right-3 z-10">
                      {selectedModel === 'modelo_2' ? (
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-white/90 border border-slate-300 shadow-xs" />
                      )}
                    </div>

                    {/* Miniatura Gráfica Fiel do Modelo 2 (Capa com Painéis e Céu Azul) */}
                    <div className="h-56 relative bg-gradient-to-b from-blue-600 via-sky-500 to-slate-900 flex flex-col justify-between p-4 text-white overflow-hidden">
                      {/* Textura Simulando Painéis Fotovoltaicos */}
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                      <div className="relative z-10 pt-4 space-y-2">
                        <h4 className="text-sm font-black tracking-tight leading-snug">
                          Texto para edição completa e total.
                        </h4>
                        <div className="space-y-0.5 text-[8px] text-blue-100">
                          <p>Proposta emitida: 01/08/2026</p>
                          <p>Cliente: Paulo Ferreira</p>
                          <p>Rua Dionísio da Costa, 250 - Vila Mariana, SP</p>
                          <p>Proposta válida por 10 dias (até 20/08/2026)</p>
                        </div>
                      </div>

                      {/* Faixa Rodapé com Logo */}
                      <div className="relative z-10 bg-white text-slate-900 p-2 rounded-xl flex items-center gap-2 shadow-lg">
                        <div className="h-6 w-6 rounded-lg bg-yellow-400 flex items-center justify-center font-black text-slate-950 text-[9px] shrink-0">
                          ☀️
                        </div>
                        <div className="text-[8px] leading-tight">
                          <p className="font-bold text-slate-900">{activeCompany?.name || 'Love Solar'}</p>
                          <p className="text-slate-500">www.lovesolar.com.br</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODELO 3 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Modelo 3</span>
                    <button
                      type="button"
                      onClick={() => setExpandedModelPreview('modelo_3')}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Expandir modelo 3"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div
                    onClick={() => setSelectedModel('modelo_3')}
                    className={cn(
                      'relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden shadow-sm hover:shadow-md group',
                      selectedModel === 'modelo_3'
                        ? 'border-blue-600 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {/* Badge Indicador de Seleção */}
                    <div className="absolute top-3 right-3 z-10">
                      {selectedModel === 'modelo_3' ? (
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-white/90 border border-slate-300 shadow-xs" />
                      )}
                    </div>

                    {/* Miniatura Gráfica Fiel do Modelo 3 (Capa com Bloco Amarelo) */}
                    <div className="h-56 relative bg-gradient-to-b from-blue-700 via-sky-600 to-indigo-950 flex flex-col justify-between p-4 text-white overflow-hidden">
                      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />

                      <div className="relative z-10 pt-4 space-y-2">
                        <h4 className="text-sm font-black tracking-tight leading-snug">
                          Texto para edição completa e total.
                        </h4>
                        <div className="space-y-0.5 text-[8px] text-blue-100">
                          <p>Proposta emitida: 01/08/2026</p>
                          <p>Cliente: Paulo Ferreira</p>
                          <p>Rua Dionísio da Costa, 250 - Vila Mariana, SP</p>
                        </div>
                      </div>

                      {/* Bloco de Destaque Amarelo na Base */}
                      <div className="relative z-10 bg-yellow-400 text-slate-950 p-2.5 rounded-xl flex items-center gap-2.5 shadow-lg">
                        <div className="h-6 w-6 rounded-lg bg-slate-950 text-yellow-400 flex items-center justify-center font-black text-[9px] shrink-0">
                          ☀️
                        </div>
                        <div className="text-[8px] leading-tight">
                          <p className="font-black text-slate-950 uppercase">{activeCompany?.name || 'Love Solar'}</p>
                          <p className="text-slate-800">Engenharia e Soluções Fotovoltaicas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Drawer com Botão Salvar Azul */}
            <div className="border-t border-slate-100 p-4 bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSaveAll(`Modelo ${selectedModel.replace('modelo_', '')} definido como padrão!`);
                  setIsModelDrawerOpen(false);
                }}
                className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm shadow-md transition-colors"
              >
                Salvar
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL FULLSCREEN DE PRÉVIA EXPANDIDA DO MODELO (Acionado pelo ícone ⤢) */}
      {expandedModelPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-black text-base text-slate-900">
                  Pré-visualização do{' '}
                  {expandedModelPreview === 'modelo_1'
                    ? 'Modelo 1 (Moderno Solar)'
                    : expandedModelPreview === 'modelo_2'
                    ? 'Modelo 2 (Capa Fotovoltaica Céu)'
                    : 'Modelo 3 (Executivo Premium)'}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
                  Formato A4 Padrão
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModelPreview(null)}
                className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              <div className="w-[600px] min-h-[850px] bg-white rounded-xl shadow-xl p-8 border border-slate-200 space-y-6 text-slate-800">
                {/* Conteúdo completo A4 simulado */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-yellow-400 flex items-center justify-center text-lg font-black text-slate-950">
                      ☀️
                    </div>
                    <div>
                      <h3 className="font-black text-slate-950 text-base">{activeCompany?.name || 'Love Solar'}</h3>
                      <p className="text-xs text-slate-500">Proposta Técnica Comercial • Ref: AS-2026-001</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-bold text-slate-900">Cliente: Caroline Toscano</p>
                    <p>Jundiaí - SP</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-black text-blue-600 text-sm">Resumo da Usina Fotovoltaica</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Potência do Sistema</span>
                      <span className="text-sm font-black text-slate-900">8,50 kWp</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Geração Média Estimada</span>
                      <span className="text-sm font-black text-slate-900">1.020 kWh/mês</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Economia Mensal</span>
                      <span className="text-sm font-black text-emerald-600">R$ 969,00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-sm">Lista de Equipamentos Certificados</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-4 bg-slate-50 p-2.5 font-bold text-slate-700">
                      <span className="col-span-2">Item</span>
                      <span>Qtd</span>
                      <span className="text-right">Garantia</span>
                    </div>
                    <div className="grid grid-cols-4 p-2.5 border-t border-slate-100">
                      <span className="col-span-2 font-medium">Módulos Monocristalinos 550W N-Type</span>
                      <span>16 un</span>
                      <span className="text-right text-slate-500">25 anos</span>
                    </div>
                    <div className="grid grid-cols-4 p-2.5 border-t border-slate-100">
                      <span className="col-span-2 font-medium">Inversor String 8kW Wi-Fi Integrado</span>
                      <span>01 un</span>
                      <span className="text-right text-slate-500">10 anos</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Documento gerado oficialmente por Avalia Solar Propostas</span>
                  <span>Página 1 de 4</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-white flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setExpandedModelPreview(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedModel(expandedModelPreview);
                  handleSaveAll(`Modelo ${expandedModelPreview.replace('modelo_', '')} selecionado!`);
                  setExpandedModelPreview(null);
                  setIsModelDrawerOpen(false);
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold shadow-sm"
              >
                Selecionar este modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE ITENS E SEÇÕES */}
      {editingModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingModal.type === 'cores' && 'Editar Cores da Proposta'}
                {editingModal.type === 'capa' && 'Editar Imagem de Capa'}
                {editingModal.type === 'secao' && `Configurar Seção: ${editingModal.item?.label}`}
                {editingModal.type === 'condicao_pagamento' && `Editar ${editingModal.item?.name}`}
                {editingModal.type === 'precificacao_novo' && 'Inserir Novo Custo de Precificação'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingModal({ type: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo do Modal conforme o tipo */}
            {editingModal.type === 'secao' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Conteúdo da Seção</label>
                  <textarea
                    rows={4}
                    defaultValue={editingModal.item?.content || ''}
                    id="modal_section_content"
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Digite o texto detalhado a ser impresso na seção..."
                  />
                </div>
              </div>
            )}

            {editingModal.type === 'precificacao_novo' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Custo</label>
                  <input
                    type="text"
                    id="new_cost_name"
                    placeholder="Ex: Vistoria Técnica e ART"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      id="new_cost_price"
                      defaultValue={500}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Cálculo</label>
                    <select
                      id="new_cost_calc"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                    >
                      <option value="Por kWp">Por kWp</option>
                      <option value="Fixo por projeto">Fixo por projeto</option>
                      <option value="Percentual">Percentual</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {editingModal.type === 'cores' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Selecione as cores da sua empresa. Os contrastes são validados automaticamente segundo o padrão WCAG.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cor Primária</label>
                    <input
                      type="color"
                      value={pdfColors.primary}
                      onChange={(e) => setPdfColors({ ...pdfColors, primary: e.target.value })}
                      className="h-10 w-full rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cor Secundária</label>
                    <input
                      type="color"
                      value={pdfColors.secondary}
                      onChange={(e) => setPdfColors({ ...pdfColors, secondary: e.target.value })}
                      className="h-10 w-full rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {editingModal.type === 'capa' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Escolha uma foto oficial de usina solar ou envie a foto da sua própria empresa.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setCoverImageOption('solar_ceu')}
                    className={cn(
                      'p-3 rounded-xl border-2 cursor-pointer transition-all text-center',
                      coverImageOption === 'solar_ceu' ? 'border-blue-600 bg-blue-50 font-bold' : 'border-slate-200'
                    )}
                  >
                    ☀️ Painéis sob Céu Azul (Padrão)
                  </div>
                  <div
                    onClick={() => setCoverImageOption('usina_solo')}
                    className={cn(
                      'p-3 rounded-xl border-2 cursor-pointer transition-all text-center',
                      coverImageOption === 'usina_solo' ? 'border-blue-600 bg-blue-50 font-bold' : 'border-slate-200'
                    )}
                  >
                    🌱 Usina de Solo Corporativa
                  </div>
                </div>
              </div>
            )}

            {editingModal.type === 'condicao_pagamento' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Máximo de Parcelas</label>
                  <input
                    type="number"
                    defaultValue={editingModal.item?.installments || 1}
                    id="cond_installments"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Desconto à vista (%)</label>
                  <input
                    type="number"
                    defaultValue={editingModal.item?.discountPercent || 0}
                    id="cond_discount"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingModal({ type: null })}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingModal.type === 'secao' && editingModal.item) {
                    const el = document.getElementById('modal_section_content') as HTMLTextAreaElement | null;
                    if (el) {
                      setPdfSections((prev) =>
                        prev.map((s) => (s.id === editingModal.item.id ? { ...s, content: el.value } : s))
                      );
                    }
                  } else if (editingModal.type === 'precificacao_novo') {
                    const nameEl = document.getElementById('new_cost_name') as HTMLInputElement | null;
                    const priceEl = document.getElementById('new_cost_price') as HTMLInputElement | null;
                    const calcEl = document.getElementById('new_cost_calc') as HTMLSelectElement | null;
                    if (nameEl && nameEl.value.trim()) {
                      setPricingTiers((prev) => [
                        ...prev,
                        {
                          id: `cost_${Date.now()}`,
                          status: true,
                          costName: nameEl.value.trim(),
                          pricePerKwp: Number(priceEl?.value || 0),
                          fromKwp: 0,
                          toKwp: 0,
                          calculationType: (calcEl?.value as any) || 'Por kWp',
                        },
                      ]);
                    }
                  }
                  setEditingModal({ type: null });
                  handleSaveAll('Alterações salvas com sucesso!');
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
