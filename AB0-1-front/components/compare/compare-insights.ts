import type { Company } from '@/lib/api';
import { CompareCompany, mapCompanyToCompareCompany } from './mapCompanyToCompareCompany';

const normalizedText = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const intersects = <T>(left: T[], right: T[]) => left.some((value) => right.includes(value));

export function parseResponseTimeMinutes(company: CompareCompany): number | null {
  if (company.slaMinutes !== null) return company.slaMinutes;
  const label = normalizedText(company.responseTimeLabel);
  if (!label) return null;
  const amount = Number(label.match(/[\d.,]+/)?.[0]?.replace(',', '.'));
  if (!Number.isFinite(amount)) return null;
  if (/min/.test(label)) return amount;
  if (/dia|day/.test(label)) return amount * 24 * 60;
  if (/h|hora/.test(label)) return amount * 60;
  return null;
}

export interface RecommendationOptions {
  selectedCompanies: CompareCompany[];
  allCompanies: Array<Company | CompareCompany>;
  city?: string | null;
  categoryIds?: number[];
  limit?: number;
}

export function getRecommendedCompanies({
  selectedCompanies,
  allCompanies,
  city,
  categoryIds,
  limit = 3,
}: RecommendationOptions): CompareCompany[] {
  const selectedIds = new Set(selectedCompanies.map((company) => company.id));
  const contextCity = normalizedText(city || selectedCompanies[0]?.city);
  const selectedCategoryIds = categoryIds?.length
    ? categoryIds
    : Array.from(new Set(selectedCompanies.flatMap((company) => company.categoryIds)));
  const selectedCategoryNames = Array.from(
    new Set(selectedCompanies.flatMap((company) => company.categoryNames.map(normalizedText)))
  );

  return allCompanies
    .map(mapCompanyToCompareCompany)
    .filter((company) => company.id > 0 && !selectedIds.has(company.id))
    .map((company) => {
      const sameCity = Boolean(contextCity && normalizedText(company.city) === contextCity);
      const sameCategory =
        intersects(company.categoryIds, selectedCategoryIds) ||
        intersects(company.categoryNames.map(normalizedText), selectedCategoryNames);
      const score =
        (sameCity ? 30 : 0) +
        (sameCategory ? 20 : 0) +
        (company.verified ? 20 : 0) +
        company.rating * 5 +
        Math.min(company.reviewsCount / 10, 20) +
        (company.premium || company.sponsored ? 10 : 0);
      return { company, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.company.rating - left.company.rating ||
        right.company.reviewsCount - left.company.reviewsCount ||
        left.company.name.localeCompare(right.company.name, 'pt-BR')
    )
    .slice(0, limit)
    .map(({ company }) => company);
}

export interface CompareSummaryItem {
  key: 'rating' | 'reviews' | 'response' | 'verified' | 'coverage';
  label: string;
  companyName: string | null;
  detail: string;
}

const bestBy = (
  companies: CompareCompany[],
  value: (company: CompareCompany) => number | null,
  direction: 'max' | 'min' = 'max'
) => {
  const candidates = companies
    .map((company) => ({ company, value: value(company) }))
    .filter((entry): entry is { company: CompareCompany; value: number } => entry.value !== null);
  return candidates.sort((a, b) => (direction === 'max' ? b.value - a.value : a.value - b.value))[0]
    ?.company;
};

export function buildCompareSummary(companies: CompareCompany[]): CompareSummaryItem[] {
  const bestRating = bestBy(companies, (company) => (company.rating > 0 ? company.rating : null));
  const mostReviews = bestBy(companies, (company) =>
    company.reviewsCount > 0 ? company.reviewsCount : null
  );
  const fastestResponse = bestBy(companies, parseResponseTimeMinutes, 'min');
  const verified = companies.find((company) => company.verified);
  const bestCoverage = bestBy(companies, (company) => {
    const count = company.coverageCities.length || company.coverageStates.length;
    return count > 0 ? count : null;
  });

  return [
    {
      key: 'rating',
      label: 'Melhor nota',
      companyName: bestRating?.name || null,
      detail: bestRating ? `${bestRating.rating.toFixed(1)} de 5` : 'Dados insuficientes',
    },
    {
      key: 'reviews',
      label: 'Mais avaliações',
      companyName: mostReviews?.name || null,
      detail: mostReviews ? `${mostReviews.reviewsCount} avaliações` : 'Dados insuficientes',
    },
    {
      key: 'response',
      label: 'Resposta mais rápida',
      companyName: fastestResponse?.name || null,
      detail: fastestResponse?.responseTimeLabel || 'Dados insuficientes',
    },
    {
      key: 'verified',
      label: 'Empresa verificada',
      companyName: verified?.name || null,
      detail: verified ? 'Selo verificado' : 'Dados insuficientes',
    },
    {
      key: 'coverage',
      label: 'Melhor cobertura',
      companyName: bestCoverage?.name || null,
      detail: bestCoverage
        ? `${bestCoverage.coverageCities.length || bestCoverage.coverageStates.length} regiões informadas`
        : 'Dados insuficientes',
    },
  ];
}

export function getBestMatch(
  companies: CompareCompany[],
  city?: string | null
): CompareCompany | null {
  if (companies.length < 2) return null;
  const contextCity = normalizedText(city);

  return [...companies].sort((left, right) => {
    const score = (company: CompareCompany) => {
      const responseMinutes = parseResponseTimeMinutes(company);
      return (
        company.rating * 10 +
        (company.verified ? 15 : 0) +
        Math.min(Math.log10(company.reviewsCount + 1) * 7.5, 15) +
        (contextCity && normalizedText(company.city) === contextCity ? 10 : 0) +
        (responseMinutes !== null ? Math.max(0, 10 - responseMinutes / 144) : 0) +
        (company.coverageCities.length || company.coverageStates.length ? 5 : 0)
      );
    };
    return score(right) - score(left) || right.rating - left.rating;
  })[0];
}
