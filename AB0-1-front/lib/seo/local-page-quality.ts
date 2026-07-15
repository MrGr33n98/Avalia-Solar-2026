export const LOCAL_PAGE_MIN_COMPANIES = 3;

type LocalPageQualityOptions = {
  hasSearchParams?: boolean;
  minCompanies?: number;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const getRecord = (record: UnknownRecord, key: string) => {
  const value = record[key];
  return isRecord(value) ? value : undefined;
};

const getString = (record: UnknownRecord | undefined, key: string) => {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const getNumber = (record: UnknownRecord | undefined, key: string) => {
  if (!record) return undefined;
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : undefined;
};

const getBoolean = (record: UnknownRecord | undefined, key: string) => {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
};

function localCompanyCount(record: UnknownRecord): number {
  const stats = getRecord(record, 'stats');
  const statsTotal = getNumber(stats, 'total_companies');
  if (statsTotal !== undefined) return statsTotal;

  const companies = record.companies;
  return Array.isArray(companies) ? companies.length : 0;
}

function hasLocalContext(location: UnknownRecord | undefined): boolean {
  const scope = getString(location, 'scope');
  const state = getString(location, 'state');
  const stateName = getString(location, 'state_name');
  const city = getString(location, 'city');

  if (scope === 'city') return Boolean(city && state);
  if (scope === 'state') return Boolean(state || stateName);

  return Boolean(state || stateName || city);
}

export function isLocalPageIndexable(
  input: unknown,
  options: LocalPageQualityOptions = {}
): boolean {
  if (!isRecord(input) || options.hasSearchParams) return false;

  const seo = getRecord(input, 'seo');
  const location = getRecord(input, 'location');
  const minCompanies = options.minCompanies || LOCAL_PAGE_MIN_COMPANIES;
  const canonicalPath = getString(location, 'canonical_path');

  return (
    getBoolean(seo, 'indexable') === true &&
    localCompanyCount(input) >= minCompanies &&
    Boolean(getString(seo, 'title')) &&
    Boolean(getString(seo, 'description')) &&
    Boolean(canonicalPath?.startsWith('/companies/')) &&
    hasLocalContext(location)
  );
}
