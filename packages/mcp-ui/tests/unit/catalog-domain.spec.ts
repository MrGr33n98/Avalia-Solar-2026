import { describe, expect, it } from 'vitest';
import { solarEstimate, financeEstimate, selectRecommendations, summarizeDirectory } from '../../src/domain/catalog';
import { FIXTURE_INTEGRATORS } from '../../src/fixtures/staging-fixtures';

describe('catalog domain', () => {
  it('estimates size and annual savings without promising output', () => {
    const result = solarEstimate({ consumption: 500, tariff: 1, sunHours: 5, performanceRatio: .8, offset: .9 });
    expect(result?.capacityKw).toBeCloseTo(3.75);
    expect(result?.annualGrossSavings).toBeCloseTo(5400);
    expect(solarEstimate({ consumption: 500, tariff: 1, sunHours: 0, performanceRatio: .8, offset: .9 })).toBeNull();
  });
  it('handles zero interest and standard amortization; rejects invalid inputs', () => {
    expect(financeEstimate({ principal: 12000, monthlyRate: 0, months: 12 })?.payment).toBe(1000);
    expect(financeEstimate({ principal: 10000, monthlyRate: .01, months: 12 })?.payment).toBeCloseTo(888.49, 2);
    expect(financeEstimate({ principal: 1, monthlyRate: -1, months: 12 })).toBeNull();
    expect(financeEstimate({ principal: Infinity, monthlyRate: 0, months: 12 })).toBeNull();
  });
  it('keeps recommendations transparent and counts only the loaded cohort', () => {
    const companies = FIXTURE_INTEGRATORS.data.integrators;
    expect(selectRecommendations(companies, 'missing-category')).toEqual([]);
    expect(selectRecommendations(companies, '').map(c => c.id)).toEqual(companies.map(c => c.id));
    expect(summarizeDirectory([...companies, companies[0]]).total).toBe(companies.length);
  });
});
