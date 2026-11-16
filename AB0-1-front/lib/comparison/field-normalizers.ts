/**
 * Canonical presentation of company-declared availability and warranty terms.
 * A free-form string must never be considered positive via substring matching:
 * "não oferece" includes "oferece", and "indisponível" includes "disponível".
 *
 * Keep the unknown state distinct from an explicit negative answer.
 */
export type CommercialAvailabilityState = 'offered' | 'not_offered' | 'consult' | 'unknown';

const normalized = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const NEGATIVE_VALUES = new Set([
  'not offered', 'not available', 'unavailable', 'false', 'no', 'nao',
  'nao oferece', 'nao oferecido', 'nao disponivel', 'indisponivel',
  'sem financiamento', 'sem manutencao', 'sem suporte',
  'nao oferece suporte', 'nao oferece manutencao',
]);

const POSITIVE_VALUES = new Set([
  'offered', 'available', 'true', 'yes', 'sim',
  'oferece', 'oferecido', 'disponivel', 'possui',
  'oferece suporte', 'oferece manutencao',
]);

const CONSULT_VALUES = new Set(['consult', 'consultar', 'sob consulta', 'a consultar']);

/** Unknown/legacy text is neutral, not an affirmative claim. */
export function normalizeCommercialAvailability(value: unknown): CommercialAvailabilityState {
  if (typeof value === 'boolean') return value ? 'offered' : 'not_offered';
  if (typeof value !== 'string' || !value.trim()) return 'unknown';

  const key = normalized(value);
  if (NEGATIVE_VALUES.has(key)) return 'not_offered';
  if (CONSULT_VALUES.has(key)) return 'consult';
  if (POSITIVE_VALUES.has(key)) return 'offered';
  return 'unknown';
}

export function availabilityLabel(
  state: CommercialAvailabilityState,
  offeredLabel: string
): string {
  switch (state) {
    case 'offered': return offeredLabel;
    case 'not_offered': return 'Não oferece';
    case 'consult': return 'Consultar';
    default: return 'Não informado';
  }
}

export interface WarrantyPresentation {
  value: string | null;
  provenance: 'company_declared' | 'unconfirmed' | 'unknown';
}

/**
 * warranty_confirmed is a company checkbox, NOT platform verification.
 * A numeric year value must never imply that documents were validated.
 */
export function presentCompanyWarranty(
  years: unknown,
  confirmed: unknown
): WarrantyPresentation {
  const n = typeof years === 'number'
    ? years
    : typeof years === 'string' && years.trim() ? Number(years) : NaN;

  if (!Number.isFinite(n) || n <= 0) {
    return { value: null, provenance: 'unknown' };
  }

  return {
    value: `${n} ${n === 1 ? 'ano' : 'anos'}`,
    provenance: confirmed === true ? 'company_declared' : 'unconfirmed',
  };
}

export function companyWarrantyLabel(
  years: unknown,
  confirmed: unknown
): string | null {
  const warranty = presentCompanyWarranty(years, confirmed);
  if (!warranty.value) return null;
  return warranty.provenance === 'company_declared'
    ? `${warranty.value} (declarada pela empresa)`
    : `${warranty.value} (não confirmada)`;
}
