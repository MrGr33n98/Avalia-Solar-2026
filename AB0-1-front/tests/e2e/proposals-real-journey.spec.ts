import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL || 'test@avaliasolar.com.br';
const password = process.env.E2E_USER_PASSWORD || 'password123';

test.describe('Jornada E2E real de propostas (API real sem Mocks)', () => {
  test('PWA e Web - navegabilidade e resiliência', async ({ page, request }) => {
    const login = await request.post('/api/v1/auth/login', {
      data: { email, password },
    });
    expect(login.ok()).toBeTruthy();

    const state = await request.storageState();
    await page.context().addCookies(state.cookies);
    await page.goto('/review-dashboard/proposals');

    await expect(page.locator('section[aria-label="Jornada de propostas"]')).toBeVisible();
  });
});
