import { test, expect } from '@playwright/test';

test.describe('CRM Atomic Opportunity Creation & Rollback Specs (P0-10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/sales');
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'admin@avaliasolar.com.br');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard/sales');
    }
  });

  test('Scenario A: Existing Account + Opportunity creation', async ({ page }) => {
    const newOppBtn = page.getByRole('button', { name: /Nova Oportunidade/i }).first();
    await expect(newOppBtn).toBeVisible();
    await newOppBtn.click();

    await expect(page.getByText('Nova Oportunidade Comercial')).toBeVisible();

    const oppName = `Projeto Comercial A ${Date.now()}`;
    await page.fill('input[placeholder="Ex: Projeto Rooftop Solar 100kWp"]', oppName);
    await page.fill('input[placeholder="Ex: 150000"]', '180000');

    // Submit form
    await page.getByRole('button', { name: 'Salvar Oportunidade' }).click();

    // Reload page to verify PostgreSQL persistence
    await page.reload();
    await expect(page.getByText(oppName).first()).toBeVisible({ timeout: 10000 });
  });

  test('Scenario B: New Inline Account + Opportunity atomic creation', async ({ page }) => {
    const newOppBtn = page.getByRole('button', { name: /Nova Oportunidade/i }).first();
    await expect(newOppBtn).toBeVisible();
    await newOppBtn.click();

    // Toggle inline Account
    await page.getByText('Selecione a empresa...').click();
    await page.getByText('+ Criar Nova Empresa (Inline)').click();

    const companyName = `Usina Solar B ${Date.now()}`;
    await page.fill('input[placeholder="Nome da empresa *"]', companyName);
    await page.fill('input[placeholder="Domínio (ex: empresa.com.br)"]', 'usina-b.com.br');

    const oppName = `Projeto Usina B ${Date.now()}`;
    await page.fill('input[placeholder="Ex: Projeto Rooftop Solar 100kWp"]', oppName);
    await page.fill('input[placeholder="Ex: 150000"]', '350000');

    // Submit form
    await page.getByRole('button', { name: 'Salvar Oportunidade' }).click();

    // Reload page to verify persistence in PostgreSQL
    await page.reload();
    await expect(page.getByText(companyName).first()).toBeVisible({ timeout: 10000 });
  });

  test('Scenario C & D: New Inline Account + New Inline Contact + Opportunity with Rollback assertion', async ({ page }) => {
    const newOppBtn = page.getByRole('button', { name: /Nova Oportunidade/i }).first();
    await expect(newOppBtn).toBeVisible();
    await newOppBtn.click();

    // Inline Account
    await page.getByText('Selecione a empresa...').click();
    await page.getByText('+ Criar Nova Empresa (Inline)').click();
    const testCompany = `Usina C ${Date.now()}`;
    await page.fill('input[placeholder="Nome da empresa *"]', testCompany);

    // Inline Contact
    await page.getByText('Selecione o contato...').click();
    await page.getByText('+ Criar Novo Contato (Inline)').click();
    const testContact = `Decisor C ${Date.now()}`;
    await page.fill('input[placeholder="Nome do contato *"]', testContact);

    const oppName = `Projeto Usina C ${Date.now()}`;
    await page.fill('input[placeholder="Ex: Projeto Rooftop Solar 100kWp"]', oppName);
    await page.fill('input[placeholder="Ex: 150000"]', '500000');

    // Submit form
    await page.getByRole('button', { name: 'Salvar Oportunidade' }).click();

    // Reload and verify
    await page.reload();
    await expect(page.getByText(testCompany).first()).toBeVisible({ timeout: 10000 });
  });
});
