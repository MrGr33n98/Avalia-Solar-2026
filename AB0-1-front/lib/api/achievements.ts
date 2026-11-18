/**
 * Cliente de API e contratos de tipo para Conquistas e Gamificação (Fase 1)
 * Integrado com /api/v1/review_dashboard/achievements
 */

import { fetchApi } from '@/lib/api';

export type AchievementState = 'locked' | 'in_progress' | 'unlocked' | 'revoked';

export type AchievementActionEnum =
  | 'write_review'
  | 'edit_profile'
  | 'add_solution'
  | 'vote_review'
  | 'view';

export interface AchievementAsset {
  earned: string;
  locked: string;
}

export interface AchievementShare {
  verify_url: string;
  token: string;
}

export interface AchievementItem {
  id: string;
  name: string;
  title?: string;
  description: string;
  subtitle?: string;
  category: string;
  tier: string;
  state: AchievementState;
  unlocked: boolean;
  progress: number;
  threshold: number;
  target?: number;
  points?: number;
  xp: number;
  unlocked_at: string | null;
  asset: AchievementAsset;
  action: AchievementActionEnum;
  share: AchievementShare | null;
}

export interface AchievementSummary {
  unlocked_count: number;
  total_count: number;
  xp_total: number;
  completion_percentage: number;
  next_suggested: AchievementItem | null;
}

export interface AchievementFaqItem {
  question: string;
  answer: string;
}

export interface AchievementsResponse {
  schema_version: '2026-11-v1';
  summary: AchievementSummary;
  achievements: AchievementItem[];
  faq: AchievementFaqItem[];
}

export async function getReviewerAchievements(): Promise<AchievementsResponse> {
  return fetchApi<AchievementsResponse>('/review_dashboard/achievements');
}

export function resolveActionUrl(action: AchievementActionEnum): string {
  switch (action) {
    case 'write_review':
      return '/empresas';
    case 'edit_profile':
      return '/review-dashboard/profile';
    case 'add_solution':
      return '/review-dashboard/solutions';
    case 'vote_review':
      return '/avaliacoes';
    case 'view':
    default:
      return '/review-dashboard/achievements';
  }
}

export function resolveActionLabel(action: AchievementActionEnum): string {
  switch (action) {
    case 'write_review':
      return 'Avaliar Empresa';
    case 'edit_profile':
      return 'Completar Perfil';
    case 'add_solution':
      return 'Cadastrar Equipamento';
    case 'vote_review':
      return 'Explorar Avaliações';
    case 'view':
    default:
      return 'Ver Detalhes';
  }
}
