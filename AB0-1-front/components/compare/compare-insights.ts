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
  isTie?: boolean;
  isBothVerified?: boolean;
  winnerCompany?: CompareCompany | null;
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
  // 1. Verificação
  const verifiedCompanies = companies.filter((c) => c.verified);
  const isBothVerified =
    verifiedCompanies.length > 1 && verifiedCompanies.length === companies.length;
  let verifiedItem: CompareSummaryItem;
  if (isBothVerified) {
    verifiedItem = {
      key: 'verified',
      label: 'Verificação',
      companyName: 'Ambas',
      detail: 'Ambas verificadas',
      isTie: true,
      isBothVerified: true,
      winnerCompany: null,
    };
  } else if (verifiedCompanies.length === 1) {
    const verified = verifiedCompanies[0];
    verifiedItem = {
      key: 'verified',
      label: 'Verificação',
      companyName: verified.name,
      detail: `${verified.name} ✓`,
      isBothVerified: false,
      winnerCompany: verified,
    };
  } else {
    verifiedItem = {
      key: 'verified',
      label: 'Verificação',
      companyName: null,
      detail: 'Nenhuma verificada',
    };
  }

  // 2. Cobertura
  const coverageList = companies
    .map((c) => ({
      company: c,
      count: c.coverageCities.length || c.coverageStates.length,
      isNationwide: c.coverageStates.length >= 26 || /brasil/i.test(c.state || ''),
    }))
    .filter((e) => e.count > 0 || e.isNationwide);

  let coverageItem: CompareSummaryItem;
  if (coverageList.length === 0) {
    coverageItem = {
      key: 'coverage',
      label: 'Cobertura',
      companyName: null,
      detail: 'Dados insuficientes',
    };
  } else {
    coverageList.sort((a, b) => {
      if (a.isNationwide && !b.isNationwide) return -1;
      if (!a.isNationwide && b.isNationwide) return 1;
      return b.count - a.count;
    });

    const first = coverageList[0];
    const second = coverageList[1];
    const isTie =
      coverageList.length > 1 &&
      ((first.isNationwide && second?.isNationwide) || first.count === second?.count);

    if (isTie) {
      const regionText = first.isNationwide
        ? 'Brasil'
        : `${first.count} ${first.count === 1 ? 'região' : 'regiões'}`;
      coverageItem = {
        key: 'coverage',
        label: 'Cobertura',
        companyName: 'Empate',
        detail: `Empate · ${regionText}`,
        isTie: true,
      };
    } else {
      const regionText = first.isNationwide
        ? 'Brasil'
        : `${first.count} ${first.count === 1 ? 'região' : 'regiões'}`;
      coverageItem = {
        key: 'coverage',
        label: 'Cobertura',
        companyName: first.company.name,
        detail: `${first.company.name} · ${regionText}`,
        winnerCompany: first.company,
      };
    }
  }

  // 3. Avaliação
  const rated = companies
    .filter((c) => c.rating > 0)
    .sort((a, b) => b.rating - a.rating);

  let ratingItem: CompareSummaryItem;
  if (rated.length === 0) {
    ratingItem = {
      key: 'rating',
      label: 'Avaliação',
      companyName: null,
      detail: 'Dados insuficientes',
    };
  } else if (rated.length > 1 && rated[0].rating === rated[1].rating) {
    ratingItem = {
      key: 'rating',
      label: 'Avaliação',
      companyName: 'Empate',
      detail: `Empate · ${rated[0].rating.toFixed(1).replace('.', ',')}/5`,
      isTie: true,
    };
  } else {
    const winner = rated[0];
    ratingItem = {
      key: 'rating',
      label: 'Avaliação',
      companyName: winner.name,
      detail: `${winner.name} · ${winner.rating.toFixed(1).replace('.', ',')}/5`,
      winnerCompany: winner,
    };
  }

  // 4. Resposta
  const responsive = companies
    .map((c) => ({ company: c, minutes: parseResponseTimeMinutes(c) }))
    .filter((e): e is { company: CompareCompany; minutes: number } => e.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes);

  let responseItem: CompareSummaryItem;
  if (responsive.length === 0) {
    responseItem = {
      key: 'response',
      label: 'Resposta',
      companyName: null,
      detail: 'Dados insuficientes',
    };
  } else if (responsive.length > 1 && responsive[0].minutes === responsive[1].minutes) {
    const label = responsive[0].company.responseTimeLabel || 'Mesmo prazo';
    responseItem = {
      key: 'response',
      label: 'Resposta',
      companyName: 'Empate',
      detail: `Empate · ${label}`,
      isTie: true,
    };
  } else {
    const winner = responsive[0].company;
    const label = winner.responseTimeLabel || 'Mais rápida';
    responseItem = {
      key: 'response',
      label: 'Resposta',
      companyName: winner.name,
      detail: `${winner.name} · ${label}`,
      winnerCompany: winner,
    };
  }

  // 5. Mais avaliações (mantido para compatibilidade)
  const mostReviews = bestBy(companies, (company) =>
    company.reviewsCount > 0 ? company.reviewsCount : null
  );
  const reviewsItem: CompareSummaryItem = {
    key: 'reviews',
    label: 'Mais avaliações',
    companyName: mostReviews?.name || null,
    detail: mostReviews ? `${mostReviews.reviewsCount} avaliações` : 'Dados insuficientes',
  };

  return [verifiedItem, coverageItem, ratingItem, responseItem, reviewsItem];
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
