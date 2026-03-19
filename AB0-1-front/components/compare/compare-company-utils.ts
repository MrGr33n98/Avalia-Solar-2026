import { Company } from '@/lib/api';

export type CompanySignalTone = 'blue' | 'emerald' | 'amber' | 'violet';

export interface CompanySignal {
  key: string;
  label: string;
  tone: CompanySignalTone;
}

export function isPremiumCompany(company: Company): boolean {
  return Boolean(company.featured || company.plan_status === 'active' || company.has_paid_plan);
}

export function getCompanyTrustScore(company: Company): number | null {
  const score = company.trust_score ?? company.trust_health?.trust_score;

  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getCompanyYearsInMarket(company: Company): number | null {
  if (typeof company.founded_year !== 'number' || !Number.isFinite(company.founded_year)) {
    return null;
  }

  const years = new Date().getFullYear() - company.founded_year;
  return years >= 0 ? years : null;
}

export function formatCompanyYears(company: Company): string | null {
  const years = getCompanyYearsInMarket(company);

  if (years === null) {
    return null;
  }

  return years > 0 ? `${years} anos` : `Desde ${company.founded_year}`;
}

export function formatCurrencyBRL(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCompanySignals(company: Company): CompanySignal[] {
  const signals: CompanySignal[] = [];
  const yearsLabel = formatCompanyYears(company);
  const badgesCount = company.badges?.filter((badge) => badge?.name || badge?.image_url).length ?? 0;

  if (company.verified) {
    signals.push({ key: 'verified', label: 'Verificada', tone: 'emerald' });
  }

  if (company.financing_enabled) {
    signals.push({ key: 'financing', label: 'Financiamento', tone: 'blue' });
  }

  if (company.response_time_sla) {
    signals.push({ key: 'sla', label: company.response_time_sla, tone: 'blue' });
  }

  if (yearsLabel) {
    signals.push({ key: 'years', label: yearsLabel, tone: 'amber' });
  }

  if (badgesCount > 0) {
    signals.push({
      key: 'badges',
      label: `${badgesCount} selo${badgesCount > 1 ? 's' : ''}`,
      tone: 'violet',
    });
  }

  return signals;
}
