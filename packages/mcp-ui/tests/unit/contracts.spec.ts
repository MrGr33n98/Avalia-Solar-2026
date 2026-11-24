import { describe, expect, it } from 'vitest';
import {
  CompareIntegratorsPayloadSchema,
  GetIntegratorReputationPayloadSchema,
  ListIntegratorsPayloadSchema,
  ListSolarCategoriesPayloadSchema,
  ShowIntegratorProfilePayloadSchema,
} from '../../src/contracts/schemas';
import {
  FIXTURE_CATEGORIES,
  FIXTURE_COMPARE,
  FIXTURE_INTEGRATORS,
  FIXTURE_PROFILE,
  FIXTURE_REPUTATION_LARGE,
  FIXTURE_REPUTATION_ZERO,
} from '../../src/fixtures/staging-fixtures';

describe('MCP Public Tool Contract Schemas', () => {
  it('validates list_integrators envelope and preserves null rating for zero reviews', () => {
    const parsed = ListIntegratorsPayloadSchema.parse(FIXTURE_INTEGRATORS);
    expect(parsed.data.integrators).toHaveLength(3);
    expect(parsed.data.integrators[1].rating_average).toBeNull();
    expect(parsed.data.integrators[1].rating_count).toBe(0);
  });

  it('validates show_integrator_profile envelope', () => {
    const parsed = ShowIntegratorProfilePayloadSchema.parse(FIXTURE_PROFILE);
    expect(parsed.data.integrator.slug).toBe('solar-staging-alfa');
  });

  it('validates list_solar_categories envelope', () => {
    const parsed = ListSolarCategoriesPayloadSchema.parse(FIXTURE_CATEGORIES);
    expect(parsed.data.categories.length).toBeGreaterThanOrEqual(4);
  });

  it('validates get_integrator_reputation with zero and large review samples', () => {
    const zero = GetIntegratorReputationPayloadSchema.parse(FIXTURE_REPUTATION_ZERO);
    expect(zero.data.average_rating).toBeNull();
    expect(zero.data.sample_size).toBe(0);

    const large = GetIntegratorReputationPayloadSchema.parse(FIXTURE_REPUTATION_LARGE);
    expect(large.data.average_rating).toBe(4.82);
    expect(large.data.sample_size).toBe(1042);
  });

  it('validates compare_integrators with 2-3 unique companies and rejects 1 company', () => {
    const valid = CompareIntegratorsPayloadSchema.parse(FIXTURE_COMPARE);
    expect(valid.data.companies).toHaveLength(3);

    expect(() =>
      CompareIntegratorsPayloadSchema.parse({
        ...FIXTURE_COMPARE,
        data: {
          ...FIXTURE_COMPARE.data,
          companies: [FIXTURE_COMPARE.data.companies[0]],
        },
      })
    ).toThrow();
  });
});
