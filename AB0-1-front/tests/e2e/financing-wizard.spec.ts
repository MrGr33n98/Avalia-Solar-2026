import { test, expect } from '@playwright/test';

test('simulador de financiamento no perfil da empresa', async ({ page }) => {
  const base = process.env.E2E_COMPANY_URL || '/companies/e2e-financing';
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Simule seu financiamento solar')).toBeVisible();

  const amount = page.locator('input[type="number"]').first();
  await expect(amount).toBeVisible();
  await amount.fill('60000');
  await expect(page.getByText('Valor financiado')).toBeVisible();

  await page.getByRole('button', { name: 'Calcular' }).click();
  await expect(page.getByText('Parcela estimada')).toBeVisible();
});
