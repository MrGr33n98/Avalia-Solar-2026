/**
 * Dashboard Types
 * Shared TypeScript types for the Company Dashboard
 */

// ============================================================================
// Company Types
// ============================================================================

export interface Company {
  id: string;
  name: string;
  description: string;
  website: string;
  phone: string;
  phone_alt?: string;
  whatsapp: string;
  email_public: string;
  address: string;
  state: string;
  city: string;
  cnpj: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  working_hours?: string;
  payment_methods?: string;
  certifications?: string;
  awards?: string;
  founded_year?: number;
  employees_count?: number;
  latitude?: number;
  longitude?: number;
  minimum_ticket?: number;
  maximum_ticket?: number;
  financing_options?: string;
  response_time_sla?: string;
  languages?: string;
  logo_url?: string;
  banner_url?: string;
  rating_avg?: number;
  rating_count?: number;
  reviews_count?: number;
  featured?: boolean;
  verified?: boolean;
  status?: 'active' | 'pending' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CompanyFormData extends Partial<Company> {}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  seo_url: string;
  status: 'active' | 'pending' | 'rejected';
  featured: boolean;
  description?: string;
  parent_id?: string;
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  user_avatar?: string;
  created_at: Date | string;
  verified: boolean;
  featured: boolean;
  helpful_count: number;
  company_id: string;
  user_id?: string;
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string | number;
  company_id: string;
  short_description?: string;
  sku?: string;
  stock?: number;
  status: 'active' | 'pending' | 'inactive';
  featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Banner & Sponsorship Types
// ============================================================================

export interface Banner {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'pending' | 'expired';
  position: 'top' | 'sidebar' | 'bottom';
  banner_type?: string;
  image_url?: string;
  link?: string;
  start_date?: string;
  end_date?: string;
}

export interface SponsorshipPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  status: 'active' | 'inactive';
}

// ============================================================================
// Lead Types
// ============================================================================

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  company?: string;
  status: 'new' | 'contacted' | 'negotiating' | 'converted' | 'lost';
  created_at: Date | string;
  source?: string;
  value?: number;
}

// ============================================================================
// Campaign Types
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  goal: number;
  achieved: number;
  budget: number;
  spent: number;
  start_date: string;
  end_date: string;
  description?: string;
  metrics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
  };
}

// ============================================================================
// Media Types
// ============================================================================

export interface Media {
  id: string;
  url: string;
  title: string;
  type: 'image' | 'video' | 'document';
  size?: number;
  created_at?: string;
}

// ============================================================================
// Dashboard Stats Types
// ============================================================================

export interface DashboardStats {
  profileViews: number;
  ctaClicks: number;
  whatsappClicks: number;
  leadsReceived: number;
  reviewsCount: number;
  averageRating: number;
  pendingApprovals: number;
  activeCampaigns: number;
  conversionRate: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  type: 'approval' | 'review' | 'lead' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  action_url?: string;
}

// ============================================================================
// Pending Change Types
// ============================================================================

export interface PendingChange {
  id: string;
  company_id: string;
  change_type: 'company_info' | 'categories' | 'banner' | 'product' | 'media' | 'cta_config';
  data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  rejected_at?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================================
// Form State Types
// ============================================================================

export interface FormState<T = any> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface UIState {
  isLoading: boolean;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export interface FilterOptions {
  search?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  category?: string[];
}

export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  direction: SortDirection;
}
