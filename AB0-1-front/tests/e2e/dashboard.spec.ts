import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test('deve carregar a página inicial e exibir o dashboard corporativo', async ({ page }) => {
    await page.goto('/');

    // Verifica se a página carregou verificando o título ou algum texto crítico
    await expect(page).toHaveTitle(/Avalia Solar/i);

    // Navega para o dashboard (assumindo que há um link ou botão de dashboard, ou rota direta)
    await page.goto('/dashboard');
    
    // Verifica a presença do Activity Feed (adicionado na instrumentação)
    const feed = page.locator('text="Atividades Recentes"').first();
    await expect(feed).toBeVisible({ timeout: 15000 });
  });

  test('verificação de health check das APIs', async ({ request }) => {
    // Validando o backend healthcheck diretamente via request
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();
  });
});
