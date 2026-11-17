import { expect, test } from '@playwright/test';

const filtersResponse = {
  filters: [],
  companies: [],
  brands: [],
  price_range: { min: 0, max: 0 },
  categories: [
    { id: 17, name: 'Inversores', slug: 'inversores', products_count: 1 },
    { id: 18, name: 'Baterias', slug: 'baterias', products_count: 1 },
    { id: 19, name: 'Estruturas e Fixação', slug: 'estruturas-e-fixacao', products_count: 0 },
    { id: 20, name: 'Carregadores VE', slug: 'carregadores-ve', products_count: 0 },
    { id: 21, name: 'Cabos e Acessórios', slug: 'cabos-e-acessorios', products_count: 0 },
    { id: 22, name: 'Microinversores', slug: 'microinversores', products_count: 0 },
  ],
};

test.describe('carrossel compacto de categorias de produtos', () => {
  test.beforeEach(async ({ page }) => {
    // Contrato da API preservado, sem depender de dados mutáveis de produção.
    await page.route(/\/api\/v1\/products(?:\/filters|\?|$)/, async (route) => {
      const isFilterRequest = route.request().url().includes('/filters');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          isFilterRequest
            ? filtersResponse
            : { data: [], meta: { total: 0, page: 1, per_page: 12, total_pages: 1 } }
        ),
      });
    });
  });

  test('mobile: seis cards em uma faixa e seleção preserva sorting', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/products?sort=price_asc');

    const rail = page.getByTestId('product-category-rail');
    await expect(rail).toBeVisible();
    await expect(rail.locator('[data-testid^="product-category-"]')).toHaveCount(6);

    const bateria = page.getByTestId('product-category-baterias');
    await expect(bateria).toBeEnabled();
    await bateria.click();

    await expect(page).toHaveURL(/category_id=18/);
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(bateria).toHaveAttribute('aria-pressed', 'true');

    await bateria.click();
    await expect(page).not.toHaveURL(/category_id=18/);

    const sizes = await rail.locator('[data-testid^="product-category-"]').evaluateAll((cards) =>
      cards.map((card) => ({
        top: Math.round(card.getBoundingClientRect().top),
        height: Math.round(card.getBoundingClientRect().height),
      }))
    );
    expect(new Set(sizes.map((item) => item.top)).size).toBe(1);
    expect(sizes.every((item) => item.height <= 112)).toBe(true);
  });

  test('desktop: seis cards completos na mesma fileira', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/products');

    const rail = page.getByTestId('product-category-rail');
    await expect(page.getByTestId('product-category-inversores')).toBeEnabled();
    const rects = await rail.locator('[data-testid^="product-category-"]').evaluateAll((cards) =>
      cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top };
      })
    );

    expect(rects).toHaveLength(6);
    expect(new Set(rects.map((rect) => Math.round(rect.top))).size).toBe(1);
    expect(rects[0].left).toBeGreaterThanOrEqual(0);
    expect(rects[5].right).toBeLessThanOrEqual(1440);
  });
});
