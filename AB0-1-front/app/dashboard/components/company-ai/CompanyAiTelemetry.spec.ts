import { resolveEventContract } from '@/lib/analytics/contract';

describe('Company AI analytics governance', () => {
  it('requires tenant and correlation identifiers for result display', () => {
    expect(resolveEventContract('company_ai_answer_rendered', {
      company_id: 123, session_correlation_id: 'opaque', request_id: 'request_abc'
    }).valid).toBe(true);
    expect(resolveEventContract('company_ai_answer_rendered', { company_id: 123 }).missing)
      .toEqual(expect.arrayContaining(['session_correlation_id', 'request_id']));
  });

  it('treats opening a widget as product usage, not a settled billable fact', () => {
    const contract = resolveEventContract('company_ai_widget_opened', {
      company_id: 123, surface_id: 'brand_page_ai'
    });
    expect(contract.owner).toBe('product');
    expect(contract.kind).toBe('microconversion');
  });
});
