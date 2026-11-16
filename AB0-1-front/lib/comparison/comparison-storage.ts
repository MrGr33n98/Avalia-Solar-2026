import { COMPARISON_LIMITS } from './config';

/** v2 localStorage stores identifiers only. Older full-company arrays migrate on read. */
export const COMPARISON_STORAGE_KEY = 'ab01_comparison_list';

const parseCompanyId = (candidate: unknown): number | null => {
  const raw = typeof candidate === 'object' && candidate !== null
    ? (candidate as { id?: unknown }).id
    : candidate;
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const text = String(raw);
  if (!/^[1-9]\d*$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

/** Untrusted browser storage is never used as a company data source. */
export function parseStoredComparisonIds(raw: string | null): number[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const item of value) {
    const id = parseCompanyId(item);
    if (id === null || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= COMPARISON_LIMITS.desktop) break;
  }
  return result;
}

export function serializeComparisonIds(companies: ReadonlyArray<{ id: number }>): string {
  return JSON.stringify(
    [...new Set(companies.map((company) => company.id))]
      .filter((id) => Number.isSafeInteger(id) && id > 0)
      .slice(0, COMPARISON_LIMITS.desktop)
  );
}
