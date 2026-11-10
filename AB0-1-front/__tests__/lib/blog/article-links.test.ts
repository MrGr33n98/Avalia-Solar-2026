import { buildArticleLink } from '@/lib/blog/article-links';

jest.mock('@/lib/analytics/utm', () => ({
  getCurrentUTMs: () => ({
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'solar-2026',
  }),
}));

describe('links internos de artigo', () => {
  it('não injeta UTM interna nem sobrescreve aquisição externa', () => {
    const result = buildArticleLink({
      slugOrId: 'como-escolher-uma-empresa',
      placement: 'related_article',
      source: 'blog',
      medium: 'internal',
      campaign: 'blog_article',
    });

    expect(result.url).toBe('/blog/como-escolher-uma-empresa');
    expect(result.url).not.toContain('utm_');
    expect(result.utm).toEqual(
      expect.objectContaining({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'solar-2026',
      })
    );
    expect(result.internalPromotion).toEqual(
      expect.objectContaining({
        internal_promotion_id: 'blog:como-escolher-uma-empresa',
        placement: 'related_article',
      })
    );
  });
});
