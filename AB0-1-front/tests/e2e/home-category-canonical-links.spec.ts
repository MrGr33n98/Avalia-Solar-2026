import { test, expect } from '@playwright/test';

const EXPECTED_SOLUTION_PATHS = [
  '/categories/paineis-solares',
  '/categories/inversores-solares',
  '/categories/carregadores-residenciais',
  '/categories/estruturas-fixacao',
  '/categories/baterias-armazenamento',
  '/categories/monitoramento-operacao-manutencao',
  '/categories/kits-offgrid',
  '/categories/instaladores-energia-solar',
];

const VIEWPORTS = [
  { name: 'Desktop 1280x720', width: 1280, height: 720 },
  { name: 'Mobile 375x812', width: 375, height: 812 },
];

test.describe('Home Canonical Category & Solutions Links (SEO P0)', () => {
  test.setTimeout(120_000);

  for (const viewport of VIEWPORTS) {
    test(`[${viewport.name}] valida rails da Home, atributos href canônicos, ausência de 404 e tag canonical no destino`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const homeRes = await page.goto('/', { waitUntil: 'domcontentloaded' });
      expect(homeRes?.status()).toBe(200);

      const categoryRegion = page.locator('[role="region"][aria-label="Categorias principais"]');
      const solutionsRegion = page.locator('[role="region"][aria-label="Tipos de solução"]');
      const solutionsMount = page.getByTestId('home-solutions-mobile-only');

      await expect(categoryRegion).toBeVisible();
      // The solutions rail is intentionally retained in the DOM for canonical
      // links and mobile discovery, but takes no layout space on desktop.
      if (viewport.width >= 768) {
        await expect(solutionsMount).toHaveCSS('display', 'none');
        await expect(solutionsRegion).toBeHidden();
      } else {
        await expect(solutionsMount).toBeVisible();
        await expect(solutionsRegion).toBeVisible();
      }

      const categoryLinks = await categoryRegion
        .locator('a[href^="/categories/"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''));
      const solutionLinks = await solutionsRegion
        .locator('a[href^="/categories/"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''));

      expect(categoryLinks.length).toBeGreaterThanOrEqual(7);
      expect(solutionLinks).toEqual(EXPECTED_SOLUTION_PATHS);

      // Nenhum link divergente do manifesto visual deve existir
      const forbiddenSlugs = [
        '/categories/carregadores-residenciais-wallbox',
        '/categories/estruturas-e-fixacao',
        '/categories/baterias-e-armazenamento-de-energia',
        '/categories/monitoramento-e-o-m',
        '/categories/kits-solares-para-autossuficiencia',
        '/categories/instaladores-de-energia-solar',
        '/categories/inversores',
        '/categories/apps-software-e-plataformas',
        '/categories/casa-sustentavel-e-off-grid',
        '/categories/mercado-legislacao-e-financas',
        '/categories/sustentabilidade-e-esg',
      ];
      const allHomeRailHrefs = Array.from(new Set([...categoryLinks, ...solutionLinks]));
      for (const forbidden of forbiddenSlugs) {
        expect(allHomeRailHrefs).not.toContain(forbidden);
      }

      // Links existentes nos dois rails, inclusive o oculto no desktop, devem responder 200 sem redirect
      const responses = await Promise.all(
        allHomeRailHrefs.map(async (href) => ({
          href,
          res: await request.get(href, { maxRedirects: 0 }),
        }))
      );
      for (const { href, res } of responses) {
        expect(res.status(), `Esperado HTTP 200 direto para ${href}`).toBe(200);
      }

      // Navega até uma categoria de solução antes quebrada (ex: kits-offgrid) e valida canonical
      const destRes = await page.goto('/categories/kits-offgrid', {
        waitUntil: 'domcontentloaded',
      });
      expect(destRes?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        /\/categories\/kits-offgrid$/
      );
    });
  }
});


test('Home solution rail switches visibility at md (767px vs 768px) without leaving a desktop spacer', async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 900 });
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);

  const railMount = page.getByTestId('home-solutions-mobile-only');
  const solutionRegion = page.getByRole('region', { name: 'Tipos de solução' });

  await expect(railMount).toBeVisible();
  await expect(solutionRegion).toBeVisible();

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(railMount).toHaveCSS('display', 'none');
  await expect(solutionRegion).toBeHidden();
  const hiddenLayoutHeight = await railMount.evaluate((node) => node.getBoundingClientRect().height);
  expect(hiddenLayoutHeight, 'Desktop must not retain a blank solutions rail row').toBe(0);

  await page.setViewportSize({ width: 767, height: 900 });
  await expect(railMount).toBeVisible();
  await expect(solutionRegion).toBeVisible();
});
