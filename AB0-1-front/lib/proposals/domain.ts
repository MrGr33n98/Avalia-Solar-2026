export type ProposalStatusKey =
  | 'all'
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'under_review'
  | 'negotiating'
  | 'meeting_scheduled'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'expired'
  | 'not_selected'
  | 'closed_after_selection';

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  viewed: 'Visualizada',
  under_review: 'Em análise',
  negotiating: 'Em negociação',
  meeting_scheduled: 'Reunião agendada',
  accepted: 'Aprovada',
  declined: 'Recusada',
  withdrawn: 'Retirada',
  expired: 'Expirada',
  not_selected: 'Não selecionada',
  closed_after_selection: 'Encerrada',
};

export const PROPOSAL_STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  sent: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  viewed: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  under_review: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  negotiating: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  meeting_scheduled: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  accepted: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  declined: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  withdrawn: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  expired: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  not_selected: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  closed_after_selection: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export function getStatusInfo(status: string) {
  const label = PROPOSAL_STATUS_LABELS[status] || status;
  const colors = PROPOSAL_STATUS_COLORS[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };
  return { label, ...colors };
}

export function formatBrlCurrency(cents?: number | null, allowUninformed = true): string {
  if (cents === null || cents === undefined || (cents === 0 && allowUninformed)) {
    return 'Não informado';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function parseBrlToCents(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value);
  }
  if (!value) return 0;
  const trimmed = String(value).trim();
  if (!trimmed) return 0;

  const cleaned = trimmed.replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;

  let normalized = cleaned;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    if (/\.\d{2}$/.test(cleaned)) {
      normalized = cleaned;
    } else {
      normalized = cleaned.replace(/\./g, '');
    }
  }

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
}

export type ProductVertical = 'solar' | 'ev_mobility' | 'maintenance' | 'other';

export function normalizeVertical(vertical?: string | null): ProductVertical {
  if (!vertical) return 'solar';
  const lower = vertical.toLowerCase();
  if (lower.includes('mobilidade') || lower.includes('carregador') || lower.includes('eletric') || lower.includes('veículo')) {
    return 'ev_mobility';
  }
  if (lower.includes('manutenção') || lower.includes('o&m') || lower.includes('limpeza')) {
    return 'maintenance';
  }
  if (lower.includes('solar') || lower.includes('fotovoltaic')) {
    return 'solar';
  }
  return 'other';
}

export interface TechnicalFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  suffix?: string;
  type?: 'text' | 'number' | 'select';
  options?: { label: string; value: string }[];
}

export const TECHNICAL_FIELDS_BY_VERTICAL: Record<ProductVertical, TechnicalFieldDef[]> = {
  ev_mobility: [
    {
      key: 'system_power',
      label: 'Potência instalada',
      placeholder: 'Ex.: 7,4',
      suffix: 'kW',
    },
    {
      key: 'charger_type',
      label: 'Tipo de carregador',
      type: 'select',
      options: [
        { label: 'Wallbox inteligente', value: 'Wallbox inteligente' },
        { label: 'Wallbox básico', value: 'Wallbox básico' },
        { label: 'Carregador portátil', value: 'Carregador portátil' },
        { label: 'Totem duplo comercial', value: 'Totem duplo comercial' },
        { label: 'Carregador rápido DC', value: 'Carregador rápido DC' },
      ],
    },
    {
      key: 'points_count',
      label: 'Número de pontos',
      placeholder: 'Ex.: 1',
      suffix: 'unidades',
    },
    {
      key: 'installation_type',
      label: 'Tipo de instalação',
      type: 'select',
      options: [
        { label: 'Residencial unifamiliar', value: 'Residencial' },
        { label: 'Condomínio predial', value: 'Condomínio predial' },
        { label: 'Comercial / Empresa', value: 'Comercial' },
        { label: 'Estacionamento público / semi-público', value: 'Estacionamento' },
      ],
    },
    {
      key: 'installation_deadline',
      label: 'Prazo de instalação',
      placeholder: 'Ex.: 15 dias',
    },
  ],
  solar: [
    {
      key: 'system_power',
      label: 'Potência instalada',
      placeholder: 'Ex.: 8,5',
      suffix: 'kWp',
    },
    {
      key: 'monthly_generation',
      label: 'Geração mensal estimada',
      placeholder: 'Ex.: 950',
      suffix: 'kWh/mês',
    },
    {
      key: 'system_type',
      label: 'Tipo de sistema',
      type: 'select',
      options: [
        { label: 'Conectado à rede (On-Grid)', value: 'On-Grid' },
        { label: 'Híbrido com baterias', value: 'Híbrido com baterias' },
        { label: 'Isolado com baterias (Off-Grid)', value: 'Off-Grid' },
        { label: 'Zero Grid', value: 'Zero Grid' },
      ],
    },
    {
      key: 'monthly_savings',
      label: 'Economia mensal estimada',
      placeholder: 'Ex.: 850,00',
      suffix: 'R$/mês',
    },
    {
      key: 'warranty',
      label: 'Garantia',
      placeholder: 'Ex.: 25 anos módulos, 10 anos inversor',
    },
    {
      key: 'installation_deadline',
      label: 'Prazo de instalação',
      placeholder: 'Ex.: 30 dias',
    },
  ],
  maintenance: [
    {
      key: 'system_served',
      label: 'Sistema atendido',
      placeholder: 'Ex.: Usina solar 50 kWp',
    },
    {
      key: 'periodicity',
      label: 'Periodicidade do serviço',
      type: 'select',
      options: [
        { label: 'Pontual / Avulsa', value: 'Pontual' },
        { label: 'Mensal', value: 'Mensal' },
        { label: 'Trimestral', value: 'Trimestral' },
        { label: 'Semestral', value: 'Semestral' },
        { label: 'Anual', value: 'Anual' },
      ],
    },
    {
      key: 'sla_deadline',
      label: 'SLA de atendimento',
      placeholder: 'Ex.: Até 24 horas',
    },
    {
      key: 'warranty',
      label: 'Garantia do serviço',
      placeholder: 'Ex.: 90 dias',
    },
  ],
  other: [
    {
      key: 'technical_scope',
      label: 'Escopo técnico principal',
      placeholder: 'Descreva a especificação técnica do serviço',
    },
    {
      key: 'installation_deadline',
      label: 'Prazo de execução',
      placeholder: 'Ex.: 20 dias',
    },
    {
      key: 'warranty',
      label: 'Garantia',
      placeholder: 'Ex.: 1 ano',
    },
  ],
};

export type ProposalGroupedFilter =
  | 'all'
  | 'draft'
  | 'sent_or_review'
  | 'negotiating'
  | 'accepted'
  | 'closed';

export const PROPOSAL_GROUPED_STATUS_MAP: Record<ProposalGroupedFilter, string[]> = {
  all: [],
  draft: ['draft'],
  sent_or_review: ['sent', 'viewed', 'under_review'],
  negotiating: ['negotiating', 'meeting_scheduled'],
  accepted: ['accepted'],
  closed: ['declined', 'withdrawn', 'expired', 'not_selected', 'closed_after_selection'],
};

export const PROPOSAL_GROUPED_TABS: Array<{ value: ProposalGroupedFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'sent_or_review', label: 'Enviadas' },
  { value: 'negotiating', label: 'Em negociação' },
  { value: 'accepted', label: 'Aprovadas' },
  { value: 'closed', label: 'Encerradas' },
];

export function matchesGroupedFilter(status: string | undefined, filter: ProposalGroupedFilter): boolean {
  if (filter === 'all' || !status) return true;
  const targetStatuses = PROPOSAL_GROUPED_STATUS_MAP[filter];
  return targetStatuses ? targetStatuses.includes(status) : true;
}

// ============================================================================
// PROPOSAL STUDIO ENTERPRISE A+++ (8-TAB JOURNEY & BUILDERS)
// ============================================================================

export type ProposalStudioTabId =
  | 'resumo'
  | 'itens'
  | 'formulario'
  | 'template_pdf'
  | 'digital'
  | 'comercial'
  | 'docs'
  | 'historico';

export type ProposalPdfTemplateId =
  | 'moderno'
  | 'classico'
  | 'clean'
  | 'premium'
  | 'institucional';

export interface ProposalPdfTemplateDefinition {
  id: ProposalPdfTemplateId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  recommendedFor: string;
  defaultColor: string;
}

export const ORIGINAL_PDF_TEMPLATES: ProposalPdfTemplateDefinition[] = [
  {
    id: 'moderno',
    name: 'Moderno Solar',
    tagline: 'Visual assimétrico com ênfase em dados técnicos e sustentabilidade',
    description: 'Header dinâmico com logotipo em destaque, blocos em cartões suaves e gráficos limpos de consumo e geração.',
    badge: 'Mais Utilizado',
    recommendedFor: 'Propostas residenciais e comerciais de alta conversão',
    defaultColor: '#0066FF',
  },
  {
    id: 'classico',
    name: 'Corporativo Clássico',
    tagline: 'Estrutura formal e sóbria com tipografia refinada',
    description: 'Bordas finas, numeração de páginas executiva, divisão clara de responsabilidades e tabela de itens detalhada.',
    badge: 'Institucional B2B',
    recommendedFor: 'Projetos industriais, condomínios e licitações',
    defaultColor: '#0F172A',
  },
  {
    id: 'clean',
    name: 'Clean Minimalista',
    tagline: 'Design suíço focado em leitura rápida e síntese executiva',
    description: 'Máximo espaço em branco, tipografia nítida, sem ruídos decorativos, perfeito para impressão preto e branco ou colorida.',
    badge: 'Alta Legibilidade',
    recommendedFor: 'Clientes que priorizam objetividade e retorno financeiro',
    defaultColor: '#475569',
  },
  {
    id: 'premium',
    name: 'Executivo Premium',
    tagline: 'Apresentação nobre com destaque para economia e payback',
    description: 'Destaque visual para o investimento inicial, simulação de economia anual e selos de garantia dos equipamentos.',
    badge: 'Alto Padrão',
    recommendedFor: 'Projetos solares de grande porte e clientes premium',
    defaultColor: '#0284C7',
  },
  {
    id: 'institucional',
    name: 'Credenciais & Engenharia',
    tagline: 'Foco na segurança técnica, certificações e histórico da empresa',
    description: 'Seções ampliadas para "Sobre a empresa", portfólio de obras reais e qualificações da equipe de instalação.',
    badge: 'Diferenciação',
    recommendedFor: 'Empresas consolidadas com forte portfólio regional',
    defaultColor: '#2563EB',
  },
];

export interface ProposalFormFieldConfig {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'select' | 'boolean';
  category: 'cliente' | 'imovel' | 'consumo' | 'tecnico' | 'personalizado';
  enabled: boolean;
  required: boolean;
  helperText?: string;
  options?: string[];
}

export const DEFAULT_PROPOSAL_FORM_FIELDS: ProposalFormFieldConfig[] = [
  {
    id: 'f1',
    key: 'customer_name',
    label: 'Nome completo do comprador',
    type: 'text',
    category: 'cliente',
    enabled: true,
    required: true,
    helperText: 'Nome do titular da conta de energia ou contratante',
  },
  {
    id: 'f2',
    key: 'customer_contact',
    label: 'Telefone / WhatsApp e E-mail',
    type: 'text',
    category: 'cliente',
    enabled: true,
    required: true,
    helperText: 'Meios de contato oficiais para acompanhamento',
  },
  {
    id: 'f3',
    key: 'installation_address',
    label: 'Endereço da instalação (com CEP e Cidade/UF)',
    type: 'text',
    category: 'imovel',
    enabled: true,
    required: true,
    helperText: 'Local físico onde a usina fotovoltaica será implantada',
  },
  {
    id: 'f4',
    key: 'energy_consumption',
    label: 'Consumo médio mensal (kWh/mês)',
    type: 'number',
    category: 'consumo',
    enabled: true,
    required: true,
    helperText: 'Base de cálculo para o dimensionamento da geração',
  },
  {
    id: 'f5',
    key: 'roof_structure',
    label: 'Tipo de telhado / estrutura de fixação',
    type: 'select',
    category: 'tecnico',
    enabled: true,
    required: false,
    options: ['Telhado Cerâmico / Colonial', 'Telha Metálica / Fibrocimento', 'Laje de Concreto', 'Solo', 'Carport (Estacionamento)'],
    helperText: 'Define o tipo de fixação mecânica dos painéis',
  },
  {
    id: 'f6',
    key: 'local_photos',
    label: 'Fotos do local e padrão de entrada',
    type: 'boolean',
    category: 'tecnico',
    enabled: true,
    required: false,
    helperText: 'Solicita imagens da fachada, quadro de distribuição e telhado',
  },
  {
    id: 'f7',
    key: 'special_notes',
    label: 'Observações e particularidades técnicas',
    type: 'text',
    category: 'tecnico',
    enabled: true,
    required: false,
    helperText: 'Informações adicionais do cliente ou do vistoriador',
  },
];

export interface ProposalStudioState {
  // Template PDF
  templateId: ProposalPdfTemplateId;
  mainColor: string;
  coverImageUrl: string;
  showCover: boolean;
  sectionAboutCompany: boolean;
  sectionAboutCompanyContent: string;
  sectionProjectImages: boolean;
  sectionTitle: boolean;
  sectionWarranties: boolean;
  sectionWarrantiesContent: string;
  sectionTerms: boolean;
  sectionTermsContent: string;
  sectionSchedule: boolean;
  sectionScheduleContent: string;

  // Formulário
  formFields: ProposalFormFieldConfig[];

  // Proposta Digital
  digitalHeroBanner: boolean;
  digitalDisplayRoi: boolean;
  digitalProductConfigDetailed: boolean;

  // Condições Comerciais
  validityDate: string;
  paymentCondition: string;
  discountCents: number;
  commercialNotes: string;
  displayConditionsOnDoc: boolean;
}

export const DEFAULT_PROPOSAL_STUDIO_STATE: ProposalStudioState = {
  templateId: 'moderno',
  mainColor: '#0066FF',
  coverImageUrl: '',
  showCover: true,
  sectionAboutCompany: true,
  sectionAboutCompanyContent: 'Integrador solar especializado com equipe técnica certificada e mais de 10 anos de experiência.',
  sectionProjectImages: true,
  sectionTitle: true,
  sectionWarranties: true,
  sectionWarrantiesContent: 'Garantia de 25 anos na geração dos módulos fotovoltaicos, 10 anos nos inversores e 1 ano no serviço de instalação.',
  sectionTerms: true,
  sectionTermsContent: 'Valores sujeitos a vistoria técnica no local. Conexão à rede sujeita aos prazos e exigências da distribuidora local.',
  sectionSchedule: true,
  sectionScheduleContent: '1. Vistoria técnica (5 dias) · 2. Homologação (15 dias) · 3. Instalação física (3 dias) · 4. Vistoria da concessionária e troca do medidor (10 dias).',

  formFields: DEFAULT_PROPOSAL_FORM_FIELDS,

  digitalHeroBanner: true,
  digitalDisplayRoi: true,
  digitalProductConfigDetailed: true,

  validityDate: '',
  paymentCondition: 'À vista (Pix / TED) ou Financiamento Solar até 84x',
  discountCents: 0,
  commercialNotes: 'Preço final inclui equipamentos, projeto de engenharia, ART, montagem e homologação completa na concessionária.',
  displayConditionsOnDoc: true,
};

// Helper: Extrair estado do Proposal Studio a partir dos terms da versão
export function parseProposalStudioState(
  terms?: Array<{ key: string; label: string; value: string }>
): ProposalStudioState {
  if (!terms || terms.length === 0) {
    return { ...DEFAULT_PROPOSAL_STUDIO_STATE };
  }

  const map = new Map(terms.map((t) => [t.key, t.value]));

  const getBool = (key: string, fallback: boolean): boolean => {
    const val = map.get(key);
    if (val === undefined) return fallback;
    return val === 'true' || val === '1';
  };

  const templateId = (map.get('studio_template_id') || 'moderno') as ProposalPdfTemplateId;

  let formFields = DEFAULT_PROPOSAL_FORM_FIELDS;
  const rawFields = map.get('studio_form_fields');
  if (rawFields) {
    try {
      const parsed = JSON.parse(rawFields);
      if (Array.isArray(parsed) && parsed.length > 0) {
        formFields = parsed;
      }
    } catch {
      // Ignora erro de parse
    }
  }

  return {
    templateId,
    mainColor: map.get('studio_main_color') || DEFAULT_PROPOSAL_STUDIO_STATE.mainColor,
    coverImageUrl: map.get('studio_cover_image_url') || '',
    showCover: getBool('studio_show_cover', true),
    sectionAboutCompany: getBool('studio_section_about_company', true),
    sectionAboutCompanyContent: map.get('studio_about_company_content') || DEFAULT_PROPOSAL_STUDIO_STATE.sectionAboutCompanyContent,
    sectionProjectImages: getBool('studio_section_project_images', true),
    sectionTitle: getBool('studio_section_title', true),
    sectionWarranties: getBool('studio_section_warranties', true),
    sectionWarrantiesContent: map.get('studio_warranties_content') || DEFAULT_PROPOSAL_STUDIO_STATE.sectionWarrantiesContent,
    sectionTerms: getBool('studio_section_terms', true),
    sectionTermsContent: map.get('studio_terms_content') || DEFAULT_PROPOSAL_STUDIO_STATE.sectionTermsContent,
    sectionSchedule: getBool('studio_section_schedule', true),
    sectionScheduleContent: map.get('studio_schedule_content') || DEFAULT_PROPOSAL_STUDIO_STATE.sectionScheduleContent,

    formFields,

    digitalHeroBanner: getBool('studio_digital_hero', true),
    digitalDisplayRoi: getBool('studio_digital_roi', true),
    digitalProductConfigDetailed: getBool('studio_digital_details', true),

    validityDate: map.get('validity') || map.get('studio_validity_date') || '',
    paymentCondition: map.get('payment_conditions') || map.get('payment') || DEFAULT_PROPOSAL_STUDIO_STATE.paymentCondition,
    discountCents: parseInt(map.get('studio_discount_cents') || '0', 10),
    commercialNotes: map.get('studio_commercial_notes') || DEFAULT_PROPOSAL_STUDIO_STATE.commercialNotes,
    displayConditionsOnDoc: getBool('studio_display_conditions', true),
  };
}

// Helper: Converter o estado do Proposal Studio de volta para terms do backend
export function serializeProposalStudioToTerms(
  state: ProposalStudioState,
  existingTerms?: Array<{ id?: number; key: string; label: string; value: string; position?: number }>
): Array<{ key: string; label: string; value: string; position: number }> {
  const result: Array<{ key: string; label: string; value: string; position: number }> = [];

  // Mapeamento dos campos do Studio
  const studioEntries: Array<[string, string, string]> = [
    ['studio_template_id', 'Modelo PDF', state.templateId],
    ['studio_main_color', 'Cor Principal da Marca', state.mainColor],
    ['studio_cover_image_url', 'URL da Capa', state.coverImageUrl],
    ['studio_show_cover', 'Exibir Capa', String(state.showCover)],
    ['studio_section_about_company', 'Seção Sobre a Empresa', String(state.sectionAboutCompany)],
    ['studio_about_company_content', 'Conteúdo Sobre a Empresa', state.sectionAboutCompanyContent],
    ['studio_section_project_images', 'Seção Imagens de Obras', String(state.sectionProjectImages)],
    ['studio_section_title', 'Seção Título', String(state.sectionTitle)],
    ['studio_section_warranties', 'Seção Garantias', String(state.sectionWarranties)],
    ['studio_warranties_content', 'Conteúdo das Garantias', state.sectionWarrantiesContent],
    ['studio_section_terms', 'Seção Termos e Condições', String(state.sectionTerms)],
    ['studio_terms_content', 'Conteúdo dos Termos', state.sectionTermsContent],
    ['studio_section_schedule', 'Seção Cronograma', String(state.sectionSchedule)],
    ['studio_schedule_content', 'Conteúdo do Cronograma', state.sectionScheduleContent],
    ['studio_form_fields', 'Configuração de Campos do Formulário', JSON.stringify(state.formFields)],
    ['studio_digital_hero', 'Proposta Digital - Hero Banner', String(state.digitalHeroBanner)],
    ['studio_digital_roi', 'Proposta Digital - Exibir ROI', String(state.digitalDisplayRoi)],
    ['studio_digital_details', 'Proposta Digital - Detalhes Técnicos', String(state.digitalProductConfigDetailed)],
    ['studio_validity_date', 'Data de Validade Comercial', state.validityDate],
    ['payment_conditions', 'Condições de Pagamento', state.paymentCondition],
    ['studio_discount_cents', 'Desconto Comercial em Centavos', String(state.discountCents)],
    ['studio_commercial_notes', 'Notas Comerciais', state.commercialNotes],
    ['studio_display_conditions', 'Exibir Condições no Documento', String(state.displayConditionsOnDoc)],
  ];

  // Preserva termos que não são controlados pelo Studio (ex.: prazos legados)
  const studioKeys = new Set(studioEntries.map(([k]) => k));
  if (existingTerms) {
    existingTerms.forEach((term) => {
      if (!studioKeys.has(term.key) && term.value) {
        result.push({
          key: term.key,
          label: term.label,
          value: term.value,
          position: result.length,
        });
      }
    });
  }

  // Adiciona as chaves do studio
  studioEntries.forEach(([key, label, value]) => {
    if (value !== undefined && value !== null) {
      result.push({
        key,
        label,
        value: String(value),
        position: result.length,
      });
    }
  });

  return result;
}

