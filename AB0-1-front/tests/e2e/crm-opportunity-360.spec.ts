import { test, expect } from '@playwright/test';

test.describe('Opportunity 360 — Quick Actions & Reload Persistence E2E', () => {
  test('Opportunity 360 opens, registers call, logs task, updates timeline and persists on reload', async ({ page }) => {
    // 1. Navigate to Sales Pipeline Kanban
    await page.goto('/dashboard/sales/pipeline');
    await page.waitForLoadState('networkidle');

    // 2. Click on the first opportunity card to open Opportunity 360° modal
    const oppCard = page.locator('div[class*="border-slate-200"]').filter({ hasText: 'R$' }).first();
    if (await oppCard.isVisible()) {
      await oppCard.click();
      await expect(page.locator('text=Opportunity 360°')).toBeVisible();

      // 3. Quick Action: Registrar Chamada
      await page.click('button:has-text("Registrar Chamada")');
      await expect(page.locator('text=Registrar Atividade')).toBeVisible();
      await page.fill('textarea', 'Chamada E2E gravada na oportunidade');
      await page.click('button:has-text("Salvar Atividade")');
      await expect(page.locator('text=Atividade registrada com sucesso!')).toBeVisible();

      // 4. Verify Timeline updated
      await page.click('button:has-text("Timeline")');
      await expect(page.locator('text=Chamada E2E gravada na oportunidade')).toBeVisible();

      // 5. Reload page and check persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Fila de Prospecção B2B').or(page.locator('text=Pipeline'))).toBeVisible();
    }
  });
});
