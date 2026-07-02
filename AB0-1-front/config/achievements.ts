/**
 * Configuração central do sistema de Conquistas Sustentáveis — Avalia Solar
 * Inspirado no sistema de Achievements do G2.com, adaptado para energia solar e mobilidade elétrica.
 *
 * Para integração futura com backend:
 * GET /api/v1/dashboard/achievements
 */

export type AchievementCategory =
  | 'avaliacao'
  | 'perfil'
  | 'solar'
  | 'mobilidade'
  | 'comunidade'
  | 'especial';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockCondition: string;
  iconUnlocked: string;
  iconLocked: string;
  category: AchievementCategory;
  points: number;
  priority: number;
  ctaLabel: string;
  ctaHref: string;
}

/** Status do usuário em uma conquista — derivado dos dados do dashboard ou da API futura */
export type UserAchievementStatus = {
  achievementId: string;
  unlocked: boolean;
  unlockedAt?: string;
  progressCurrent: number;
  progressTarget: number;
};

/** Resposta futura da API GET /api/v1/dashboard/achievements */
export interface AchievementsApiResponse {
  summary: {
    unlocked_count: number;
    total_count: number;
    points: number;
    next_achievement: string;
  };
  achievements: UserAchievementStatus[];
}

const BASE_PATH = '/assets/achievements';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_review',
    title: '1ª Avaliação',
    description: 'Publicou sua primeira avaliação aprovada na plataforma.',
    unlockCondition: 'Publique uma avaliação aprovada.',
    iconUnlocked: `${BASE_PATH}/icons/01_primeira_avaliacao.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/01_primeira_avaliacao_locked.svg`,
    category: 'avaliacao',
    points: 50,
    priority: 1,
    ctaLabel: 'Avaliar empresa',
    ctaHref: '/companies',
  },
  {
    id: 'profile_complete',
    title: 'Perfil Completo',
    description: 'Preencheu todos os dados essenciais do perfil.',
    unlockCondition: 'Complete 100% do perfil.',
    iconUnlocked: `${BASE_PATH}/icons/02_perfil_completo.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/02_perfil_completo_locked.svg`,
    category: 'perfil',
    points: 30,
    priority: 2,
    ctaLabel: 'Completar perfil',
    ctaHref: '/review-dashboard/profile',
  },
  {
    id: 'verified_customer',
    title: 'Cliente Verificado',
    description: 'Teve identidade ou projeto validado pela equipe Avalia Solar.',
    unlockCondition: 'Solicite verificação de identidade.',
    iconUnlocked: `${BASE_PATH}/icons/03_cliente_verificado.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/03_cliente_verificado_locked.svg`,
    category: 'perfil',
    points: 100,
    priority: 3,
    ctaLabel: 'Verificar no LinkedIn',
    ctaHref: '/review-dashboard/profile',
  },
  {
    id: 'solar_project_validated',
    title: 'Projeto Solar Validado',
    description: 'Confirmou instalação solar real com documentação.',
    unlockCondition: 'Publique uma avaliação de energia solar com projeto aprovado.',
    iconUnlocked: `${BASE_PATH}/icons/04_projeto_solar_validado.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/04_projeto_solar_validado_locked.svg`,
    category: 'solar',
    points: 150,
    priority: 4,
    ctaLabel: 'Avaliar empresa solar',
    ctaHref: '/categories/energia-solar',
  },
  {
    id: 'mobility_activated',
    title: 'Mobilidade Ativada',
    description: 'Cadastrou um EV ou wallbox em soluções que usa.',
    unlockCondition: 'Adicione um EV ou carregador em Soluções que Uso.',
    iconUnlocked: `${BASE_PATH}/icons/05_mobilidade_ativada.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/05_mobilidade_ativada_locked.svg`,
    category: 'mobilidade',
    points: 80,
    priority: 5,
    ctaLabel: 'Adicionar solução EV',
    ctaHref: '/review-dashboard/solutions',
  },
  {
    id: 'useful_review',
    title: 'Review Útil',
    description: 'Recebeu pelo menos 5 votos úteis da comunidade.',
    unlockCondition: 'Receba 5 votos úteis em uma avaliação.',
    iconUnlocked: `${BASE_PATH}/icons/06_review_util.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/06_review_util_locked.svg`,
    category: 'comunidade',
    points: 60,
    priority: 6,
    ctaLabel: 'Ver minhas avaliações',
    ctaHref: '/review-dashboard',
  },
  {
    id: 'local_influencer',
    title: 'Influenciador Local',
    description: 'Ajudou pessoas da mesma região com avaliações relevantes.',
    unlockCondition: 'Tenha 3+ votos úteis em avaliações regionais.',
    iconUnlocked: `${BASE_PATH}/icons/07_influenciador_local.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/07_influenciador_local_locked.svg`,
    category: 'comunidade',
    points: 120,
    priority: 7,
    ctaLabel: 'Avaliar empresa local',
    ctaHref: '/companies',
  },
  {
    id: 'solar_specialist',
    title: 'Especialista Solar',
    description: 'Avaliou 3 ou mais experiências com energia solar.',
    unlockCondition: 'Publique 3 avaliações aprovadas na categoria solar.',
    iconUnlocked: `${BASE_PATH}/icons/08_especialista_solar.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/08_especialista_solar_locked.svg`,
    category: 'solar',
    points: 200,
    priority: 8,
    ctaLabel: 'Avaliar empresa solar',
    ctaHref: '/categories/energia-solar',
  },
  {
    id: 'sustainable_guardian',
    title: 'Guardião Sustentável',
    description: 'Completou a jornada sustentável com avaliações e perfil.',
    unlockCondition: 'Desbloqueie Perfil Completo, 1ª Avaliação e Projeto Solar Validado.',
    iconUnlocked: `${BASE_PATH}/icons/09_guardiao_sustentavel.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/09_guardiao_sustentavel_locked.svg`,
    category: 'especial',
    points: 500,
    priority: 9,
    ctaLabel: 'Ver progresso',
    ctaHref: '/review-dashboard/achievements',
  },
  {
    id: 'top_reviewer',
    title: 'Top Avaliador',
    description: 'Entrou no ranking mensal dos melhores avaliadores.',
    unlockCondition: 'Tenha Green Score acima de 800 pontos.',
    iconUnlocked: `${BASE_PATH}/icons/12_top_avaliador.svg`,
    iconLocked: `${BASE_PATH}/icons_locked/12_top_avaliador_locked.svg`,
    category: 'especial',
    points: 300,
    priority: 10,
    ctaLabel: 'Aumentar Green Score',
    ctaHref: '/review-dashboard',
  },
];

/** Mapeamento de nível do avaliador baseado em pontos totais */
export function getReviewerLevel(points: number): { label: string; nextThreshold: number } {
  if (points >= 1000) return { label: 'Guardião Sustentável', nextThreshold: Infinity };
  if (points >= 500) return { label: 'Especialista Solar', nextThreshold: 1000 };
  if (points >= 200) return { label: 'Avaliador Avançado', nextThreshold: 500 };
  if (points >= 80) return { label: 'Avaliador Solar', nextThreshold: 200 };
  return { label: 'Iniciante Sustentável', nextThreshold: 80 };
}

/**
 * Deriva status de conquistas a partir dos dados existentes no dashboard.
 * Usado como fallback enquanto o backend não implementa GET /api/v1/dashboard/achievements.
 */
export function deriveAchievementStatuses(params: {
  reviewsCount: number;
  profileCompletionPercent: number;
  helpfulVotes: number;
  greenScore: number;
  hasSolarReview: boolean;
  hasMobilityReview: boolean;
  hasEVSolution: boolean;
  isLinkedInVerified?: boolean;
}): UserAchievementStatus[] {
  const {
    reviewsCount,
    profileCompletionPercent,
    helpfulVotes,
    greenScore,
    hasSolarReview,
    hasMobilityReview,
    hasEVSolution,
    isLinkedInVerified,
  } = params;

  return [
    {
      achievementId: 'first_review',
      unlocked: reviewsCount >= 1,
      progressCurrent: Math.min(reviewsCount, 1),
      progressTarget: 1,
    },
    {
      achievementId: 'profile_complete',
      unlocked: profileCompletionPercent >= 100,
      progressCurrent: profileCompletionPercent,
      progressTarget: 100,
    },
    {
      achievementId: 'verified_customer',
      unlocked: !!isLinkedInVerified,
      progressCurrent: isLinkedInVerified ? 1 : 0,
      progressTarget: 1,
    },
    {
      achievementId: 'solar_project_validated',
      unlocked: hasSolarReview && reviewsCount >= 1,
      progressCurrent: hasSolarReview ? 1 : 0,
      progressTarget: 1,
    },
    {
      achievementId: 'mobility_activated',
      unlocked: hasEVSolution || hasMobilityReview,
      progressCurrent: hasEVSolution || hasMobilityReview ? 1 : 0,
      progressTarget: 1,
    },
    {
      achievementId: 'useful_review',
      unlocked: helpfulVotes >= 5,
      progressCurrent: Math.min(helpfulVotes, 5),
      progressTarget: 5,
    },
    {
      achievementId: 'local_influencer',
      unlocked: helpfulVotes >= 3 && reviewsCount >= 2,
      progressCurrent: Math.min(helpfulVotes, 3),
      progressTarget: 3,
    },
    {
      achievementId: 'solar_specialist',
      unlocked: hasSolarReview && reviewsCount >= 3,
      progressCurrent: Math.min(reviewsCount, 3),
      progressTarget: 3,
    },
    {
      achievementId: 'sustainable_guardian',
      unlocked: profileCompletionPercent >= 100 && reviewsCount >= 1 && hasSolarReview,
      progressCurrent:
        (profileCompletionPercent >= 100 ? 1 : 0) +
        (reviewsCount >= 1 ? 1 : 0) +
        (hasSolarReview ? 1 : 0),
      progressTarget: 3,
    },
    {
      achievementId: 'top_reviewer',
      unlocked: greenScore >= 800,
      progressCurrent: Math.min(greenScore, 800),
      progressTarget: 800,
    },
  ];
}
