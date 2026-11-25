import { test, expect } from '@playwright/test';

const email = process.env.E2E_PROPOSALS_EMAIL || 'proposals-ci@avaliasolar.test';
const password = process.env.E2E_USER_PASSWORD || 'Password123';

test.describe('Jornada E2E real de propostas (API real sem Mocks)', () => {
  test('PWA e Web - navegabilidade e resiliência', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    const loginResponsePromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/auth/login' &&
        response.request().method() === 'POST'
    );
    await page
      .locator('form')
      .filter({ has: page.locator('#email') })
      .locator('button[type="submit"]')
      .click();
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok(), `Proposals UI login HTTP ${loginResponse.status()}`).toBe(true);
    await expect(page).toHaveURL(/review-dashboard|dashboard|home/, { timeout: 10000 });

    const currentUser = await page.request.get('/api/v1/auth/me');
    expect(currentUser.ok(), `Proposals /auth/me HTTP ${currentUser.status()}`).toBe(true);
    expect((await currentUser.json()).user.role).toBe('review');
    await page.goto('/review-dashboard/proposals');

    const journey = page.getByTestId('marketplace-proposals-journey');
    const pageContext = `URL: ${page.url()}\n${(await page.locator('body').innerText()).slice(0, 500)}`;
    await expect(journey, pageContext).toBeVisible();

    // Baseline geométrico do comprador: viewport real após login e sem mocks.
    // Quando o usuário de teste não tem propostas, não inventar projeto/card.
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(journey).toBeVisible();

      const documentOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(documentOverflow, `Overflow horizontal no viewport ${width}px`).toBeLessThanOrEqual(2);

      const project = page.getByTestId('buyer-project-header');
      if (await project.count()) {
        const rect = await project.boundingBox();
        expect(rect).not.toBeNull();
        expect(rect!.x).toBeGreaterThanOrEqual(-1);
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);

        const buttons = [
          project.getByRole('button', { name: 'Ver detalhes' }),
          project.getByRole('button', { name: 'Solicitar proposta' }),
        ];
        for (const button of buttons) {
          const hit = await button.boundingBox();
          expect(hit).not.toBeNull();
          expect(hit!.height).toBeGreaterThanOrEqual(44);
          expect(hit!.width).toBeGreaterThanOrEqual(44);
        }
      }

      const stepper = page.getByTestId('buyer-project-stepper');
      if (await stepper.count()) {
        await expect(stepper.getByRole('listitem')).toHaveCount(5);
        const active = stepper.locator('[aria-current="step"]');
        expect(await active.count()).toBeLessThanOrEqual(1);
      }

      const card = page.getByTestId('buyer-proposal-card').first();
      if (await card.count()) {
        const bounds = await card.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(-1);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      }
    }

    // O ticker B2B não pertence ao chrome da área autenticada.
    await expect(page.getByTestId('company-registration-ticker')).toHaveCount(0);
  });
});
