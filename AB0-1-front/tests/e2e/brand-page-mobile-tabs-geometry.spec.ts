import { expect, test } from '@playwright/test';

const companySlug = 'e2e-banner-free';
const mobileWidths = [320, 360, 375, 390, 414, 480, 640, 767];

test('Brand Page V2 chips preserve a single line, 36px surfaces and no document overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Responsive geometry runs once in Chromium.');
  const response = await page.goto(`/companies/${companySlug}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), 'E2E company fixture must be available').toBeLessThan(400);

  const tabs = page.getByTestId('company-mobile-tablist');
  await expect(tabs).toBeVisible();

  for (const width of mobileWidths) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = await tabs.evaluate((rail) => {
      const scroller = rail.parentElement as HTMLElement;
      const buttons = Array.from(rail.querySelectorAll<HTMLElement>('[role="tab"]'));
      const surfaces = buttons.map((button) => button.querySelector<HTMLElement>('[data-testid="company-mobile-tab-surface"]')!);
      const labels = buttons.map((button) => button.querySelector<HTMLElement>('[data-testid="company-mobile-tab-label"]')!);
      const icons = surfaces.map((surface) => surface.querySelector<SVGElement>('svg')!);
      const rects = (elements: Element[]) => elements.map((element) => element.getBoundingClientRect());

      return {
        count: buttons.length,
        iconRects: rects(icons).map((r) => ({ top: r.top })),
        labelRects: rects(labels).map((r) => ({ top: r.top })),
        surfaceRects: rects(surfaces).map((r) => ({ top: r.top, height: r.height })),
        tabRects: rects(buttons).map((r) => ({ top: r.top, height: r.height })),
        styles: labels.map((label) => ({
          whiteSpace: getComputedStyle(label).whiteSpace,
          overflowWrap: getComputedStyle(label).overflowWrap,
          clipped: label.scrollWidth > label.clientWidth + 1,
        })),
        scrollerWidth: scroller.clientWidth,
        documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      };
    });

    expect(metrics.count, `Missing tabs at ${width}px`).toBeGreaterThanOrEqual(3);
    expect(metrics.documentOverflow, `Body overflow at ${width}px`).toBe(false);
    expect(metrics.scrollerWidth, `Scroller exceeds viewport at ${width}px`).toBeLessThanOrEqual(width);
    for (const label of metrics.styles) {
      expect(label.whiteSpace, `Label wrapped at ${width}px`).toBe('nowrap');
      expect(label.overflowWrap, `Unexpected word wrapping at ${width}px`).toBe('normal');
      expect(label.clipped, `Label clipped at ${width}px`).toBe(false);
    }
    for (const rectangles of [metrics.iconRects, metrics.labelRects, metrics.surfaceRects, metrics.tabRects]) {
      const tops = rectangles.map((rect) => rect.top);
      expect(Math.max(...tops) - Math.min(...tops), `Vertical misalignment at ${width}px`).toBeLessThanOrEqual(1);
    }
    metrics.tabRects.forEach((rect) => expect(rect.height).toBe(44));
    metrics.surfaceRects.forEach((rect) => expect(rect.height).toBe(36));

    // Only the rail may scroll; all entitled tabs remain reachable.
    await tabs.evaluate((rail) => {
      const scroller = rail.parentElement as HTMLElement;
      scroller.scrollLeft = scroller.scrollWidth;
    });
    await expect(tabs.getByRole('tab').last()).toBeInViewport();
  }
});

test('FAQ filter V2 keeps 32px pill surfaces and stable labels after selection', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Responsive geometry runs once in Chromium.');
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`/companies/${companySlug}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);

  const tabs = page.getByTestId('company-mobile-tablist');
  await tabs.getByRole('tab', { name: 'Perguntas Frequentes (FAQ)' }).click();
  const filters = page.getByTestId('company-faq-filter-rail');
  await expect(filters).toBeVisible();
  const buttons = filters.getByRole('button');
  expect(await buttons.count()).toBeGreaterThan(1);

  const firstCategory = buttons.nth(1);
  const categoryLabel = (await firstCategory.innerText()).trim();
  await firstCategory.click();
  await expect(firstCategory).toHaveAttribute('aria-pressed', 'true');
  await expect(filters.getByRole('button', { name: categoryLabel })).toBeVisible();

  const geometry = await filters.evaluate((rail) => {
    const surfaces = Array.from(rail.querySelectorAll<HTMLElement>('[data-testid="company-faq-filter-surface"]'));
    return {
      chipHeights: surfaces.map((surface) => surface.getBoundingClientRect().height),
      clipped: surfaces.some((surface) => surface.scrollWidth > surface.clientWidth + 1),
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  });
  geometry.chipHeights.forEach((height) => expect(height).toBe(32));
  expect(geometry.clipped).toBe(false);
  expect(geometry.pageOverflow).toBe(false);
});

test('Brand Page desktop navigation remains available', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Desktop regression runs once in Chromium.');
  await page.setViewportSize({ width: 1024, height: 900 });
  const response = await page.goto(`/companies/${companySlug}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('#company-profile-tabs')).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Seções do perfil da empresa' }).last()).toBeVisible();
});
