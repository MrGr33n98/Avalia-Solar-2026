import { z } from 'zod';

export const icpProfileSchema = z.object({
  min_monthly_bill: z.coerce.number().min(0, 'O valor mínimo deve ser maior ou igual a 0'),
  max_monthly_bill: z.coerce.number().nullable().optional(),
  min_system_kwp: z.coerce.number().min(0, 'A potência mínima deve ser maior ou igual a 0'),
  max_system_kwp: z.coerce.number().nullable().optional(),
  min_ev_chargers_count: z.coerce.number().min(0, 'A quantidade de carregadores deve ser maior ou igual a 0'),
  min_ev_vehicles_count: z.coerce.number().nullable().optional(),
  ev_timeframe: z.string().nullable().optional(),
  ev_budget: z.string().nullable().optional(),
  ev_active: z.boolean().default(false),
  strictness_level: z.enum(['flexible', 'balanced', 'strict']).default('balanced'),
  auto_reject_out_of_icp: z.boolean().default(false),
  notify_only_high_match: z.boolean().default(false),
  nationwide: z.boolean().default(false),
  target_audiences: z.array(z.string()).default([]),
  preferred_roof_types: z.array(z.string()).default([]),
  ev_charger_types: z.array(z.string()).default([]),
  ev_applications: z.array(z.string()).default([]),
  target_cities: z.array(z.string()).default([]),
  target_states: z.array(z.string()).default([]),
  target_regions: z.array(z.string()).default([]),
  decision_profiles: z.array(z.string()).default([]),
  motivations: z.array(z.string()).default([]),
  price_sensitivity: z.string().nullable().optional(),
  urgency: z.string().nullable().optional(),
  min_ticket: z.coerce.number().nullable().optional(),
  max_ticket: z.coerce.number().nullable().optional(),
});

export type IcpProfileFormData = z.infer<typeof icpProfileSchema>;
