export type LeadEnginePayload = {
  preferredCompanyId?: number;
  categoryId?: number;
  source?: string;
  type?: 'wizard' | 'quick';
};

export const openLeadModal = (payload: LeadEnginePayload = { type: 'quick' }) => {
  if (typeof window === 'undefined') return;
  
  if (payload.type === 'wizard') {
    window.dispatchEvent(new CustomEvent('open-dynamic-lead-wizard', { detail: payload }));
  } else {
    window.dispatchEvent(new CustomEvent('open-quick-lead', { detail: payload }));
  }
};

type WizardCategoryCandidate = {
  id: number;
  name?: string;
  seo_url?: string;
};

type CompanyCategorySource = {
  category_id?: number;
  category_info?: WizardCategoryCandidate | null;
  categories?: WizardCategoryCandidate[];
};

export const resolveWizardCategoryId = (company?: CompanyCategorySource | null): number | undefined => {
  if (!company) return undefined;

  const candidates = [
    ...(Array.isArray(company.categories) ? company.categories : []),
    ...(company.category_info ? [company.category_info] : []),
  ].filter((category): category is WizardCategoryCandidate => Number.isFinite(category?.id));

  const financingCategory = candidates.find((category) => {
    const name = `${category.name || ''} ${category.seo_url || ''}`.toLowerCase();
    return name.includes('financiamento') || name.includes('financing');
  });

  return (
    financingCategory?.id ||
    company.category_info?.id ||
    company.category_id ||
    candidates[0]?.id
  );
};
