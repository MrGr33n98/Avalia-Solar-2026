import { test, expect } from '@playwright/test';

test.describe('CRM Global Add Host — 8 Actions E2E Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Sales CRM Dashboard
    await page.goto('/dashboard/sales');
  });

  test('Global Add Company opens modal and creates account', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Empresa (Company)');
    await expect(page.locator('text=Criar Nova Empresa')).toBeVisible();

    await page.fill('input[placeholder*="Usinas"]', 'Empresa E2E Teste S/A');
    await page.fill('input[placeholder*="empresa.com.br"]', 'e2etest.com.br');
    await page.click('button:has-text("Salvar Empresa")');

    await expect(page.locator('text=Empresa cadastrada com sucesso!')).toBeVisible();
  });

  test('Global Add Contact opens modal and creates contact', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Pessoa (Contact)');
    await expect(page.locator('text=Criar Novo Contato')).toBeVisible();

    await page.fill('input[placeholder*="Carlos Silva"]', 'João E2E Contact');
    await page.fill('input[type="email"]', 'joao@e2etest.com.br');
    await page.click('button:has-text("Salvar Contato")');

    await expect(page.locator('text=Contato cadastrado com sucesso!')).toBeVisible();
  });

  test('Global Add Opportunity redirects to pipeline', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Oportunidade / Lead');
    await expect(page).toHaveURL(/\/dashboard\/sales\/pipeline/);
  });

  test('Global Add Task opens modal and creates task', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Tarefa / Compromisso');
    await expect(page.locator('text=Nova Tarefa / Follow-up')).toBeVisible();

    await page.fill('input[placeholder*="Enviar proposta"]', 'Follow-up E2E Teste');
    await page.click('button:has-text("Criar Tarefa")');

    await expect(page.locator('text=Tarefa criada com sucesso!')).toBeVisible();
  });

  test('Global Add Activity opens modal and logs activity', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Atividade / Chamada');
    await expect(page.locator('text=Registrar Atividade')).toBeVisible();

    await page.fill('textarea', 'Ligação E2E realizada com sucesso');
    await page.click('button:has-text("Salvar Atividade")');

    await expect(page.locator('text=Atividade registrada com sucesso!')).toBeVisible();
  });

  test('Global Add Quote opens modal and creates quote', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Proposta Solar / Quote');
    await expect(page.locator('text=Gerar Nova Proposta Comercial')).toBeVisible();

    await page.fill('input[placeholder="75.5"]', '50.0');
    await page.fill('input[placeholder="280000"]', '180000');
    await page.click('button:has-text("Criar Proposta")');

    await expect(page.locator('text=Proposta Solar gerada com sucesso!')).toBeVisible();
  });

  test('Global Add Email opens modal and sends email', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Enviar E-mail');
    await expect(page.locator('text=Enviar E-mail Comercial')).toBeVisible();

    await page.fill('input[type="email"]', 'teste@cliente.com.br');
    await page.fill('input[placeholder*="Proposta Técnica"]', 'Proposta E2E Teste');
    await page.fill('textarea', 'Conteúdo do e-mail de teste');
    await page.click('button:has-text("Enviar E-mail")');

    await expect(page.locator('text=E-mail enviado e registrado')).toBeVisible();
  });

  test('Global Add Import redirects to import page', async ({ page }) => {
    await page.click('button:has-text("Add new")');
    await page.click('text=Importar Leads (CSV)');
    await expect(page).toHaveURL(/\/dashboard\/sales\/import/);
  });
});
