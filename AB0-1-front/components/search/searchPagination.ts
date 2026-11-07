/** Shared presentation rules for search pages; no fetches or side effects. */
export type PaginationItem = number | 'ellipsis';

export const SEARCH_PAGE_SIZES = [12, 24, 48] as const;
export const DEFAULT_SEARCH_PAGE_SIZE = 24;

export function normalizeSearchPage(value: string | null | undefined): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 100_000 ? page : 1;
}

export function normalizeSearchPageSize(value: string | null | undefined): number {
  const size = Number(value);
  return SEARCH_PAGE_SIZES.some((allowed) => allowed === size)
    ? size
    : DEFAULT_SEARCH_PAGE_SIZE;
}

/** Up to seven numerical pages plus at most two gap separators. */
export function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  const total = Math.max(1, Math.floor(totalPages) || 1);
  const current = Math.min(Math.max(1, Math.floor(page) || 1), total);
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 2, current - 1, current, current + 1, current + 2, 'ellipsis', total];
}
