import {
  buildCompareSummary,
  getBestMatch,
  getRecommendedCompanies,
  parseResponseTimeMinutes,
} from '../compare-insights';
import { mapCompanyToCompareCompany } from '../mapCompanyToCompareCompany';

const company = (overrides: Record<string, unknown>) =>
  mapCompanyToCompareCompany({
    id: 1,
    slug: 'empresa',
    name: 'Empresa',
    ...overrides,
  });

describe('compare insights', () => {
  it('excludes selected companies and applies the recommendation score', () => {
    const selected = company({ id: 1, city: 'Florianópolis', category_ids: [10] });
    const localVerified = company({
      id: 2,
      name: 'Local verificada',
      city: 'Florianópolis',
      category_ids: [10],
      verified: true,
      rating_avg: 4.2,
      rating_count: 50,
    });
    const highlyRated = company({
      id: 3,
      name: 'Nota alta',
      city: 'São Paulo',
      category_ids: [20],
      rating_avg: 5,
      rating_count: 10,
    });

    expect(
      getRecommendedCompanies({
        selectedCompanies: [selected],
        allCompanies: [selected, highlyRated, localVerified],
        city: 'Florianópolis',
      }).map((item) => item.id)
    ).toEqual([2, 3]);
  });

  it('parses response time and builds summary without fake winners', () => {
    const fast = company({ id: 1, name: 'Rápida', response_time_sla: '~2h', rating_avg: 4.5 });
    const reviewed = company({ id: 2, name: 'Avaliada', rating_avg: 4.2, rating_count: 100 });

    expect(parseResponseTimeMinutes(fast)).toBe(120);
    expect(buildCompareSummary([fast, reviewed])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'rating', companyName: 'Rápida' }),
        expect.objectContaining({ key: 'reviews', companyName: 'Avaliada' }),
        expect.objectContaining({ key: 'coverage', companyName: null }),
      ])
    );
  });

  it('only returns a best match when at least two companies exist', () => {
    const first = company({ id: 1, rating_avg: 4.8, verified: true });
    const second = company({ id: 2, rating_avg: 3.5 });

    expect(getBestMatch([first])).toBeNull();
    const match = getBestMatch([first, second]);
    expect(match?.id).toBe(1);
    expect(match?.matchFactors).toContain('verificação');
  });

  it('does not return a best match when all companies have zero comparable data', () => {
    const empty1 = company({ id: 1, rating_avg: 0, rating_count: 0, verified: false });
    const empty2 = company({ id: 2, rating_avg: 0, rating_count: 0, verified: false });

    expect(getBestMatch([empty1, empty2])).toBeNull();
  });

  it('excludes banks/financial institutions from recommendations when solar companies are selected', () => {
    const solar = company({ id: 1, name: 'Solar Pro', category_ids: [1] });
    const bank = company({ id: 2, name: 'Banco ABC Brasil', category_ids: [5] });
    const otherSolar = company({ id: 3, name: 'Growatt Solar', category_ids: [1], rating_avg: 4.9 });

    const recommended = getRecommendedCompanies({
      selectedCompanies: [solar],
      allCompanies: [solar, bank, otherSolar],
    });

    expect(recommended.map((r) => r.id)).toEqual([3]);
    expect(recommended.some((r) => r.name.includes('Banco'))).toBe(false);
  });
});
