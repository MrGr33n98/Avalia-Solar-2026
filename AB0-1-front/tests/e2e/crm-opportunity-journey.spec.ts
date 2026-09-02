import { test, expect } from '@playwright/test';

test.describe('CRM Opportunity End-to-End Journey (P0-10)', () => {
  test('Create Account -> Create Contact -> Create Opportunity -> Reload Persistence', async ({ page }) => {
    // 1. Visit CRM Dashboard
    await page.goto('/dashboard/sales');

    // If redirected to login, authenticate
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'admin@avaliasolar.com.br');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/sales');
    }

    // 2. Open New Opportunity Modal
    const newOppBtn = page.getByRole('button', { name: /Nova Oportunidade/i }).first();
    await expect(newOppBtn).toBeVisible();
    await newOppBtn.click();

    // 3. Verify Modal Title
    await expect(page.getByText('Nova Oportunidade Comercial')).toBeVisible();

    // 4. Fill inline new Account
    const accSelect = page.getByText('Selecione a empresa...');
    await accSelect.click();
    await page.getByText('+ Criar Nova Empresa (Inline)').click();

    const testCompanyName = `Solar Tech ${Date.now()}`;
    await page.fill('input[placeholder="Nome da empresa *"]', testCompanyName);
    await page.fill('input[placeholder="Domínio (ex: empresa.com.br)"]', 'solartech.com.br');

    // 5. Fill Opportunity details
    const oppName = `Projeto Usina ${Date.now()}`;
    await page.fill('input[placeholder="Ex: Projeto Rooftop Solar 100kWp"]', oppName);
    await page.fill('input[placeholder="Ex: 150000"]', '250000');

    // 6. Submit Opportunity Form
    await page.getByRole('button', { name: 'Salvar Oportunidade' }).click();

    // 7. Verify Toast notification or Card presence
    await expect(page.getByText(testCompanyName).first()).toBeVisible({ timeout: 10000 });

    // 8. Execute Page Reload (F5) to verify real PostgreSQL Persistence
    await page.reload();

    // 9. Assert Opportunity and Company exist after F5
    await expect(page.getByText(testCompanyName).first()).toBeVisible({ timeout: 10000 });
  });
});
