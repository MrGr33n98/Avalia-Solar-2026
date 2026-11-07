import { getPaginationItems, normalizeSearchPage, normalizeSearchPageSize } from './searchPagination';

describe('search pagination domain rules', () => {
  it('bounds invalid page params and page sizes', () => {
    expect(normalizeSearchPage('abc')).toBe(1);
    expect(normalizeSearchPage('-10')).toBe(1);
    expect(normalizeSearchPage('999999999')).toBe(1);
    expect(normalizeSearchPage('12')).toBe(12);
    expect(normalizeSearchPageSize('999')).toBe(24);
    expect(normalizeSearchPageSize('12')).toBe(12);
    expect(normalizeSearchPageSize('48')).toBe(48);
  });

  it('shows a compact window at the beginning', () => {
    expect(getPaginationItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
  });

  it('shows both gap separators for a middle page', () => {
    expect(getPaginationItems(11, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 12, 13, 'ellipsis', 20]);
  });

  it('shows a compact window at the end', () => {
    expect(getPaginationItems(20, 20)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
  });

  it('never returns repeated pages or an oversized list', () => {
    for (const total of [1, 2, 3, 5, 6, 100, 1000]) {
      for (const page of [1, 2, 11, total]) {
        const pages = getPaginationItems(page, total).filter((value): value is number => typeof value === 'number');
        expect(pages).toEqual([...new Set(pages)]);
        expect(pages.length).toBeLessThanOrEqual(7);
        expect(pages[0]).toBe(1);
        expect(pages[pages.length - 1]).toBe(total);
      }
    }
  });
});
