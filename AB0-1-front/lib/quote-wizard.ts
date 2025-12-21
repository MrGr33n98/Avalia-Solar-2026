export type QuoteWizardOpenPayload = {
  preferredCompanyId?: number;
  source?: string;
};

export const openQuoteWizard = (payload: QuoteWizardOpenPayload = {}) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('open-quote-wizard', { detail: payload }));
};
