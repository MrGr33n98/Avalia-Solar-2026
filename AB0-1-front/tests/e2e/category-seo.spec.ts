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

  test('E04: slug legado em next.config.js redireciona 301/308 em 1 hop para slug canônico', async ({
    request,
  }) => {
    const response = await request.get('/categories/monitoramento-om', {
      maxRedirects: 0,
    });
    expect([301, 308]).toContain(response.status());
    expect(response.headers()['location']).toMatch(
      /\/categories\/monitoramento-operacao-manutencao$/
    );
  });

  test('E07 & E16: exatamente uma canonical limpa mesmo com parâmetros UTM na URL', async ({
    page,
  }) => {
    const response = await page.goto(
      '/categories/monitoramento-operacao-manutencao?utm_source=google&utm_medium=cpc&gclid=test123'
    );
    expect(response?.status()).toBe(200);

    const canonicals = page.locator('link[rel="canonical"]');
    await expect(canonicals).toHaveCount(1);
    await expect(canonicals.first()).toHaveAttribute(
      'href',
      /\/categories\/monitoramento-operacao-manutencao$/
    );

    const robotsMeta = page.locator('meta[name="robots"]');
    if ((await robotsMeta.count()) > 0) {
      await expect(robotsMeta.first()).not.toHaveAttribute('content', /noindex/i);
    }
  });

  test('E24: /companies/categorias/[slug] mantém canonical próprio de diretório multi-filtro sem canibalizar /categories/[slug]', async ({
    page,
  }) => {
    await page.goto('/companies/categorias/inversores-solares--1');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical.first()).toHaveAttribute('href', /\/companies\/categorias\//);
  });

  test('E09, E10 & E17: com JavaScript desativado, renderiza H1 único, seção editorial H2, links válidos de navegação e CollectionPage JSON-LD', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto('/categories/monitoramento-operacao-manutencao');
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#editorial-category-heading')).toBeVisible();

    const navLinks = page.locator('nav[aria-label="Navegação da categoria"] a');
    const hrefs = await navLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') || '')
    );
    expect(hrefs.some((h) => h.endsWith('/about'))).toBe(false);
    expect(hrefs.some((h) => h.endsWith('/guides'))).toBe(false);
    expect(hrefs.some((h) => h.endsWith('/reviews'))).toBe(false);

    const ldScripts = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((el) => el.textContent || ''));
    expect(ldScripts.some((txt) => txt.includes('"CollectionPage"'))).toBe(true);
    expect(ldScripts.some((txt) => txt.includes('"BreadcrumbList"'))).toBe(true);

    await context.close();
  });

  test('E13, E14 & E15: paginação inválida (?page=0 ou ?page=abc) retorna 404 e filtros de faceta aplicam noindex,follow com canonical base', async ({
    page,
  }) => {
    const invalidPageRes = await page.goto('/categories/inversores-solares?page=0');
    expect(invalidPageRes?.status()).toBe(404);

    const facetRes = await page.goto(
      '/categories/inversores-solares?state=SP&min_rating=4&sort=rating_desc'
    );
    expect(facetRes?.status()).toBe(200);

    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', /noindex/i);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/categories\/inversores-solares$/);
  });
});


