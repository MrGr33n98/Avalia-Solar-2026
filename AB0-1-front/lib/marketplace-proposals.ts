import type { MarketplaceProposal, MarketplaceProposalProject } from '@/lib/api';

export const proposalStatuses: Record<string, string> = {
  draft: 'Em preparação',
  sent: 'Recebida',
  viewed: 'Visualizada',
  under_review: 'Em análise',
  negotiating: 'Em negociação',
  meeting_scheduled: 'Reunião solicitada',
  accepted: 'Escolhida',
  declined: 'Recusada',
  not_selected: 'Não escolhida',
  closed_after_selection: 'Encerrada',
  withdrawn: 'Retirada',
  expired: 'Expirada',
};

export const actionableStatuses = [
  'sent',
  'viewed',
  'under_review',
  'negotiating',
  'meeting_scheduled',
];

export function isProjectComplete(project?: MarketplaceProposalProject | null) {
  return project?.status === 'completed';
}

export function canDecide(proposal: MarketplaceProposal) {
  const expiry = proposal.expires_at || proposal.version?.valid_until;
  // Datas sem horário são válidas até o fim do dia local.
  const expiresAt = expiry && new Date(expiry.length === 10 ? `${expiry}T23:59:59` : expiry);
  return (
    !proposal.revision_pending &&
    !!proposal.version &&
    actionableStatuses.includes(proposal.status) &&
    (!expiresAt || expiresAt.getTime() > Date.now())
  );
}

export function proposalStatus(proposal: MarketplaceProposal) {
  if (isProjectComplete(proposal.project)) return 'Projeto concluído';
  if (proposal.revision_pending) return 'Em atualização';
  if (proposal.status === 'accepted')
    return proposal.project?.status === 'cancelled' ? 'Projeto cancelado' : 'Em andamento';
  if (proposal.version && actionableStatuses.includes(proposal.status) && !canDecide(proposal))
    return 'Expirada';
  return proposalStatuses[proposal.status] || 'Status não informado';
}

export function formatMoney(cents?: number | null, currency = 'BRL') {
  if (cents == null) return 'Não informado';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return 'Não informado';
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
  }).format(parsed);
}

export function proposalChatUrl(proposal: MarketplaceProposal) {
  return `/review-dashboard/proposals?proposal=${proposal.id}&view=conversation`;
}

export const technicalFields = [
  {
    label: 'Potência instalada',
    keys: ['system_power', 'power_kwp', 'installed_power', 'potencia'],
  },
  {
    label: 'Geração estimada',
    keys: ['monthly_generation', 'generation_kwh', 'estimated_generation', 'geracao'],
  },
  { label: 'Tipo de sistema', keys: ['system_type', 'tipo_sistema'] },
  { label: 'Economia estimada', keys: ['monthly_savings', 'estimated_savings', 'economia'] },
  { label: 'Garantia', keys: ['warranty', 'garantia'] },
  { label: 'Prazo de instalação', keys: ['installation_deadline', 'installation_time', 'prazo'] },
  { label: 'Condições de pagamento', keys: ['payment', 'payment_terms', 'pagamento'] },
];

export function termValue(proposal: MarketplaceProposal, keys: string[]) {
  return proposal.version?.terms.find((term) => keys.includes(term.key))?.value || 'Não informado';
}

export function getProposalRawTerm(proposal: MarketplaceProposal, keys: string[]): string | null {
  const match = proposal.version?.terms.find((term) => keys.includes(term.key));
  return match && match.value ? match.value : null;
}

export function getProposalLocation(proposal: MarketplaceProposal): string {
  const companyLoc = [proposal.company.city, proposal.company.state].filter(Boolean).join(', ');
  if (companyLoc) return companyLoc;
  const reqLoc = [proposal.request?.city, proposal.request?.state].filter(Boolean).join(', ');
  if (reqLoc) return reqLoc;
  return 'Não informado';
}

export function getProposalDisplayPrice(proposal: MarketplaceProposal) {
  if (proposal.version?.total_cents != null && proposal.version.total_cents > 0) {
    return {
      formatted: formatMoney(proposal.version.total_cents, proposal.version.currency),
      rawCents: proposal.version.total_cents,
      isAvailable: true,
    };
  }
  if (proposal.total_cents != null && proposal.total_cents > 0) {
    return {
      formatted: formatMoney(proposal.total_cents, proposal.currency),
      rawCents: proposal.total_cents,
      isAvailable: true,
    };
  }
  return {
    formatted: 'Aguardando empresa',
    rawCents: null,
    isAvailable: false,
  };
}

export function getProposalStatusTone(proposal: MarketplaceProposal): {
  badgeTone: string;
  dotTone: string;
} {
  if (isProjectComplete(proposal.project)) {
    return { badgeTone: 'bg-emerald-50 text-emerald-800 border-emerald-200', dotTone: 'bg-emerald-500' };
  }
  if (proposal.status === 'accepted') {
    return { badgeTone: 'bg-blue-50 text-blue-800 border-blue-200', dotTone: 'bg-blue-500' };
  }
  if (proposal.status === 'sent') {
    return { badgeTone: 'bg-emerald-50 text-emerald-800 border-emerald-200', dotTone: 'bg-emerald-500' };
  }
  if (proposal.status === 'viewed') {
    return { badgeTone: 'bg-violet-50 text-violet-800 border-violet-200', dotTone: 'bg-violet-500' };
  }
  if (proposal.status === 'negotiating' || proposal.status === 'meeting_scheduled') {
    return { badgeTone: 'bg-amber-50 text-amber-800 border-amber-200', dotTone: 'bg-amber-500' };
  }
  if (proposal.status === 'declined' || proposal.status === 'withdrawn') {
    return { badgeTone: 'bg-rose-50 text-rose-800 border-rose-200', dotTone: 'bg-rose-500' };
  }
  return { badgeTone: 'bg-slate-100 text-slate-700 border-slate-200', dotTone: 'bg-slate-400' };
}

export interface ProposalCardMetric {
  key: string;
  label: string;
  value: string;
}

export function getProposalCardMetrics(proposal: MarketplaceProposal): ProposalCardMetric[] {
  const metrics: ProposalCardMetric[] = [];

  const power = getProposalRawTerm(proposal, ['system_power', 'power_kwp', 'installed_power', 'potencia']);
  if (power) metrics.push({ key: 'power', label: 'Potência', value: power });

  const gen = getProposalRawTerm(proposal, ['monthly_generation', 'generation_kwh', 'estimated_generation', 'geracao']);
  if (gen) metrics.push({ key: 'generation', label: 'Geração estimada', value: gen });

  const deadline = getProposalRawTerm(proposal, ['installation_deadline', 'installation_time', 'prazo']);
  if (deadline) metrics.push({ key: 'deadline', label: 'Prazo', value: deadline });

  const warranty = getProposalRawTerm(proposal, ['warranty', 'garantia']);
  if (warranty && metrics.length < 3) metrics.push({ key: 'warranty', label: 'Garantia', value: warranty });

  return metrics.slice(0, 3);
}


export const projectProfileLabels: Record<string, string> = {
  residential: 'Sistema residencial',
  commercial: 'Soluções comerciais',
  industrial: 'Soluções industriais',
  rural: 'Soluções rurais',
};

/** Rótulo i18n do perfil do projeto; retorna null quando não informado ou desconhecido. */
export function getProposalSolutionLabel(proposal: MarketplaceProposal): string | null {
  const profile = proposal.request?.project_profile;
  return (profile && projectProfileLabels[profile]) || null;
}

/** Data relativa em pt-BR (Hoje, Ontem, dd/mm/aaaa). */
export function formatRelativeDay(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  return formatDate(value);
}

export function hasPublishedVersion(proposal: MarketplaceProposal) {
  return Boolean(proposal.version);
}

export const closedStatuses = [
  'declined',
  'not_selected',
  'closed_after_selection',
  'withdrawn',
  'expired',
  'cancelled',
];

export function isProposalActive(proposal: MarketplaceProposal) {
  return !closedStatuses.includes(proposal.status) && !isProjectComplete(proposal.project);
}

export function isProposalReceived(proposal: MarketplaceProposal) {
  return hasPublishedVersion(proposal) && isProposalActive(proposal);
}

/** Proposta ainda sem versão publicada pela empresa. */
export function isProposalAwaiting(proposal: MarketplaceProposal) {
  return !hasPublishedVersion(proposal) && isProposalActive(proposal);
}

export function isProposalCompleted(proposal: MarketplaceProposal) {
  return proposal.status === 'completed' || isProjectComplete(proposal.project);
}
