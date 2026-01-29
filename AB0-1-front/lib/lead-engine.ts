export type LeadEnginePayload = {
  preferredCompanyId?: number;
  source?: string;
  type?: 'wizard' | 'quick';
};

export const openLeadModal = (payload: LeadEnginePayload = { type: 'quick' }) => {
  if (typeof window === 'undefined') return;
  
  if (payload.type === 'wizard') {
    window.dispatchEvent(new CustomEvent('open-quote-wizard', { detail: payload }));
  } else {
    window.dispatchEvent(new CustomEvent('open-quick-lead', { detail: payload }));
  }
};
