import type { MarketplaceProposal, MarketplaceProposalProject } from '@/lib/api';

export const proposalStatuses: Record<string, string> = {
  draft: 'Em preparação', sent: 'Recebida', viewed: 'Visualizada', under_review: 'Em análise',
  negotiating: 'Em negociação', meeting_scheduled: 'Reunião solicitada', accepted: 'Escolhida',
  declined: 'Recusada', not_selected: 'Não escolhida', closed_after_selection: 'Encerrada',
  withdrawn: 'Retirada', expired: 'Expirada',
};

export const actionableStatuses = ['sent', 'viewed', 'under_review', 'negotiating', 'meeting_scheduled'];

export function isProjectComplete(project?: MarketplaceProposalProject | null) {
  return project?.status === 'completed';
}

export function canDecide(proposal: MarketplaceProposal) {
  const expiry = proposal.expires_at || proposal.version?.valid_until;
  // Datas sem horário são válidas até o fim do dia local.
  const expiresAt = expiry && new Date(expiry.length === 10 ? `${expiry}T23:59:59` : expiry);
  return actionableStatuses.includes(proposal.status) && (!expiresAt || expiresAt.getTime() > Date.now());
}

export function proposalStatus(proposal: MarketplaceProposal) {
  if (isProjectComplete(proposal.project)) return 'Projeto concluído';
  if (proposal.status === 'accepted') return proposal.project?.status === 'cancelled' ? 'Projeto cancelado' : 'Em andamento';
  if (actionableStatuses.includes(proposal.status) && !canDecide(proposal)) return 'Expirada';
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
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', ...(withTime ? { timeStyle: 'short' as const } : {}) }).format(parsed);
}

export function proposalChatUrl(proposal: MarketplaceProposal) {
  return `/chat?company_id=${proposal.company.id}&marketplace_proposal_id=${proposal.id}`;
}

export const technicalFields = [
  { label: 'Potência instalada', keys: ['system_power', 'power_kwp', 'installed_power', 'potencia'] },
  { label: 'Geração estimada', keys: ['monthly_generation', 'generation_kwh', 'estimated_generation', 'geracao'] },
  { label: 'Tipo de sistema', keys: ['system_type', 'tipo_sistema'] },
  { label: 'Economia estimada', keys: ['monthly_savings', 'estimated_savings', 'economia'] },
  { label: 'Garantia', keys: ['warranty', 'garantia'] },
  { label: 'Prazo de instalação', keys: ['installation_deadline', 'installation_time', 'prazo'] },
  { label: 'Condições de pagamento', keys: ['payment', 'payment_terms', 'pagamento'] },
];

export function termValue(proposal: MarketplaceProposal, keys: string[]) {
  return proposal.version?.terms.find((term) => keys.includes(term.key))?.value || 'Não informado';
}
