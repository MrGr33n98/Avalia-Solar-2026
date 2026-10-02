export type QuoteWizardOpenPayload = {
  preferredCompanyId?: number;
  categoryId?: number;
  source?: string;
  decisionContext?: Record<string, unknown>;
};

export const openQuoteWizard = (payload: QuoteWizardOpenPayload = {}) => {
  if (typeof window === 'undefined') return;
  const target = window as Window & { __avaliaPendingQuoteWizard?: QuoteWizardOpenPayload };
  target.__avaliaPendingQuoteWizard = payload;
  window.dispatchEvent(new CustomEvent('open-quote-wizard', { detail: payload }));
};
