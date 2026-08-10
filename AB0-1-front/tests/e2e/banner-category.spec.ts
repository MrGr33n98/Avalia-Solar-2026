import { test, expect } from '@playwright/test';

const slug = process.env.E2E_CATEGORY_SLUG ?? '';

const bannerPayload = [
  {
    id: 901,
    title: 'Patrocinado categoria',
    image_url: '/images/banner-placeholder.svg',
    link_url: 'https://example.com/oferta',
    position: 'categories_filter_sidebar',
    sponsored: true,
    active: true,
    category_ids: [],
  },
];

test.describe('Grid de publicidade em categorias', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!slug, 'E2E_CATEGORY_SLUG ausente');
    await page.route('**/api/v1/banners**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bannerPayload),
      });
    });
    await page.route('**/api/v1/banner_events**', async (route) => {
      await route.fulfill({ status: 202, body: JSON.stringify({ accepted: true }) });
    });
  });

  test('mostra rail desktop sem overflow e mantém slot mobile fora da viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/categories/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('category-ads-rail')).toBeVisible();
    await expect(page.getByTestId('category-filter-banner-mobile')).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });

  test('mostra fallback mobile e não renderiza rail desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/categories/${slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('category-filter-banner-mobile')).toBeVisible();
    await expect(page.getByTestId('category-ads-rail')).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });
});
