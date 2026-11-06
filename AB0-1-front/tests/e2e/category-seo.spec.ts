import { test, expect } from '@playwright/test';

test.describe('CDSI-019: Category HTTP & SSR SEO Semantics (E01-E06, E18)', () => {
  test('E01: categoria ativa retorna HTTP 200, H1 único e canonical válida', async ({ page }) => {
    const response = await page.goto('/categories/energia-solar-residencial');
    expect(response?.status()).toBe(200);

    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).not.toHaveText(/Categoria não encontrada/i);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      'href',
      /\/categories\/energia-solar-residencial$/
    );
  });

  test('E02: categoria inexistente retorna HTTP 404 real no documento inicial (nunca soft-404 200)', async ({
    page,
  }) => {
    const response = await page.goto('/categories/categoria-totalmente-inexistente-xyz-404');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /Categoria não encontrada/i })).toBeVisible();
  });

  test('E18: sub-rotas auxiliares (solutions, compare, matching) de categoria inexistente retornam HTTP 404', async ({
    page,
  }) => {
    for (const subroute of ['solutions', 'compare', 'matching']) {
      const response = await page.goto(
        `/categories/categoria-inexistente-xyz-404/${subroute}`
      );
      expect(response?.status()).toBe(404);
    }
  });

  test('E06: página de erro / 404 não expõe stacktrace, host interno ou mensagem SQL', async ({
    page,
  }) => {
    await page.goto('/categories/categoria-totalmente-inexistente-xyz-404');
    const content = await page.content();
    expect(content).not.toMatch(/PG::|ActiveRecord::|ECONNREFUSED|127\.0\.0\.1:3001/i);
  });
});

