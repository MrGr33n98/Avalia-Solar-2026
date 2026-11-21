import { getRecommendedCompanies } from '../compare-insights';
import { mapCompanyToCompareCompany } from '../mapCompanyToCompareCompany';
import { COMPARE_RECOMMENDATION_LIMIT } from '@/lib/comparison/config';

const company = (id: number, name = `Empresa Solar ${id}`) =>
  mapCompanyToCompareCompany({
    id,
    name,
    status: 'active',
    category_name: 'Energia Solar',
    city: 'Florianópolis',
    state: 'SC',
    rating_avg: 4.5,
  });

describe('Compare recommendations — domain boundaries', () => {
  it('returns at most eight distinct eligible recommendations without changing selected companies', () => {
    const selected = company(1);
    const pool = Array.from({ length: 15 }, (_, index) => company(index + 1));
    const results = getRecommendedCompanies({
      selectedCompanies: [selected],
      allCompanies: [...pool, pool[1], pool[2], company(99, 'Banco ABC Brasil')],
      city: 'Florianópolis',
    });
    expect(COMPARE_RECOMMENDATION_LIMIT).toBe(8);
    expect(results).toHaveLength(8);
    expect(new Set(results.map((item) => item.id)).size).toBe(8);
    expect(results.some((item) => item.id === 1)).toBe(false);
    expect(results.some((item) => item.id === 99)).toBe(false);
  });

  it('supports fewer than eight when fewer eligible candidates exist', () => {
    expect(getRecommendedCompanies({
      selectedCompanies: [company(1)],
      allCompanies: [company(2), company(3)],
    })).toHaveLength(2);
  });

  it('keeps location/rating ranking independent from the comparison selection limit', () => {
    const local = company(10);
    const remote = mapCompanyToCompareCompany({ id: 11, name: 'Empresa Remota', city: 'Recife', state: 'PE', rating_avg: 4 });
    const results = getRecommendedCompanies({
      selectedCompanies: [],
      allCompanies: [remote, local],
      city: 'Florianópolis',
    });
    expect(results[0].id).toBe(local.id);
  });
});
