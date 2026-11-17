import type { EquipmentItem, UserProfileData } from './types';

/** Payload de GET /api/v1/reviewer/profile (Api::V1::Reviewer::ProfileController#profile_payload). */
export interface ReviewerProfilePayload {
  user?: {
    id?: number | string;
    name?: string | null;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    avatar_url?: string | null;
  } | null;
  profile?: {
    profession?: string | null;
    company_name?: string | null;
    bio?: string | null;
    [key: string]: unknown;
  } | null;
}

/** Subconjunto de GET /api/v1/review_dashboard/summary utilizado pela central. */
export interface ReviewSummaryPayload {
  kpis?: {
    reviews?: { published?: number | null } | null;
    reviews_published?: number | null;
  } | null;
}

export interface BuildUserProfileInput {
  authUser: { id: number | string; name?: string | null; created_at?: string | null } | null;
  profilePayload: ReviewerProfilePayload;
  /** Resposta crua de GET /reviewer_solutions (array ou `{ data: [] }`). */
  solutions?: unknown;
  /** `true` quando a listagem de equipamentos falhou. */
  solutionsFailed?: boolean;
  /** `null` quando o resumo falhou. */
  summary: ReviewSummaryPayload | null;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export function joinFullName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(' ');
}

export function formatRegion(city?: string | null, state?: string | null): string {
  return [text(city), text(state)].filter(Boolean).join(', ');
}

export function normalizeSolutions(response: unknown): EquipmentItem[] {
  const list = Array.isArray(response)
    ? response
    : Array.isArray((response as { data?: unknown[] } | null)?.data)
      ? (response as { data: unknown[] }).data
      : [];

  return list
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter((item) => item.status !== 'disabled')
    .map((item) => ({
      id: String(item.id ?? ''),
      name: text(item.name),
      type: text(item.type) || 'product',
      category: text(item.category),
      verified: item.verified === true,
      status: text(item.status) || 'active',
      companyId: item.companyId != null ? String(item.companyId) : null,
      created_at: typeof item.created_at === 'string' ? item.created_at : null,
    }))
    .filter((item) => item.id && item.name);
}

function publishedReviews(summary: ReviewSummaryPayload | null): number | null {
  const value = summary?.kpis?.reviews?.published ?? summary?.kpis?.reviews_published;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Converte as respostas reais da API no modelo da central de perfil.
 * Nunca preenche dados ausentes com valores demonstrativos.
 */
export function buildUserProfileData({
  authUser,
  profilePayload,
  solutions,
  solutionsFailed = false,
  summary,
}: BuildUserProfileInput): UserProfileData {
  const apiUser = profilePayload.user ?? null;
  const profile = profilePayload.profile ?? null;

  const fullName = text(apiUser?.name) || text(authUser?.name);
  const { first, last } = splitFullName(fullName);
  const equipments = solutionsFailed ? null : normalizeSolutions(solutions);

  return {
    id: String(apiUser?.id ?? authUser?.id ?? ''),
    trust_anchor: {
      full_name: fullName,
      avatar_url: text(apiUser?.avatar_url) || null,
      role: text(profile?.profession),
      company: text(profile?.company_name),
      member_since: text(authUser?.created_at) || null,
      // Não existe fonte de verificação profissional individual no backend.
      is_verified: false,
      verification_type: null,
      // Não existe Trust Score individual calculado no backend.
      trust_score: null,
    },
    personal_details: {
      first_name: first,
      last_name: last,
      region: formatRegion(apiUser?.city, apiUser?.state),
      headline: text(profile?.profession),
      summary: text(profile?.bio),
    },
    professional_details: {
      company_name: text(profile?.company_name),
    },
    privacy_settings: {
      anonymize_last_name: null,
      email_frequency: null,
      profile_visibility: null,
    },
    stats: {
      reviews_count: publishedReviews(summary),
      saved_reviews_count: null,
      drafts_count: null,
      equipments_count: equipments === null ? null : equipments.length,
    },
    equipments,
  };
}
