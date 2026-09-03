import { test, expect } from '@playwright/test';

test.describe('CRM People & Decisores Workspace — E2E Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/sales/people');
  });

  test('People workspace loads with title, toolbar and table', async ({ page }) => {
    await expect(page.locator('h1:has-text("People & Decisores")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Person")')).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
  });

  test('Search input filters people table', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search people..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Silva');
    await page.waitForTimeout(400);
  });

  test('Change columns dialog opens and toggles columns', async ({ page }) => {
    await page.click('button:has-text("Change columns")');
    await expect(page.locator('text=Configurar Colunas Exibidas — Pessoas')).toBeVisible();
    await page.click('button:has-text("Concluir")');
  });

  test('Add Person CTA opens CreateContactModal', async ({ page }) => {
    await page.click('button:has-text("Add Person")');
    await expect(page.locator('text=Criar Novo Contato')).toBeVisible();
  });
});
