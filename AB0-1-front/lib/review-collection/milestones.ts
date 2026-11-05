/**
 * Marcos de engajamento. NÃO são títulos oficiais nem concessões de badge.
 * Valores decididos para a jornada inicial: 1 / 10 / 20 avaliações aprovadas.
 */
export const REVIEW_MILESTONES = [
  {
    id: 'first_review',
    target: 1,
    title: 'Ganhe sua Primeira Avaliação',
    task: 'Obtenha sua primeira avaliação aprovada',
    icon: '04_primeira_avaliacao',
    summary: 'Comece sua reputação com uma experiência real de cliente.',
    hints: [
      { icon: '02_usuarios', label: 'Convite', text: 'Convide clientes que realmente contrataram seus serviços. Aceite todas as opiniões.' },
      { icon: '03_carrinho', label: 'Experiência', text: 'Peça avaliações após uma experiência efetiva, sem condicionar benefícios à nota.' },
      { icon: '05_globo', label: 'Perfil público', text: 'Avaliações aprovadas aparecem no perfil público, conforme as regras de moderação.' },
    ],
  },
  {
    id: 'ranking_ready',
    target: 10,
    title: 'Prepare-se para o Ranking',
    task: 'Colete 10 avaliações aprovadas',
    icon: '06_matriz',
    summary: 'Construa um histórico consistente para sua presença no Avalia Solar.',
    hints: [
      { icon: '02_usuarios', label: 'Comunidade', text: 'Mais avaliações legítimas ampliam o contexto disponível para os compradores.' },
      { icon: '06_matriz', label: 'Ranking', text: 'A posição no Ranking Avalia Solar depende de sua metodologia. Dez avaliações não garantem liderança.' },
      { icon: '07_tendencia', label: 'Evolução', text: 'Acompanhe resultados por canal; compartilhamentos não equivalem a avaliações aprovadas.' },
    ],
  },
  {
    id: 'community_milestone',
    target: 20,
    title: 'Selo “Usuários nos Amam”',
    task: 'Colete 20 avaliações aprovadas',
    icon: '08_escudo',
    summary: 'Alcance a meta de engajamento e acompanhe os critérios de reconhecimento.',
    hints: [
      { icon: '07_tendencia', label: 'Marco de 20', text: 'Vinte avaliações são uma meta desta jornada, não garantia de posicionamento ou alcance.' },
      { icon: '08_escudo', label: 'Selo oficial', text: 'Este nome representa uma meta ilustrativa; não há concessão automática de selo ao atingir 20 avaliações.' },
      { icon: '09_medalha', label: 'Reconhecimento', text: 'Badges oficiais dependem de critérios públicos, análise e atribuição à empresa.' },
      { icon: '10_raio', label: 'Próximo passo', text: 'Continue coletando experiências autênticas e respondendo às avaliações recebidas.' },
    ],
  },
] as const;

export type ReviewMilestone = (typeof REVIEW_MILESTONES)[number];
export type ReviewMilestoneId = ReviewMilestone['id'];
export type MilestoneState = 'achieved' | 'current' | 'locked' | 'unavailable';

export function normalizedApprovedCount(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

export function milestoneState(target: number, count: number | null): MilestoneState {
  if (count === null) return 'unavailable';
  if (count >= target) return 'achieved';
  const next = REVIEW_MILESTONES.find((item) => count < item.target);
  return next?.target === target ? 'current' : 'locked';
}

export function milestoneProgress(count: number | null): number {
  if (count === null) return 0;
  return Math.min(100, Math.max(0, count / 20 * 100));
}

export function completedMilestones(count: number | null): number {
  if (count === null) return 0;
  return REVIEW_MILESTONES.filter((item) => count >= item.target).length;
}
