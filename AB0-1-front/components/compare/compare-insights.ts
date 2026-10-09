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

export const isFinanceCompany = (
  company:
    | CompareCompany
    | Company
    | { name: string; categoryNames?: string[]; category_ids?: unknown[]; categoryIds?: unknown[] }
): boolean => {
  const name = normalizedText(company.name);
  if (/\b(banco|financeira|credito|financiamento|bmg|safra|santander|itau|bradesco)\b/.test(name)) {
    return true;
  }
  const categoryNames =
    'categoryNames' in company && Array.isArray(company.categoryNames)
      ? company.categoryNames.map(normalizedText)
      : [];
  if (categoryNames.some((cat) => /financiamento|banco|credito/.test(cat))) {
    return true;
  }
  const categoryIds =
    'categoryIds' in company && Array.isArray(company.categoryIds)
      ? company.categoryIds
      : 'category_ids' in company && Array.isArray((company as { category_ids?: unknown[] }).category_ids)
        ? (company as { category_ids?: unknown[] }).category_ids!
        : [];
  return categoryIds.includes(5) || categoryIds.includes('5');
};

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
  const hasFinanceSelected = selectedCompanies.some(isFinanceCompany);

  return allCompanies
    .map(mapCompanyToCompareCompany)
    .filter((company) => {
      if (company.id <= 0 || selectedIds.has(company.id)) return false;
      // Não recomendar bancos ou financeiras se o usuário está comparando empresas do setor solar
      if (!hasFinanceSelected && isFinanceCompany(company)) return false;
      return true;
    })
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

export type BestMatchCompany = CompareCompany & {
  matchFactors?: string[];
};

export function getBestMatch(
  companies: CompareCompany[],
  city?: string | null
): BestMatchCompany | null {
  if (companies.length < 2) return null;
  const contextCity = normalizedText(city);

  const scored = companies.map((company) => {
    const responseMinutes = parseResponseTimeMinutes(company);
    const coverageCount = company.coverageCities.length || company.coverageStates.length;
    const factors: string[] = [];

    let score = 0;
    if (company.rating > 0) {
      score += company.rating * 10;
      factors.push('nota');
    }
    if (company.verified) {
      score += 15;
      factors.push('verificação');
    }
    if (company.reviewsCount > 0) {
      score += Math.min(Math.log10(company.reviewsCount + 1) * 7.5, 15);
      if (!factors.includes('nota')) factors.push('avaliações');
    }
    if (coverageCount > 0) {
      score += 5;
      factors.push('cobertura');
    }
    if (responseMinutes !== null) {
      score += Math.max(0, 10 - responseMinutes / 144);
      factors.push('tempo de resposta');
    }
    if (contextCity && normalizedText(company.city) === contextCity) {
      score += 10;
    }

    return { company, score, factors };
  });

  // Se nenhuma empresa tiver dados mínimos mensuráveis (score 0), não inventa melhor match
  const maxScore = Math.max(...scored.map((s) => s.score));
  if (maxScore <= 0) return null;

  scored.sort((left, right) => right.score - left.score || right.company.rating - left.company.rating);

  const best = scored[0];
  const second = scored[1];

  // Se o primeiro e o segundo empatarem em zero ou não houver dados distintivos
  if (best.score === second?.score && best.factors.length === 0) {
    return null;
  }

  return {
    ...best.company,
    matchFactors: best.factors,
  };
}
