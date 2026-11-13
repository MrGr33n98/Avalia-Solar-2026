import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL || 'test@avaliasolar.com.br';
const password = process.env.E2E_USER_PASSWORD || 'Password123';

test.describe('Jornada E2E real de propostas (API real sem Mocks)', () => {
  test('PWA e Web - navegabilidade e resiliência', async ({ page }) => {
    const login = await page.request.post('/api/v1/auth/login', {
      data: { email, password },
    });
    expect(login.ok()).toBeTruthy();

    const { token, user } = await login.json();
    expect(token).toBeTruthy();
    expect(user.role).toBe('review');
    const currentUser = await page.request.get('/api/v1/auth/me');
    expect(currentUser.ok()).toBeTruthy();
    expect((await currentUser.json()).user.role).toBe('review');
    await page.goto('/review-dashboard/proposals');

    await expect(page.getByTestId('marketplace-proposals-journey')).toBeVisible();
  });
});
