jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
  page: jest.fn(),
}));

import { track } from '@/lib/analytics/lazy';
import {
  trackContactClick,
  trackFaqEngagement,
  trackSearchPerformance,
} from '@/lib/analytics/consolidated';

describe('analytics/consolidated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks search performance and emits no-results event when applicable', () => {
    trackSearchPerformance('painel solar', 0);

    expect(track).toHaveBeenCalledWith('search_performance', {
      search_term: 'painel solar',
      results_count: 0,
      has_results: false,
    });
    expect(track).toHaveBeenCalledWith('search_no_results', {
      search_term: 'painel solar',
    });
  });

  it('tracks faq engagement with canonical payload', () => {
    trackFaqEngagement('vote_up', 'Como funciona o financiamento?');

    expect(track).toHaveBeenCalledWith('faq_interaction', {
      action_type: 'vote_up',
      faq_question: 'Como funciona o financiamento?',
    });
  });

  it('tracks contact clicks with canonical event names', () => {
    trackContactClick('whatsapp', { id: 42, name: 'Solar Prime' });

    expect(track).toHaveBeenCalledWith('whatsapp_click', {
      company_id: 42,
      company_name: 'Solar Prime',
      contact_type: 'whatsapp',
      content_type: 'company_contact',
    });
  });
});
