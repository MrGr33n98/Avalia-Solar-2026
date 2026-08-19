import { opaqueUserId, sanitizeAnalyticsProperties } from '@/lib/analytics/sanitize';

describe('analytics sanitizer', () => {
  it('removes nested PII and free text while keeping metrics and enums', () => {
    expect(
      sanitizeAnalyticsProperties({
        email: 'buyer@example.com',
        search_term: 'me ligue 11999999999',
        vertical: 'solar',
        score: 87,
        nested: { phone: '11999999999', category_id: 12 },
        rows: [{ name: 'Maria', company_id: 3 }],
      })
    ).toEqual({
      vertical: 'solar',
      score: 87,
      nested: { category_id: 12 },
      rows: [{ company_id: 3 }],
    });
  });

  it('removes query strings from tracked URLs', () => {
    expect(
      sanitizeAnalyticsProperties({
        page_url: 'https://www.avaliasolar.com.br/search?q=maria@example.com#results',
      })
    ).toEqual({
      page_url: 'https://www.avaliasolar.com.br/search',
    });
  });

  it('prefixes authenticated user ids once', () => {
    expect(opaqueUserId(42)).toBe('user_42');
    expect(opaqueUserId('user_42')).toBe('user_42');
  });
});
