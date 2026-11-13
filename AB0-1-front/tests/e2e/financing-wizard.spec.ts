import { test, expect } from '@playwright/test';

test('simulador de financiamento no perfil da empresa', async ({ page }) => {
  const companyResponse = await page.request.get('/api/v1/companies/by_slug/e2e-financing');
  expect(companyResponse.ok(), await companyResponse.text()).toBeTruthy();
  const { company } = await companyResponse.json();
  expect(company.financing_profile?.title).toBe('Simule seu financiamento solar');
  expect(company.public_financing_visible).toBe(true);
  const base = process.env.E2E_COMPANY_URL || `/companies/${company.slug}`;

  const pageResponse = await page.goto(base);
  expect(pageResponse?.status(), `Falha ao carregar ${base}`).toBeLessThan(400);

  const financingTitle = page.getByText('Simule seu financiamento solar');
  await expect(financingTitle).toBeVisible({ timeout: 15000 });

  const amount = page.locator('input[type="number"]').first();
  await expect(amount).toBeVisible();
  await amount.fill('60000');
  await expect(page.getByText('Valor financiado')).toBeVisible();

  await page.getByRole('button', { name: 'Calcular' }).click();
  await expect(page.getByText('Parcela estimada')).toBeVisible();
});
