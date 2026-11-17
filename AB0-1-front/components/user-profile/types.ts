export type UserTabId =
  | 'activity_center'
  | 'my_reviews'
  | 'products_used'
  | 'my_rewards'
  | 'my_lists'
  | 'community_qa'
  | 'achievements'
  | 'notifications'
  | 'profile_details'
  | 'privacy_settings';

/**
 * Âncora de confiança exibida no card lateral.
 *
 * Regras de integridade:
 * - Campos textuais vazios significam "não informado" e nunca recebem valores fictícios.
 * - `is_verified` só pode ser `true` quando houver fonte persistida e confiável no backend.
 *   Hoje não existe verificação profissional individual, portanto o mapper sempre envia `false`.
 * - `trust_score` só é numérico quando calculado por serviço real; `null` oculta o indicador.
 */
export interface TrustAnchor {
  full_name: string;
  avatar_url: string | null;
  role: string;
  company: string;
  member_since: string | null;
  is_verified: boolean;
  verification_type?: 'linkedin' | 'crea' | 'work_email' | null;
  trust_score: number | null;
}

/** Campos persistidos: nome (users.name), headline (reviewer_profiles.profession), resumo (bio). */
export interface PersonalDetails {
  first_name: string;
  last_name: string;
  /** Somente leitura: derivado de users.city/state. */
  region: string;
  headline: string;
  summary: string;
}

/** Apenas `company_name` possui persistência (reviewer_profiles.company_name). */
export interface ProfessionalDetails {
  company_name: string;
}

/**
 * Preferências de privacidade.
 * Não há endpoint de atualização nem regra pública única que as aplique,
 * por isso a aba é exibida como indisponível e os valores ficam neutros.
 */
export interface PrivacySettings {
  anonymize_last_name: boolean | null;
  email_frequency: 'immediately' | 'daily' | 'weekly' | 'never' | null;
  profile_visibility: 'public' | 'verified_only' | 'private' | null;
}

/** `null` = sem fonte confiável (indisponível). Zero só quando a fonte confirma ausência. */
export interface UserProfileStats {
  reviews_count: number | null;
  saved_reviews_count: number | null;
  drafts_count: number | null;
  equipments_count: number | null;
}

/** Espelha ReviewerSolution#as_json do Rails (GET /api/v1/reviewer_solutions). */
export interface EquipmentItem {
  id: string;
  name: string;
  type: 'company' | 'product' | 'service' | 'technology' | string;
  category: string;
  verified: boolean;
  status: 'active' | 'rejected' | 'disabled' | string;
  companyId?: string | null;
  created_at?: string | null;
}

export interface UserProfileData {
  id: string;
  trust_anchor: TrustAnchor;
  personal_details: PersonalDetails;
  professional_details: ProfessionalDetails;
  privacy_settings: PrivacySettings;
  stats: UserProfileStats;
  /** `null` = falha ao carregar; `[]` = usuário sem equipamentos. */
  equipments: EquipmentItem[] | null;
}

export interface ProfileSavePayload {
  personal: PersonalDetails;
  professional: ProfessionalDetails;
}
