import { test, expect } from '@playwright/test';

const emptyCatalogResponse = {
  company: {
    id: 1,
    name: 'WEG',
    slug: 'weg',
    city: 'Jaraguá do Sul',
    state: 'SC',
    rating_avg: 5.0,
    rating_count: 0,
    allows_competitor_suggestions: true,
    verified: true,
  },
  category: {
    id: 10,
    name: 'Carregadores Residenciais / Wallbox',
    seo_url: 'carregadores-residenciais',
    description: 'Carregadores para veículos elétricos residenciais.',
    short_description: 'Carregadores para veículos elétricos residenciais.',
  },
  products: [],
  services: [],
  suggested_products: [],
  related_categories: [
    { id: 20, name: 'Energia Solar', seo_url: 'energia-solar', product_count: 5 },
  ],
  similar_companies: [
    {
      id: 2,
      name: 'Concorrente Solar',
      slug: 'concorrente-solar',
      rating_avg: 4.5,
      city: 'São Paulo',
      state: 'SP',
      verified: false,
      product_count: 3,
    },
  ],
};

test.describe('Página de categoria da empresa - empty state A+++', () => {
  test('deve exibir empty state inteligente com categorias relacionadas e empresas similares', async ({ page }) => {
    await page.route('**/api/v1/companies/weg/catalog**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyCatalogResponse),
      });
    });

    await page.goto('/companies/weg/categories/carregadores-residenciais');

    await expect(page.locator('h1')).toContainText('Carregadores Residenciais / Wallbox');
    await expect(page.locator('text=A WEG ainda não publicou produtos ou serviços')).toBeVisible();
    await expect(page.locator('button:has-text("Solicitar orçamento")')).toBeVisible();

    await expect(page.locator('text=Explore outras categorias da WEG')).toBeVisible();
    await expect(page.locator('text=Energia Solar')).toBeVisible();

    await expect(page.locator('text=Outras empresas com Carregadores Residenciais / Wallbox')).toBeVisible();
    await expect(page.locator('text=Concorrente Solar')).toBeVisible();
  });

  test('deve navegar para categoria relacionada ao clicar no chip', async ({ page }) => {
    await page.route('**/api/v1/companies/weg/catalog**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyCatalogResponse),
      });
    });

    await page.goto('/companies/weg/categories/carregadores-residenciais');

    await page.locator('text=Energia Solar').first().click();
    await page.waitForURL(/\/companies\/weg\/categories\/energia-solar/);
  });

  test('deve manter breadcrumb canônico e metadata acessível', async ({ page }) => {
    await page.route('**/api/v1/companies/weg/catalog**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyCatalogResponse),
      });
    });

    await page.goto('/companies/weg/categories/carregadores-residenciais');

    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('text=WEG')).toBeVisible();
    await expect(breadcrumb.locator('text=Carregadores Residenciais / Wallbox')).toBeVisible();

    const noindex = page.locator('meta[name="robots"]');
    await expect(noindex).toHaveAttribute('content', 'noindex, follow');
  });
});
