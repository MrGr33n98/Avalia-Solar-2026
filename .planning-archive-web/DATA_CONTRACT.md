# DATA CONTRACT — Contrato de Dados Mínimo

Este documento define a interface TypeScript e a estrutura JSON canonizada que a página pública de perfil de empresa receberá da API do Rails backend.

---

## 1. Interface TypeScript (`ExtendedCompany`)

```typescript
export interface CompanyProfilePayload {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    banner_url: string | null;
    description: string;
    tagline: string | null;
    rating: number;
    reviews_count: number;
    city: string;
    state: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    verified: boolean;
    claimed: boolean;
    plan_tier: 'free' | 'essential' | 'pro' | 'enterprise';
  };
  entitlements: {
    product_description: boolean;
    product_features_block: boolean;
    ideal_customer_block: boolean;
    promo_banner: boolean;
    verified_product: boolean;
    highlight_badges: boolean;
    custom_ctas: boolean;
    pricing_table: boolean;
    special_offer: boolean;
    sponsored_description: boolean;
    downloadable_materials: boolean;
    media_gallery: boolean;
    media_upload: boolean;
    product_images_limit: number | null;
    company_links_block: boolean;
    featured_review: boolean;
    social_proof: boolean;
    faq_block: boolean;
    show_alternatives: boolean;
    show_competitor_banners: boolean;
    advanced_analytics: boolean;
    leads_marketplace: boolean;
    financing_simulation: boolean;
    webhooks: boolean;
    intent_scores: boolean;
    sector_question_limit: number;
    setup_fee: number;
    setup_included: boolean;
    onboarding_session: boolean;
  };
  reviews: Array<{
    id: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    verified: boolean;
    created_at: string;
    helpful_count: number;
    reply: string | null;
    replied_at: string | null;
  }>;
  products: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    image_url: string | null;
    specs: Record<string, string>;
    featured: boolean;
  }>;
  projects: Array<{
    id: string;
    name: string;
    segment: string;
    description: string;
    city: string;
    state: string;
    date: string;
    image_url: string | null;
    technical_tags: string[];
  }>;
  related_companies: Array<{
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    rating: number;
    reviews_count: number;
    city: string;
    state: string;
    plan_tier: string;
    verified: boolean;
  }>;
  ads: Array<{
    slot: string;
    image_url: string;
    click_url: string;
    label: 'Patrocinado' | 'Destaque Premium' | 'Anúncio no Avalia Solar';
  }>;
  stats: {
    projects_completed?: number;
    chargers_installed?: number;
    clients_served?: number;
    avg_response_time_hours?: number;
  };
  faq: Array<{
    id: string;
    question: string;
    answer: string;
    position: number;
  }>;
  offers: Array<{
    id: string;
    title: string;
    description: string;
    coupon_code: string | null;
    expiration_date: string | null;
  }>;
}
```
