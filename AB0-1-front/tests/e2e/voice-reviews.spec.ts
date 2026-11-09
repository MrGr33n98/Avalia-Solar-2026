import { expect, test } from '@playwright/test';

test.describe('Avaliações por voz', () => {
  test('landing oferece WhatsApp oficial e fallback textual', async ({ page }) => {
    await page.route('**/api/v1/voice_review_invites/RVTEST/public', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          company: { display_name: 'Sol do Bairro' },
          voice_available: true,
          privacy_url: '/privacy',
          text_fallback_url: '/f/form-token',
          whatsapp_url: 'https://wa.me/5511999999999?text=AVS%20RVTEST',
        }),
      })
    );

    await page.goto('/v/RVTEST');
    await expect(page.getByRole('heading', { name: /Sol do Bairro/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Continuar no WhatsApp/ })).toHaveAttribute('href', /wa\.me/);
    await expect(page.getByRole('link', { name: /Prefiro escrever/ })).toHaveAttribute('href', '/f/form-token');
  });

  test('autor edita o texto, escolhe nota e envia para moderação', async ({ page }) => {
    await page.route('**/api/v1/voice_review_sessions/session-1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 'session-1', company_name: 'Sol do Bairro', state: 'awaiting_confirmation', transcript_text: 'Texto transcrito', transcript_version: 1, privacy_url: '/privacy' }),
      })
    );
    await page.route('**/api/v1/voice_review_sessions/session-1/confirm', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ review_id: 42, review_status: 'pending', verification_status: 'pending' }) })
    );

    await page.goto('/voice-review/session-1?token=test-token');
    await page.locator('textarea').fill('Atendimento bom, mas o prazo poderia melhorar.');
    await page.getByRole('button', { name: '2' }).click();
    await page.getByText('Confirmo que este relato descreve uma experiência real minha.').click();
    await page.getByText('Autorizo o envio deste texto para análise e possível publicação após moderação.').click();
    await page.getByRole('button', { name: /Confirmar e enviar/ }).click();
    await expect(page.getByRole('heading', { name: /Avaliação recebida/i })).toBeVisible();
  });
});
