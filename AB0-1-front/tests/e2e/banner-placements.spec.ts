import { test, expect } from '@playwright/test';

const smokeEnabled = process.env.E2E_PLACEMENT_SMOKE === 'true';

const navbarBanner = {
  id: 990,
  title: 'Oferta patrocinada no topo',
  alt_text: 'Oferta de energia solar',
  image_url: '/images/banner-placeholder.svg',
  link_url: 'https://example.com/oferta',
  position: 'navbar',
  sponsored: true,
  active: true,
};

test.describe('Placements comerciais ativos', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!smokeEnabled, 'E2E_PLACEMENT_SMOKE não habilitado');
    await page.route('**/banners**', async (route) => {
      const url = new URL(route.request().url());
      const requestedPosition = url.searchParams.get('position');
      const payload = ['navbar', 'home_top'].includes(requestedPosition || '')
        ? [navbarBanner]
        : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });
    await page.route('**/api/v1/banner_events**', async (route) => {
      await route.fulfill({ status: 202, body: JSON.stringify({ accepted: true }) });
    });
  });

  test('renderiza o slot navbar no desktop e preserva o viewport mobile', async ({ page }) => {
    const events: Array<{ event_type?: string; banner_id?: number }> = [];
    await page.route('**/api/v1/banner_events**', async (route) => {
      const body = route.request().postDataJSON();
      events.push(body?.banner_event || body || {});
      await route.fulfill({ status: 202, body: JSON.stringify({ accepted: true }) });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const slot = page.getByLabel('Publicidade no topo');
    await expect(slot).toBeVisible();
    await expect(slot.getByRole('link')).toHaveAttribute('href', /banner_clicks\/990/);
    await expect
      .poll(() => events.filter((event) => event.event_type === 'impression'))
      .toHaveLength(1);

    const clickPromise = page.waitForRequest('**/api/v1/banner_clicks/990');
    await slot.getByRole('link', { name: /Patrocinado:/ }).click();
    await clickPromise;
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event_type: 'impression', banner_id: 990 }),
      ])
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(slot).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });
});
