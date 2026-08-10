export interface FeatureAccessEntry {
  state: 'enabled' | 'locked' | 'hidden' | 'limited' | 'trial';
  value?: boolean | number | string | null;
  group?: string;
  source?: string;
  reason?: string;
  upsell_copy?: string;
  expires_at?: string | null;
  limit?: Record<string, number> | null;
}

export interface CompanyFeatureAccessResponse {
  features: Record<string, FeatureAccessEntry>;
  plan: 'free' | 'pro' | 'enterprise' | string;
  subscription: {
    status: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    trial_end?: string | null;
    canceled_at?: string | null;
  };
  metadata: {
    timestamp: string;
    version: number;
    cache_ttl_seconds: number;
  };
}
