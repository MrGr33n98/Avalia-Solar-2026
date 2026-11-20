import { expect, test } from '@playwright/test';

const companies = Array.from({ length: 12 }, (_, index) => ({
  id: 5000 + index,
  name: index === 0
    ? 'Cooperativa Regional de Energia Solar Fotovoltaica e Soluções Sustentáveis'
    : `Integradora Solar ${index + 1}`,
  slug: `e2e-solar-${index + 1}`,
  status: 'active',
  city: index % 2 ? 'São Paulo' : 'Florianópolis',
  state: index % 2 ? 'SP' : 'SC',
  category_name: 'Energia Solar',
  rating_avg: 4.5,
  rating_count: 15,
  verified: false,
}));

test('comparison compact grid: 8 recommendations, touch geometry, responsive PWA and desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Run responsive geometry once in Chromium.');
  await page.route(/\/companies\?.*/, async (route) => {
    // Docker test frontend can call a cross-origin backend; mock CORS preflight as well.
    const origin = route.request().headers().origin || 'http://localhost:3000';
    const headers = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    await route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(companies) });
  });

  await page.goto('/compare', { waitUntil: 'domcontentloaded' });
  const grid = page.getByTestId('compare-recommendations-grid');
  const cards = grid.getByTestId('compare-recommendation-card');
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toContainText('Cooperativa Regional');

  for (const width of [320, 360, 375, 390, 414, 430, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(cards).toHaveCount(8);
    const geometry = await grid.evaluate((element) => {
      const items = [...element.querySelectorAll('[data-testid="compare-recommendation-card"]')] as HTMLElement[];
      const boxes = items.map((item) => item.getBoundingClientRect());
      const buttons = items.map((item) => item.querySelector('button')!.getBoundingClientRect());
      return {
        firstTop: boxes[0].top,
        secondTop: boxes[1].top,
        firstBottom: boxes[0].bottom,
        secondLeft: boxes[1].left,
        firstRight: boxes[0].right,
        buttons: buttons.map((button) => ({ width: button.width, height: button.height })),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        clipped: items.some((item) => item.scrollWidth > item.clientWidth + 2),
      };
    });
    expect(geometry.overflow, `Horizontal overflow at ${width}px`).toBe(false);
    expect(geometry.clipped, `Card content overflow at ${width}px`).toBe(false);
    for (const button of geometry.buttons) {
      expect(button.height, `Touch target height at ${width}px`).toBeGreaterThanOrEqual(44);
      expect(button.width, `Touch target width at ${width}px`).toBeGreaterThanOrEqual(44);
    }
    if (width < 1280) {
      expect(Math.abs(geometry.firstTop - geometry.secondTop), `Expected 2 columns at ${width}px`).toBeLessThanOrEqual(2);
      expect(geometry.secondLeft, `Expected side-by-side cards at ${width}px`).toBeGreaterThan(geometry.firstRight);
    } else {
      expect(geometry.secondTop, 'Desktop sidebar must use a single readable column').toBeGreaterThanOrEqual(geometry.firstBottom);
    }
    if (width === 390 || width === 1280) {
      await testInfo.attach(`compare-grid-${width}px`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  }

  await page.setViewportSize({ width: 390, height: 900 });
  await cards.first().getByRole('button', { name: /Adicionar Cooperativa Regional/i }).click();
  await expect(page.getByText(/1 de 2/)).toBeVisible();
});
