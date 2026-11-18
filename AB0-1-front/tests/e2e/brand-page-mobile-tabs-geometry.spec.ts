import { expect, test } from '@playwright/test';

// Existing E2E company fixture. Geometry assertions exercise real browser layout.
const companySlug = 'e2e-banner-free';
const mobileWidths = [320, 360, 375, 390, 414, 480, 640, 767];

test('Brand Page mobile tabs keep all labels on one baseline without document overflow', async ({ page }, testInfo) => {
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
      const icons = buttons.map((btn) => btn.children[0] as HTMLElement);
      const labels = buttons.map((btn) => btn.children[1] as HTMLElement);
      const arrows = buttons.map((btn) => btn.children[2] as HTMLElement);
      const rects = (elements: HTMLElement[]) => elements.map((element) => element.getBoundingClientRect());

      return {
        count: buttons.length,
        iconRects: rects(icons).map((r) => ({ top: r.top, centerY: r.top + r.height / 2 })),
        labelRects: rects(labels).map((r) => ({ top: r.top, height: r.height })),
        arrowRects: rects(arrows).map((r) => ({ top: r.top, height: r.height })),
        tabRects: rects(buttons).map((r) => ({ top: r.top, height: r.height })),
        styles: labels.map((label) => ({
          whiteSpace: getComputedStyle(label).whiteSpace,
          overflowWrap: getComputedStyle(label).overflowWrap,
          clipped: label.scrollWidth > label.clientWidth + 1,
        })),
        scrollerWidth: scroller.clientWidth,
        railWidth: rail.scrollWidth,
        scrollWidth: scroller.scrollWidth,
        documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      };
    });

    expect(metrics.count, `Missing tabs at ${width}px`).toBeGreaterThanOrEqual(3);
    expect(metrics.documentOverflow, `Body overflow at ${width}px`).toBe(false);
    expect(metrics.scrollerWidth, `Scroller must not exceed viewport at ${width}px`).toBeLessThanOrEqual(width);

    for (const label of metrics.styles) {
      expect(label.whiteSpace, `Label wrapping at ${width}px`).toBe('nowrap');
      expect(label.overflowWrap, `Unexpected word wrapping at ${width}px`).toBe('normal');
      expect(label.clipped, `Label clipped at ${width}px`).toBe(false);
    }
    for (const rectangles of [metrics.iconRects, metrics.labelRects, metrics.arrowRects, metrics.tabRects]) {
      const tops = rectangles.map((rect) => rect.top);
      expect(Math.max(...tops) - Math.min(...tops), `Vertical misalignment at ${width}px`).toBeLessThanOrEqual(1);
    }
    for (const rect of metrics.tabRects) {
      expect(rect.height).toBe(92);
    }

    // Every tab remains accessible, including those initially outside the viewport.
    await tabs.evaluate((rail) => {
      const scroller = rail.parentElement as HTMLElement;
      scroller.scrollLeft = scroller.scrollWidth;
    });
    const lastTab = tabs.getByRole('tab').last();
    await expect(lastTab).toBeInViewport();
  }
});

test('Brand Page desktop navigation remains available', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Desktop regression runs once in Chromium.');
  await page.setViewportSize({ width: 1024, height: 900 });
  const response = await page.goto(`/companies/${companySlug}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('#company-profile-tabs')).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Seções do perfil da empresa' }).last()).toBeVisible();
});
