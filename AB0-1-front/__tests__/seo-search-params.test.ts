import {
  activeSearchParamKeys,
  hasSeoSearchParams,
  shouldNoindexSearchParams,
} from '@/lib/seo/search-params';

describe('SEO search params governance', () => {
  it('does not noindex clean URLs', () => {
    expect(hasSeoSearchParams()).toBe(false);
    expect(shouldNoindexSearchParams()).toBe(false);
    expect(shouldNoindexSearchParams({})).toBe(false);
  });

  it('ignores empty values', () => {
    expect(activeSearchParamKeys({ q: '', state: [] })).toEqual([]);
    expect(shouldNoindexSearchParams({ q: '', state: [] })).toBe(false);
  });

  it('marks deep filters as noindex/follow candidates', () => {
    expect(shouldNoindexSearchParams({ q: 'solar' })).toBe(true);
    expect(shouldNoindexSearchParams({ category_ids: ['1', '2'] })).toBe(true);
    expect(shouldNoindexSearchParams({ project_types: 'Comerciais' })).toBe(true);
    expect(shouldNoindexSearchParams({ page: '2' })).toBe(true);
  });

  it('marks query-based local/category variants as noindex candidates', () => {
    expect(shouldNoindexSearchParams({ city: 'florianopolis', state: 'sc' })).toBe(true);
    expect(shouldNoindexSearchParams({ rating: '4' })).toBe(true);
  });

  it('does not noindex pure tracking params', () => {
    expect(shouldNoindexSearchParams({ utm_source: 'newsletter', gclid: 'abc' })).toBe(false);
  });

  it('treats unknown params as noindex unless explicitly allowlisted', () => {
    expect(shouldNoindexSearchParams({ unexpected: '1' })).toBe(true);
    expect(
      shouldNoindexSearchParams({ category_ids: '10' }, { allowlistedKeys: ['category_ids'] })
    ).toBe(false);
  });
});
