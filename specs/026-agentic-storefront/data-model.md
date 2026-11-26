# Modelo de Dados e Contratos: SPEC 026 — Agentic Storefront

**Versão:** 0.1.0  
**Data:** 26 de Novembro de 2026  

---

## 1. Modelagem DDD e Entidades de Domínio

O domínio do Storefront agrega entidades já existentes no Avalia Solar sem redundância de tabelas:

```
┌────────────────────────────────────────────────────────┐
│                        Company                         │
│  - id, name, slug, verified, logo_url, city, state     │
│  - phone, email, website_url, description              │
└──────────────────────────┬─────────────────────────────┘
                           │ 1:1
                           ▼
┌────────────────────────────────────────────────────────┐
│                   StorefrontSetting                    │
│  - custom_headline, primary_color, cta_label           │
│  - featured_brands (jsonb), show_calculator (bool)     │
│  - direct_quote_enabled (bool), tier_level (enum)      │
└──────────────────────────┬─────────────────────────────┘
                           │ 1:N
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│     CompanyProject      │ │     CompanyProduct      │
│  - title, power_kwp     │ │  - product_id (FK)      │
│  - city, uf, photo_urls │ │  - featured (bool)      │
│  - completion_date      │ │  - warranty_years       │
└─────────────────────────┘ └─────────────────────────┘
```

---

## 2. Contrato Zod (Envelope Público v1)

```typescript
import { z } from 'zod';

export const StorefrontProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  power_kwp: z.number(),
  city: z.string(),
  uf: z.string().length(2),
  photo_urls: z.array(z.string().url()).max(5),
  completion_year: z.number(),
});

export const StorefrontSettingSchema = z.object({
  headline: z.string().max(120),
  cta_label: z.string().max(30).default('Solicitar Orçamento'),
  show_calculator: z.boolean().default(true),
  featured_brands: z.array(z.string()).max(10),
  direct_quote_enabled: z.boolean().default(true),
});

export const StorefrontPayloadSchema = z.object({
  schema_version: z.literal('v1'),
  data_as_of: z.string(),
  source_type: z.literal('avalia_solar_verified_storefront'),
  data: z.object({
    company: z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      verified: z.boolean(),
      logo_url: z.string().url().nullable(),
      headquarters: z.object({
        city: z.string(),
        state: z.string().length(2),
      }),
      rating: z.number().min(0).max(5).nullable(),
      review_count: z.number().int().min(0),
    }),
    settings: StorefrontSettingSchema,
    projects: z.array(StorefrontProjectSchema),
    curated_products: z.array(z.object({
      id: z.number(),
      category: z.string(),
      brand: z.string(),
      model: z.string(),
      warranty_years: z.number().optional(),
    })),
  }),
  limitations: z.array(z.string()),
});

export type StorefrontPayload = z.infer<typeof StorefrontPayloadSchema>;
```

