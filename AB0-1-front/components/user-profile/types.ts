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

export interface TrustAnchor {
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  company: string;
  member_since: string;
  is_verified: boolean;
  verification_type?: 'linkedin' | 'crea' | 'work_email' | null;
  trust_score: number;
  connected_accounts: ('linkedin' | 'google' | 'apple')[];
}

export interface PersonalDetails {
  first_name: string;
  last_name: string;
  pronouns: string;
  region: string;
  headline: string;
  summary: string;
}

export interface ProfessionalDetails {
  company_name: string;
  industry: string;
  company_size: string;
  role_function: string;
}

export interface PrivacySettings {
  anonymize_last_name: boolean;
  email_frequency: 'immediately' | 'daily' | 'weekly' | 'never';
  profile_visibility: 'public' | 'verified_only' | 'private';
}

export interface UserProfileStats {
  reviews_count: number;
  saved_reviews_count: number;
  drafts_count: number;
  equipments_count: number;
}

export interface EquipmentItem {
  id: string;
  brand: string;
  model: string;
  category: 'inverter' | 'module' | 'battery' | 'structure' | 'monitoring';
  status: 'active' | 'evaluating' | 'replaced';
  date_added: string;
  rating?: number;
  has_review?: boolean;
}

export interface UserProfileData {
  id: string;
  trust_anchor: TrustAnchor;
  personal_details: PersonalDetails;
  professional_details: ProfessionalDetails;
  privacy_settings: PrivacySettings;
  stats: UserProfileStats;
  equipments: EquipmentItem[];
}

