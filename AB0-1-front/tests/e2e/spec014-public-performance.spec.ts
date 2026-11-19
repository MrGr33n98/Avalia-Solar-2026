import { test, expect } from '@playwright/test';

// Real server/DB/API are needed: never report a skipped E2E as validation.
test.skip(process.env.PERF_E2E_LIVE !== '1', 'Requires stable running public API; set PERF_E2E_LIVE=1');

test.describe('Spec 014 public first render', () => {
  for (const path of ['/companies', '/search?q=solar', '/products']) {
    test(`server returns meaningful HTML without JavaScript: ${path}`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      try {
        const page = await context.newPage();
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
        expect(response?.status()).toBe(200);
        const bodyText = await page.locator('body').innerText();
        expect(bodyText.trim().length).toBeGreaterThan(150);
        expect(bodyText).not.toContain('Application error');
        // These checks complement API-backed card paint tests and Lighthouse.
      } finally {
        await context.close();
      }
    });
  }

  test('does not request Leaflet assets before map intent', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (r) => { if (/\.(?:js|css)(?:\?|$)/.test(r.url())) scripts.push(r.url()); });
    await page.goto('/companies', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    expect(scripts.some((url) => /leaflet|MapProvider|SearchMapPanel/i.test(url))).toBe(false);
  });

  test('company hero remains available independently from JSON-LD reviews', async ({ page }) => {
    const response = await page.goto('/companies/weg', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('#company-profile-compound-hero')).toBeVisible();
    await expect(page.locator('#company-profile-shell')).toBeVisible();
  });
});


test.describe('Spec 014 mobile, accessibility and failure recovery', () => {
  for (const width of [320, 375, 390]) {
    test(`public routes do not horizontally overflow viewport ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const route of ['/search?q=solar', '/companies', '/products', '/companies/weg']) {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), route).toBe(200);
        await page.locator('body').waitFor({ state: 'visible' });
        const dimensions = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth,
        }));
        expect(dimensions.scroll, `Overflow on ${route} at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
      }
    });
  }

  test('public cards are server-visible without hydration', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto('/companies', { waitUntil: 'domcontentloaded' });
      const cards = page.locator('[data-testid="companies-list"] article, [data-testid="companies-grid"] [data-testid="company-card"]');
      // This is intentionally strict: shell-only HTML does not satisfy US1.
      expect(await cards.count()).toBeGreaterThan(0);
      await page.goto('/products', { waitUntil: 'domcontentloaded' });
      expect(await page.locator('main article[itemtype="https://schema.org/Product"]').count()).toBeGreaterThan(0);
    } finally {
      await context.close();
    }
  });

  test('review API failure does not remove company hero', async ({ page }) => {
    await page.route(/\/api\/v1\/reviews(?:\?|$)/, (route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'temporary-unavailable' }),
    }));
    await page.goto('/companies/weg', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#company-profile-compound-hero')).toBeVisible();
    await expect(page.locator('#company-profile-shell')).toBeVisible();
  });

  test('keyboard users can navigate visible company directory controls', async ({ page }) => {
    await page.goto('/companies', { waitUntil: 'domcontentloaded' });
    const searchInput = page.getByPlaceholder('Buscar empresas...');
    await expect(searchInput).toBeVisible();
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
    await page.keyboard.type('solar');
    await expect(searchInput).toHaveValue('solar');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/companies(?:\?|\/)/);
  });
});
