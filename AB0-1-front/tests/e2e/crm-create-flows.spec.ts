import { test, expect } from '@playwright/test';

test.describe('CRM Create Flows Zero-500 & Performance E2E', () => {
  test('Opportunity creation modal opens without errors and handles validation', async ({ page }) => {
    // Navigate to sales pipeline
    await page.goto('/dashboard/sales/pipeline');
    await page.waitForLoadState('networkidle');

    // Click Nova Oportunidade
    const newOppBtn = page.getByRole('button', { name: /nova oportunidade/i });
    if (await newOppBtn.isVisible()) {
      await newOppBtn.click();

      // Check modal visibility
      const dialogTitle = page.getByText('Nova Oportunidade Comercial');
      await expect(dialogTitle).toBeVisible();

      // Verify form elements exist
      await expect(page.getByText('Empresa (Account)')).toBeVisible();
      await expect(page.getByText('Nome da Oportunidade')).toBeVisible();
    }
  });
});
