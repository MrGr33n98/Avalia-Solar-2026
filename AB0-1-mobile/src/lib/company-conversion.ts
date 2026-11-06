// Shared native-app conversion gate. The public CompanySerializer must provide
// an authoritative, paid-plan-backed effective decision. Missing fields fail closed.
export type NativeCompanyConversion = {
  has_paid_plan?: boolean | null;
  cta_visibility?: {
    effective?: { quote?: boolean | null; whatsapp?: boolean | null } | null;
  } | null;
};

export function canRequestCompanyQuote(company?: NativeCompanyConversion | null): boolean {
  return company?.has_paid_plan === true &&
    company.cta_visibility?.effective?.quote === true;
}
export function canContactCompanyWhatsApp(company?: NativeCompanyConversion | null): boolean {
  return company?.has_paid_plan === true &&
    company.cta_visibility?.effective?.whatsapp === true;
}
