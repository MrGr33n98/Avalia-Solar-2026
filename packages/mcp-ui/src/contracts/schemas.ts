import { z } from 'zod';

export const CONTRACT_VERSION = '1.0.0' as const;

export const SourceTypeSchema = z.enum([
  'company_declared',
  'platform_verified',
  'review_aggregate',
  'platform_derived',
  'unknown',
]);

export function createEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    schema_version: z.literal(CONTRACT_VERSION),
    data_as_of: z.string().min(1),
    source_type: SourceTypeSchema,
    data: dataSchema,
    limitations: z.array(z.string()),
  });
}

export const CategoryTagSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const SolarCategorySchema = CategoryTagSchema.extend({
  description: z.string().nullable().optional(),
  parent_id: z.number().int().nullable().optional(),
  vertical: z.string().nullable().optional(),
});

export const IntegratorSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  profile_url: z.string().url(),
  logo_url: z.string().url().nullable().optional(),
  headquarters: z.object({
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
  }),
  declared_coverage: z.object({
    states: z.array(z.string()),
    cities: z.array(z.string()),
  }),
  verification_state: z.enum(['platform_verified', 'unverified']),
  rating_average: z.number().nullable(),
  rating_count: z.number().int().min(0),
  categories: z.array(CategoryTagSchema),
  description: z.string().optional(),
  services: z.array(z.string()).optional(),
  hero_carousel: z.object({
    version: z.number().int().positive(),
    enabled: z.boolean(),
    slides: z.array(z.object({
      id: z.number().int().positive(),
      slot: z.number().int().min(1).max(3),
      position: z.number().int(),
      image_url: z.string(),
      width: z.number().int().positive().nullable().optional(),
      height: z.number().int().positive().nullable().optional(),
      alt_text: z.string(),
    })).max(3),
  }).optional(),
});

export const ListIntegratorsPayloadSchema = createEnvelopeSchema(
  z.object({
    integrators: z.array(IntegratorSchema),
    next_cursor: z.string().nullable().optional(),
  })
);

export const ShowIntegratorProfilePayloadSchema = createEnvelopeSchema(
  z.object({
    integrator: IntegratorSchema,
  })
);

export const ListSolarCategoriesPayloadSchema = createEnvelopeSchema(
  z.object({
    categories: z.array(SolarCategorySchema),
    next_cursor: z.string().nullable().optional(),
  })
);

export const GetIntegratorReputationPayloadSchema = createEnvelopeSchema(
  z.object({
    total_approved: z.number().int().min(0),
    average_rating: z.number().min(1).max(5).nullable(),
    rating_distribution: z.record(z.string(), z.number().int().min(0)),
    verified_total: z.number().int().min(0),
    replied_total: z.number().int().min(0),
    sample_size: z.number().int().min(0),
  })
);

export const ComparisonCompanySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  profile_url: z.string().url(),
  logo_url: z.string().url().nullable().optional(),
  verification_state: z.enum(['platform_verified', 'unverified']),
});

export const CompareIntegratorsPayloadSchema = createEnvelopeSchema(
  z.object({
    companies: z.array(ComparisonCompanySchema).min(2).max(3),
    comparison_matrix: z.record(z.string(), z.record(z.string(), z.unknown())),
    unknown_fields: z.array(z.string()),
    criteria_used: z.array(z.string()),
  })
);

export type CategoryTag = z.infer<typeof CategoryTagSchema>;
export type SolarCategory = z.infer<typeof SolarCategorySchema>;
export type Integrator = z.infer<typeof IntegratorSchema>;
export type ListIntegratorsPayload = z.infer<typeof ListIntegratorsPayloadSchema>;
export type ShowIntegratorProfilePayload = z.infer<typeof ShowIntegratorProfilePayloadSchema>;
export type ListSolarCategoriesPayload = z.infer<typeof ListSolarCategoriesPayloadSchema>;
export type GetIntegratorReputationPayload = z.infer<typeof GetIntegratorReputationPayloadSchema>;
export type CompareIntegratorsPayload = z.infer<typeof CompareIntegratorsPayloadSchema>;

export type * from './storefront';

