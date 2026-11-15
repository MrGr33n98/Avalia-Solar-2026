import { expect, test } from '@playwright/test';

// The existing CI backend fixture supports this route without relying on production data.
const slug = 'e2e-banner-free';
const mobileWidths = [320, 360, 375, 390, 430, 480, 640, 767];
const longName =
  'Cooperativa Regional de Energia Solar Fotovoltaica e Soluções Sustentáveis de Longo Alcance';

test('mobile/PWA keeps the company name and three actions on the same line', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Run responsive geometry in Chromium.');

  const response = await page.goto(`/companies/${slug}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), 'The company fixture must be provisioned in the E2E environment').toBeLessThan(400);

  const heading = page.getByTestId('company-name');
  const nameText = page.getByTestId('company-name-text');
  const icons = page.getByTestId('company-quick-icon-actions');
  const compare = page.getByTestId('company-compare-action');
  await expect(heading).toBeVisible();
  await expect(icons).toBeVisible();
  await expect(compare).toBeVisible();

  // Exercise the real CSS with an exceptionally long name, regardless of fixture naming.
  await nameText.evaluate((element, fullName) => {
    element.textContent = fullName;
  }, longName);

  for (const width of mobileWidths) {
    await page.setViewportSize({ width, height: 900 });

    const boxes = await page.evaluate(() => {
      const find = (id: string) => {
        const element = document.querySelector(`[data-testid="${id}"]`);
        if (!element) throw new Error(`Missing ${id}`);
        return element.getBoundingClientRect();
      };
      const heading = find('company-name');
      const name = find('company-name-text');
      const icons = find('company-quick-icon-actions');
      const compare = find('company-compare-action');
      const text = document.querySelector('[data-testid="company-name-text"]') as HTMLElement;
      return {
        headingCenter: heading.top + heading.height / 2,
        iconCenter: icons.top + icons.height / 2,
        nameRight: name.right,
        iconsLeft: icons.left,
        iconsRight: icons.right,
        iconsBottom: icons.bottom,
        compareTop: compare.top,
        compareRight: compare.right,
        whiteSpace: getComputedStyle(text).whiteSpace,
        textOverflow: getComputedStyle(text).textOverflow,
        isTruncated: text.scrollWidth > text.clientWidth + 1,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      };
    });

    expect(Math.abs(boxes.headingCenter - boxes.iconCenter), `Misaligned header at ${width}px`).toBeLessThanOrEqual(8);
    expect(boxes.nameRight, `Title overlaps icons at ${width}px`).toBeLessThanOrEqual(boxes.iconsLeft + 1);
    expect(boxes.compareTop, `Compare must be below actions at ${width}px`).toBeGreaterThanOrEqual(boxes.iconsBottom - 2);
    expect(Math.abs(boxes.compareRight - boxes.iconsRight), `Compare must be right aligned at ${width}px`).toBeLessThanOrEqual(3);
    expect(boxes.whiteSpace).toBe('nowrap');
    expect(boxes.textOverflow).toBe('ellipsis');
    expect(boxes.isTruncated, `Long company name must truncate at ${width}px`).toBe(true);
    expect(boxes.overflow, `Unexpected horizontal overflow at ${width}px`).toBe(false);
  }
});

test('tablet and desktop retain their original comparison order and multiline headings', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Run responsive geometry in Chromium.');
  const response = await page.goto(`/companies/${slug}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);

  for (const width of [800, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const compare = page.getByTestId('company-compare-action');
    const icons = page.getByTestId('company-quick-icon-actions');
    const compareBox = await compare.boundingBox();
    const iconBox = await icons.boundingBox();
    expect(compareBox).not.toBeNull();
    expect(iconBox).not.toBeNull();
    expect(compareBox!.x + compareBox!.width).toBeLessThanOrEqual(iconBox!.x + 2);
    await expect(page.getByTestId('company-name-text')).toHaveCSS('white-space', 'normal');
  }
});
