import type { MarketplaceProposal, MarketplaceProposalProject } from '@/lib/api';
import { canDecide, isProjectComplete } from '@/lib/marketplace-proposals';

export type Screen =
  | 'summary'
  | 'complete'
  | 'compare'
  | 'conversation'
  | 'meeting'
  | 'negotiation'
  | 'choose'
  | 'project'
  | 'completed'
  | 'review';

export type ProposalJourneyStageId = 1 | 2 | 3 | 4 | 5;

export interface JourneyStageConfig {
  id: ProposalJourneyStageId;
  label: string;
  shortLabel: string;
  description: string;
  defaultView?: Screen;
  isOptional?: boolean;
}

export const JOURNEY_STAGES: readonly JourneyStageConfig[] = [
  {
    id: 1,
    label: 'Minhas propostas',
    shortLabel: 'Propostas',
    description: 'Lista de propostas e solicitações recebidas',
  },
  {
    id: 2,
    label: 'Analisar',
    shortLabel: 'Analisar',
    description: 'Resumo, proposta técnica detalhada e comparação',
    defaultView: 'summary',
  },
  {
    id: 3,
    label: 'Conversar',
    shortLabel: 'Conversar',
    description: 'Conversa com o instalador, reuniões e negociação',
    defaultView: 'conversation',
    isOptional: true,
  },
  {
    id: 4,
    label: 'Decidir',
    shortLabel: 'Decidir',
    description: 'Confirmar escolha da proposta ou solicitar ajustes',
    defaultView: 'choose',
  },
  {
    id: 5,
    label: 'Acompanhar',
    shortLabel: 'Acompanhar',
    description: 'Marcos de execução do projeto e avaliação',
    defaultView: 'project',
  },
] as const;

/**
 * Mapeamento canônico e retrocompatível de visualizações antigas (view= / Screen) para os 5 estágios.
 */
export const SCREEN_TO_STAGE: Record<Screen, ProposalJourneyStageId> = {
  summary: 2,
  complete: 2,
  compare: 2,
  conversation: 3,
  meeting: 3,
  negotiation: 3,
  choose: 4,
  project: 5,
  completed: 5,
  review: 5,
};

/**
 * Retorna o estágio da jornada com base no contexto atual (proposta e tela visualizada).
 */
export function getActiveJourneyStage(
  proposal: MarketplaceProposal | undefined,
  screen: Screen
): ProposalJourneyStageId {
  if (screen === 'compare') return 2;
  if (!proposal) return 1;

  if (screen === 'review' || screen === 'completed' || isProjectComplete(proposal.project)) {
    return 5;
  }
  if (screen === 'project' || proposal.status === 'accepted') {
    return 5;
  }
  if (screen === 'choose') {
    return 4;
  }
  if (screen === 'conversation' || screen === 'meeting' || screen === 'negotiation') {
    return 3;
  }
  if (screen === 'complete' || screen === 'summary') {
    return 2;
  }

  return 2;
}

/**
 * Retorna o progresso real do processo da proposta no backend (1 a 5).
 * Diferente da tela que o usuário está apenas "visitando" no momento.
 */
export function getProposalProcessStage(
  proposal?: MarketplaceProposal
): ProposalJourneyStageId {
  if (!proposal) return 1;
  if (isProjectComplete(proposal.project)) return 5;
  if (proposal.status === 'accepted' || proposal.project) return 5;
  if (canDecide(proposal)) return 4;
  if (proposal.status === 'negotiating' || proposal.status === 'meeting_scheduled') return 3;
  return 2;
}

/**
 * Verifica se um determinado estágio está disponível para navegação.
 */
export function isStageAccessible(
  stageId: ProposalJourneyStageId,
  proposal: MarketplaceProposal | undefined,
  canCompare: boolean
): boolean {
  if (stageId === 1) return true;
  if (!proposal) return stageId === 2 && canCompare;

  switch (stageId) {
    case 2:
      return true;
    case 3:
      // Conversar sempre acessível se tiver proposta
      return true;
    case 4:
      // Decidir acessível se a proposta for elegível para decisão
      return canDecide(proposal);
    case 5:
      // Acompanhar acessível se a proposta foi aceita ou projeto iniciado
      return proposal.status === 'accepted' || Boolean(proposal.project);
    default:
      return false;
  }
}
