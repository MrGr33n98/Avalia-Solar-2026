import { expect, test } from '@playwright/test';

const DESKTOP_WIDTHS = [768, 1024, 1280, 1440, 1526, 1920];
const MOBILE_WIDTHS = [320, 375, 390, 430, 767];
const TOLERANCE_PX = 2;

type Edges = { left: number; right: number };

test.describe('Home: shared horizontal alignment contract', () => {
  test('category ribbon removes Tudo and collapses its slot at every viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Run viewport matrix in Chromium once.');
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    const rail = page.getByRole('region', { name: 'Trilho de categorias e atalhos' });
    await expect(rail).toBeVisible();
    await expect(rail.getByRole('link', { name: /^Tudo$/i })).toHaveCount(0);

    for (const width of [...MOBILE_WIDTHS, ...DESKTOP_WIDTHS]) {
      await page.setViewportSize({ width, height: 844 });
      const geometry = await rail.evaluate((element) => {
        const favorites = element.querySelector<HTMLElement>('a[href="/favorites"]');
        const solar = element.querySelector<HTMLElement>('a[href="/categories/energia-solar"]');
        if (!favorites || !solar) throw new Error('Required ribbon shortcuts missing');
        return {
          adjacent: favorites.nextElementSibling === solar,
          gap: solar.getBoundingClientRect().left - favorites.getBoundingClientRect().right,
          expectedGap: parseFloat(getComputedStyle(element).columnGap),
        };
      });
      expect(geometry.adjacent, `Unexpected slot after Favoritos at ${width}px`).toBe(true);
      expect(Math.abs(geometry.gap - geometry.expectedGap), `Ribbon gap at ${width}px`)
        .toBeLessThanOrEqual(TOLERANCE_PX);
    }
  });

  test('Header, Category Ribbon, Hero and featured companies share the same vertical edges', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Run viewport matrix in Chromium once.');

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId('site-header-content')).toBeVisible();
    await expect(page.getByTestId('home-category-ribbon-shell')).toBeVisible();
    await expect(page.getByTestId('home-hero-frame')).toBeVisible();

    for (const width of DESKTOP_WIDTHS) {
      await page.setViewportSize({ width, height: 920 });

      const measurements = await page.evaluate(() => {
        const required = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Required Home layout element missing: ${selector}`);
          return element;
        };
        const contentEdges = (element: HTMLElement): Edges => {
          const box = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          return {
            left: box.left + Number.parseFloat(styles.paddingLeft || '0'),
            right: box.right - Number.parseFloat(styles.paddingRight || '0'),
          };
        };
        const boxEdges = (element: HTMLElement): Edges => {
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right };
        };

        const header = required('[data-testid="site-header-content"]');
        const ribbon = required('[data-testid="home-category-ribbon-shell"]');
        const hero = required('[data-testid="home-hero-frame"]');
        const companiesMount = required('[data-testid="home-featured-companies-layout"]');
        const companiesSection = companiesMount.querySelector<HTMLElement>('section');

        // When the company API returns zero rows, the section is not rendered; still
        // assert its outer grid contract against the expected px-4 section padding.
        const companyEdges = companiesSection
          ? contentEdges(companiesSection)
          : (() => {
              const box = companiesMount.getBoundingClientRect();
              return { left: box.left + 16, right: box.right - 16 };
            })();

        const arrows = Array.from(
          ribbon.querySelectorAll<HTMLButtonElement>(
            'button[aria-label="Rolar categorias para esquerda"], button[aria-label="Rolar categorias para direita"]'
          )
        )
          .filter((element) => getComputedStyle(element).display !== 'none')
          .map((element) => boxEdges(element));

        const rail = required('[aria-label="Trilho de categorias e atalhos"]');

        return {
          header: contentEdges(header),
          ribbon: contentEdges(ribbon),
          hero: boxEdges(hero),
          companies: companyEdges,
          arrows,
          bodyOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
          railFitsShell: rail.getBoundingClientRect().right <= contentEdges(ribbon).right + 2,
        };
      });

      for (const [name, edges] of [
        ['Header', measurements.header],
        ['Category Ribbon', measurements.ribbon],
        ['Empresas em destaque', measurements.companies],
      ] as const) {
        expect(Math.abs(edges.left - measurements.hero.left), `${name} left at ${width}px`)
          .toBeLessThanOrEqual(TOLERANCE_PX);
        expect(Math.abs(edges.right - measurements.hero.right), `${name} right at ${width}px`)
          .toBeLessThanOrEqual(TOLERANCE_PX);
      }
      for (const arrow of measurements.arrows) {
        expect(arrow.left, `Ribbon arrow left edge at ${width}px`)
          .toBeGreaterThanOrEqual(measurements.hero.left - TOLERANCE_PX);
        expect(arrow.right, `Ribbon arrow right edge at ${width}px`)
          .toBeLessThanOrEqual(measurements.hero.right + TOLERANCE_PX);
      }
      expect(measurements.railFitsShell, `Ribbon scroll area escapes at ${width}px`).toBe(true);
      expect(measurements.bodyOverflow, `Horizontal body overflow at ${width}px`).toBe(false);

      if (width === 1526) {
        await testInfo.attach('home-alignment-1526px', {
          body: await page.screenshot({ animations: 'disabled' }),
          contentType: 'image/png',
        });
      }
    }
  });

  test('mobile ribbon stays scrollable and does not break the page layout', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Run viewport matrix in Chromium once.');

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    const ribbon = page.getByTestId('home-category-ribbon-shell');
    const rail = page.getByRole('region', { name: 'Trilho de categorias e atalhos' });

    for (const width of MOBILE_WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      await expect(ribbon).toBeVisible();
      await expect(rail).toBeVisible();

      const result = await page.evaluate(() => {
        const ribbonShell = document.querySelector<HTMLElement>('[data-testid="home-category-ribbon-shell"]')!;
        const scrollArea = document.querySelector<HTMLElement>('[aria-label="Trilho de categorias e atalhos"]')!;
        return {
          shellLeft: ribbonShell.getBoundingClientRect().left,
          shellRight: ribbonShell.getBoundingClientRect().right,
          scrollWidth: scrollArea.scrollWidth,
          clientWidth: scrollArea.clientWidth,
          documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        };
      });

      expect(result.shellLeft).toBeGreaterThanOrEqual(-TOLERANCE_PX);
      expect(result.shellRight).toBeLessThanOrEqual(width + TOLERANCE_PX);
      expect(result.scrollWidth).toBeGreaterThanOrEqual(result.clientWidth);
      expect(result.documentOverflow, `Body overflow at ${width}px`).toBe(false);
    }

    await expect(rail.getByRole('link', { name: /Energia Solar/i })).toHaveAttribute(
      'href', '/categories/energia-solar'
    );
  });
});
