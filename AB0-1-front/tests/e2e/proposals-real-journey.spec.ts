import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL || 'test@avaliasolar.com.br';
const password = process.env.E2E_USER_PASSWORD || 'Password123';

test.describe('Jornada E2E real de propostas (API real sem Mocks)', () => {
  test('PWA e Web - navegabilidade e resiliência', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page
      .locator('form')
      .filter({ has: page.locator('#email') })
      .locator('button[type="submit"]')
      .click();
    await expect(page).toHaveURL(/review-dashboard|dashboard|home/, { timeout: 10000 });

    const currentUser = await page.request.get('/api/v1/auth/me');
    expect(currentUser.ok()).toBeTruthy();
    expect((await currentUser.json()).user.role).toBe('review');
    await page.goto('/review-dashboard/proposals');

    const journey = page.getByTestId('marketplace-proposals-journey');
    const pageContext = `URL: ${page.url()}\n${(await page.locator('body').innerText()).slice(0, 500)}`;
    await expect(journey, pageContext).toBeVisible();
  });
});
