import { z } from 'zod';
import { createEnvelopeSchema } from './schemas';

export const StorefrontCompanySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  verified: z.boolean(),
  logo_url: z.string().nullable().optional(),
  headquarters: z.object({
    city: z.string(),
    state: z.string(),
  }),
  rating: z.number().nullable().optional(),
  review_count: z.number().int().min(0),
});

export const StorefrontSettingsSchema = z.object({
  headline: z.string(),
  cta_label: z.string(),
  show_calculator: z.boolean(),
  featured_brands: z.array(z.string()),
  direct_quote_enabled: z.boolean(),
});

export const StorefrontProjectSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  power_kwp: z.number().min(0),
  city: z.string(),
  uf: z.string(),
  photo_urls: z.array(z.string()),
  completion_year: z.number().int(),
});

export const StorefrontProductSchema = z.object({
  id: z.number().int().positive(),
  category: z.string(),
  brand: z.string(),
  model: z.string(),
  warranty_years: z.number().nullable().optional(),
});

export const StorefrontPayloadSchema = createEnvelopeSchema(
  z.object({
    company: StorefrontCompanySchema,
    settings: StorefrontSettingsSchema,
    projects: z.array(StorefrontProjectSchema),
    curated_products: z.array(StorefrontProductSchema),
  })
);

export type StorefrontPayload = z.infer<typeof StorefrontPayloadSchema>;
export type StorefrontCompany = z.infer<typeof StorefrontCompanySchema>;
export type StorefrontProject = z.infer<typeof StorefrontProjectSchema>;
export type StorefrontProduct = z.infer<typeof StorefrontProductSchema>;

