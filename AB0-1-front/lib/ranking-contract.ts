import { z } from 'zod';
import { ApiError } from './api-error';
import type { RankingData } from './api';

const nullableNumber = z.number().nullable();

const rankingMetricSchema = z.object({
  status: z.string().optional(),
  position: nullableNumber,
  population: nullableNumber,
  population_label: z.literal('eligible_companies').optional(),
  score: nullableNumber,
  percentile: nullableNumber,
});

const rankingPointSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo_url: z.string().nullable().optional(),
  rating: z.number(),
  completeness_of_vision: z.number(),
  ability_to_execute: z.number(),
  is_current_company: z.boolean(),
  ranking_position: z.number().nullable().optional(),
  ranking_score: z.number().nullable().optional(),
  score_distance: z.number().nullable().optional(),
  criterion_score: z.number().nullable().optional(),
  criteria_breakdown: z.record(z.number()).optional(),
});

// Contrato canônico v1 do read side. `passthrough` preserva a transição dos
// campos legados, mas nenhum campo central chega à UI sem validação runtime.
export const rankingDataSchema = z.object({
  status: z.string(),
  mode: z.enum(['canonical', 'preview']),
  official_scope: z.object({ type: z.enum(['global', 'category']), category_id: nullableNumber }),
  comparison_scope: z.object({
    active: z.boolean(),
    state: z.string().nullable(),
    city: z.string().nullable(),
    sector: z.string().nullable(),
    category_id: nullableNumber,
    criterion_slug: z.string().nullable(),
  }),
  ranking: rankingMetricSchema,
  official_ranking: rankingMetricSchema,
  benchmarks: z.object({
    status: z.enum(['ready', 'insufficient_sample', 'empty']),
    population: z.number(),
    minimum_population: z.number().optional(),
    median_score: nullableNumber,
    p75_score: nullableNumber,
    p90_score: nullableNumber,
    distribution: z.object({
      min_score: z.number(),
      max_score: z.number(),
      mean_score: z.number(),
      standard_deviation: z.number(),
      distinct_score_count: z.number(),
    }).nullable().optional(),
  }),
  history: z.object({
    status: z.string(),
    scope: z.literal('official'),
    items: z.array(z.object({
      week: z.string(),
      position: nullableNumber,
      score: nullableNumber,
      percentile: nullableNumber,
    })),
  }).passthrough(),
  quadrant: z.object({
    status: z.string(),
    preview: z.boolean(),
    points: z.array(rankingPointSchema),
    meta: z.record(z.unknown()),
  }),
  definition: z.object({
    definition_version: z.string(),
    purpose: z.literal('organic_performance'),
    sponsored_included: z.literal(false),
  }).passthrough(),
  quality: z.object({ flags: z.array(z.string()) }).passthrough(),
  leaders: z.array(rankingPointSchema),
  neighbors: z.array(rankingPointSchema),
  insights: z.object({
    strengths: z.array(z.record(z.unknown())),
    opportunities: z.array(z.record(z.unknown())),
    next_best_action: z.record(z.unknown()).nullable(),
  }),
  score_drivers: z.object({ status: z.string(), source: z.string().nullable(), score: nullableNumber, items: z.array(z.record(z.unknown())) }),
  gaps: z.array(z.record(z.unknown())),
  changes: z.object({ status: z.string(), from: z.string().nullable(), to: z.string().nullable(), changes: z.record(z.number()) }),
  error: z.unknown().nullable(),
  request_id: z.string().nullable(),
  is_premium_analytics: z.boolean(),
}).passthrough();

export function parseRankingData(payload: unknown): RankingData {
  const parsed = rankingDataSchema.safeParse(payload);
  if (parsed.success) return parsed.data as RankingData;

  const requestId = typeof payload === 'object' && payload !== null && 'request_id' in payload
    ? (payload as { request_id?: unknown }).request_id
    : undefined;
  throw new ApiError('O contrato de dados do ranking é inválido.', {
    code: 'RANKING_CONTRACT_INVALID',
    details: parsed.error.flatten(),
    requestId: typeof requestId === 'string' ? requestId : undefined,
  });
}
