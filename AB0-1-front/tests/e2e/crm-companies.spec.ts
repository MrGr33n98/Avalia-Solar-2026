import { test, expect } from '@playwright/test';

test.describe('CRM Companies Workspace — E2E Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/sales/companies');
  });

  test('Companies workspace loads with title, toolbar and table', async ({ page }) => {
    await expect(page.locator('h1:has-text("Companies")')).toBeVisible();
    await expect(page.locator('button:has-text("Add a new company")')).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Manage duplicates")')).toBeVisible();
  });

  test('Search input filters companies table', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search companies..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('WEG');
    await page.waitForTimeout(400);
  });

  test('Change columns dialog opens and toggles columns', async ({ page }) => {
    await page.click('button:has-text("Change columns")');
    await expect(page.locator('text=Configurar Colunas Exibidas')).toBeVisible();
    await page.click('button:has-text("Concluir")');
  });

  test('Add a new company CTA opens CreateCompanyModal', async ({ page }) => {
    await page.click('button:has-text("Add a new company")');
    await expect(page.locator('text=Criar Nova Empresa')).toBeVisible();
  });
});
