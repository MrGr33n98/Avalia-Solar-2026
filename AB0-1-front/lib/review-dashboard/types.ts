export type DashboardSectionStatus = 'ready' | 'unavailable' | 'error';

export interface DashboardSection<T> {
  status: DashboardSectionStatus;
  data: T | null;
  message?: string;
}

export interface ReviewDashboardMeta {
  schema_version?: number;
  generated_at?: string;
  request_id?: string;
  partial?: boolean;
  stale_sections?: string[];
  duration_ms?: number;
}

export interface ReviewDashboardSummaryDto {
  meta?: ReviewDashboardMeta;
  kpis?: {
    reviews?: {
      total?: number | null;
      published?: number | null;
      pending?: number | null;
      rejected?: number | null;
    };
    estimated_savings?: number | null;
    quotes_total?: number | null;
    quotes_open?: number | null;
    quotes_replied?: number | null;
    reviews_published?: number | null;
  };
  gamification?: {
    green_score?: number | null;
    regional_ranking?: number | null;
    earned_points?: number | null;
    achievements?: Array<{
      id?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      state?: string;
      unlocked?: boolean;
      progress?: number | null;
      target?: number | null;
      unlocked_at?: string | null;
    }>;
    level?: {
      key?: string;
      name?: string;
      next?: string | null;
      progress?: number | null;
      threshold?: number | null;
    } | null;
  };
  impact?: {
    helpful_votes?: number | null;
    impacted_people?: number | null;
  };
  recent_activities?: Array<{
    id?: string | number;
    type?: string;
    title?: string;
    subtitle?: string | null;
    occurred_at?: string | null;
    time?: string;
  }> | null;
  recommendations?: Array<{
    name?: string;
    city?: string;
    state?: string;
    rating?: number | null;
    badge?: string;
  }> | null;
  charts?: {
    activity_30d?: Array<{
      date?: string;
      profile_views?: number | null;
      whatsapp_clicks?: number | null;
      cta_clicks?: number | null;
    }> | null;
  } | null;
  sustainable_journey?: Array<{
    id?: string;
    title?: string;
    state?: string;
    progress?: number | null;
    details?: string[];
  }> | null;
  profile?: {
    completion_percent?: number | null;
    missing_fields?: string[];
    items?: Array<{ key?: string; label?: string; completed?: boolean }>;
  } | null;
}

export interface ReviewDashboardErrorPayload {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
    request_id?: string;
  };
  code?: string;
  message?: string;
  errors?: string[];
}

export function getDashboardErrorMessage(payload: ReviewDashboardErrorPayload): string {
  return (
    payload.error?.message ||
    payload.message ||
    payload.errors?.join(', ') ||
    'Não foi possível atualizar esta informação.'
  );
}

export type NextBestActionType =
  | 'complete_profile'
  | 'write_first_review'
  | 'add_solution'
  | 'explore_achievements';

export interface PrimeDashboardViewModel {
  identity: {
    name: string;
    firstName: string;
    avatarUrl: string | null;
    profession: string | null;
    location: string | null;
    levelName: string | null;
  };
  profile: DashboardSection<{
    completionPercent: number;
    items: Array<{ key: string; label: string; completed: boolean }>;
    missingFields: string[];
  }>;
  reputation: DashboardSection<{
    greenScore: number | null;
    regionalRanking: number | null;
    totalReviews: number | null;
    publishedReviews: number | null;
    pendingReviews: number | null;
    achievementsCount: number | null;
  }>;
  impact: DashboardSection<{
    impactedPeople: number | null;
    helpfulVotes: number | null;
  }>;
  achievements: DashboardSection<
    Array<{
      id: string;
      title: string;
      description: string;
      unlocked: boolean;
      progress: number | null;
      target: number | null;
      unlockedAt: string | null;
    }>
  >;
  activity: DashboardSection<Array<{ icon: string; title: string; time: string }>>;
  nextAction: {
    type: NextBestActionType;
    title: string;
    description: string;
    href: string;
  };
}

export function clampPercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, value));
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || 'usuário';
}

export function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'AS';
}

export function formatLocation(city?: string | null, state?: string | null): string | null {
  const location = [city, state].filter((part): part is string => Boolean(part?.trim())).join(', ');
  return location || null;
}

function normalizeNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function buildPrimeDashboardViewModel({
  user,
  summary,
  reviewsCount,
  pendingReviews,
  solutionsCount,
}: {
  user: {
    name?: string | null;
    avatar_url?: string | null;
    profession?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
  summary: ReviewDashboardSummaryDto | null;
  reviewsCount: number | null;
  pendingReviews: number | null;
  solutionsCount: number | null;
}): PrimeDashboardViewModel {
  const name = user?.name?.trim() || 'Usuário';
  const profileDto = summary?.profile;
  const profilePercent = clampPercent(profileDto?.completion_percent);
  const profileData = profileDto
    ? {
        completionPercent: profilePercent ?? 0,
        items: (profileDto.items ?? [])
          .filter((item): item is { key: string; label: string; completed: boolean } =>
            Boolean(item.key && item.label && typeof item.completed === 'boolean')
          )
          .map((item) => ({ key: item.key, label: item.label, completed: item.completed })),
        missingFields: profileDto.missing_fields ?? [],
      }
    : null;

  const achievementsDto = summary?.gamification?.achievements;
  const achievements = achievementsDto
    ? achievementsDto
        .filter((item): item is NonNullable<typeof item> & { title: string } => Boolean(item.title))
        .map((item, index) => ({
          id: item.id || `${item.title}-${index}`,
          title: item.title,
          description: item.subtitle || item.description || 'Conquista da comunidade.',
          unlocked: item.unlocked ?? item.state === 'desbloqueado',
          progress: normalizeNumber(item.progress),
          target: normalizeNumber(item.target),
          unlockedAt: item.unlocked_at ?? null,
        }))
    : null;

  const greenScore = normalizeNumber(summary?.gamification?.green_score);
  const ranking = normalizeNumber(summary?.gamification?.regional_ranking);
  const impact = summary?.impact
    ? {
        impactedPeople: normalizeNumber(summary.impact.impacted_people),
        helpfulVotes: normalizeNumber(summary.impact.helpful_votes),
      }
    : null;
  const activity = summary?.recent_activities
    ? summary.recent_activities
        .filter(
          (
            item
          ): item is { icon?: string; title: string; time?: string; occurred_at?: string | null } =>
            Boolean(item.title)
        )
        .map((item) => ({
          icon: item.icon || 'Activity',
          title: item.title,
          time:
            item.time ||
            (item.occurred_at
              ? new Date(item.occurred_at).toLocaleDateString('pt-BR')
              : 'recentemente'),
        }))
    : null;

  const nextAction =
    (profilePercent ?? 0) < 100
      ? {
          type: 'complete_profile' as const,
          title: 'Complete seu perfil',
          description: 'Adicione os dados que faltam para fortalecer sua presença na comunidade.',
          href: '/review-dashboard/profile',
        }
      : reviewsCount === 0
        ? {
            type: 'write_first_review' as const,
            title: 'Publique sua primeira avaliação',
            description:
              'Compartilhe uma experiência real e ajude outras pessoas a escolher melhor.',
            href: '/companies',
          }
        : solutionsCount === 0
          ? {
              type: 'add_solution' as const,
              title: 'Adicione uma solução que você utiliza',
              description:
                'Registre soluções reais para tornar seu perfil mais útil para a comunidade.',
              href: '/review-dashboard/solutions',
            }
          : {
              type: 'explore_achievements' as const,
              title: 'Continue contribuindo',
              description: 'Veja suas conquistas e descubra novas formas de participar.',
              href: '/review-dashboard/achievements',
            };

  return {
    identity: {
      name,
      firstName: firstNameOf(name),
      avatarUrl: user?.avatar_url || null,
      profession: user?.profession?.trim() || null,
      location: formatLocation(user?.city, user?.state),
      levelName: summary?.gamification?.level?.name || null,
    },
    profile: { status: profileData ? 'ready' : 'unavailable', data: profileData },
    reputation: {
      status: summary ? 'ready' : 'unavailable',
      data: summary
        ? {
            greenScore,
            regionalRanking: ranking,
            totalReviews: reviewsCount,
            publishedReviews: normalizeNumber(summary.kpis?.reviews_published),
            pendingReviews,
            achievementsCount: achievements?.length ?? null,
          }
        : null,
    },
    impact: { status: impact ? 'ready' : 'unavailable', data: impact },
    achievements: { status: achievements ? 'ready' : 'unavailable', data: achievements },
    activity: { status: activity ? 'ready' : 'unavailable', data: activity },
    nextAction,
  };
}
