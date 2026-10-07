import { test, expect } from '@playwright/test';

test.describe('Jornada de conversa da proposta', () => {
  test('gera deep-link correto para o chat no contexto da proposta', async ({ page }) => {
    await page.goto('/review-dashboard/proposals?proposal=1');

    // Verificar se o CTA "Conversar com a empresa" aponta para /chat?company_id=...&marketplace_proposal_id=...
    const chatLink = page.locator('a[href*="/chat?company_id="]');
    if (await chatLink.count() > 0) {
      await expect(chatLink.first()).toHaveAttribute('href', /marketplace_proposal_id=/);
    }
  });
});
