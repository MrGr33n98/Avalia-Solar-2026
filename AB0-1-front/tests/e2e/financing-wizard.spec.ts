import { test, expect } from '@playwright/test';

test('fluxo completo do wizard de financiamento', async ({ page }) => {
  const base = process.env.E2E_COMPANY_URL || process.env.E2E_BASE_URL || 'http://localhost:3000/companies/demo';
  await page.goto(base, { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Simulador de Financiamento Solar')).toBeVisible();
  await expect(page.getByText('Passo 1 de 3')).toBeVisible();

  const amountLabel = page.getByText('Valor do Financiamento');
  await expect(amountLabel).toBeVisible();

  const continuar = page.getByRole('button', { name: /Continuar/i });
  await continuar.click();

  await expect(page.getByText('Passo 2 de 3')).toBeVisible();

  const confirmar = page.getByRole('button', { name: /Confirmar proposta/i });
  if (await confirmar.isEnabled()) {
    await confirmar.click();
  }

  await expect(page.getByText('Passo 3 de 3').or(page.getByText('Proposta enviada'))).toBeVisible();
});
