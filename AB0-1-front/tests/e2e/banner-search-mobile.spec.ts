import { test, expect } from '@playwright/test';

const bannerPayload = [
  {
    id: 902,
    title: 'Oferta patrocinada na busca',
    alt_text: 'Oferta de energia solar',
    image_url: '/images/banner-placeholder.svg',
    link_url: 'https://example.com/oferta',
    position: 'search_top',
    sponsored: true,
    active: true,
    width: 1200,
    height: 180,
  },
];

test.describe('Placement search_top em viewport mobile', () => {
  test('renderiza banner, registra impressão e não cria overflow', async ({ page }) => {
    const impressionRequests: string[] = [];

    await page.route('**/api/v1/banners**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bannerPayload),
      });
    });
    await page.route('**/api/v1/banner_events**', async (route) => {
      impressionRequests.push(route.request().postData() || '');
      await route.fulfill({ status: 202, body: JSON.stringify({ accepted: true }) });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/search?q=solar', { waitUntil: 'domcontentloaded' });

    await expect(page.getByAltText('Oferta de energia solar')).toBeVisible();
    await expect.poll(() => impressionRequests.length).toBeGreaterThan(0);
    expect(impressionRequests.join('\n')).toContain('search_top');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });
});
