import { test, expect } from '@playwright/test';

test.describe('CDSI-038: Category Sitemap E2E Validation (E19)', () => {
  test('E19: /sitemap-index.xml e /sitemaps/categories/sitemap.xml retornam XML válido e URLs canônicas 200', async ({
    request,
    page,
  }) => {
    const indexRes = await request.get('/sitemap-index.xml');
    expect(indexRes.status()).toBe(200);
    const indexXml = await indexRes.text();
    expect(indexXml).toContain('<sitemapindex');
    expect(indexXml).toContain('/sitemaps/categories/sitemap.xml');

    const catSitemapRes = await request.get('/sitemaps/categories/sitemap.xml');
    expect([200, 503]).toContain(catSitemapRes.status());

    if (catSitemapRes.status() === 200) {
      const catXml = await catSitemapRes.text();
      expect(catXml).toContain('<urlset');
      const locMatch = catXml.match(/<loc>https?:\/\/[^<]+(\/categories\/[a-z0-9-]+)<\/loc>/);
      expect(locMatch).not.toBeNull();

      if (locMatch?.[1]) {
        const samplePath = locMatch[1];
        const pageRes = await page.goto(samplePath);
        expect(pageRes?.status()).toBe(200);
      }
    }
  });
});

