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
  const clean = value.replace(/[^\d,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
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
