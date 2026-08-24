import { test, expect } from '@playwright/test';

const categorySlugs = [
  'baterias-armazenamento',
  'energia-solar-comercial-industrial',
  'energia-solar-residencial',
];

test.describe('Filtros da categoria', () => {
  for (const slug of categorySlugs) {
    test(`abre o painel em desktop para ${slug}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/categories/${slug}`);
      await page.getByRole('button', { name: /mais filtros/i }).click();
      await expect(page.getByRole('dialog', { name: /filtros da categoria/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Filtrar empresas' })).toBeVisible();
    });
  }

  test('abre o painel no breakpoint tablet de 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/categories/energia-solar-comercial-industrial');
    await page.getByRole('button', { name: /mais filtros/i }).click();
    await expect(page.getByRole('dialog', { name: /filtros da categoria/i })).toBeVisible();
  });

  test('abre bottom sheet no mobile sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/categories/baterias-armazenamento');
    await page.getByRole('button', { name: /mais filtros/i }).click();
    const dialog = page.getByRole('dialog', { name: /filtros da categoria/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /ver .*empresas/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
