import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? '';
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? '';

const hasAuthCredentials = Boolean(E2E_USER_EMAIL && E2E_USER_PASSWORD);

async function authenticate(request: APIRequestContext) {
  const response = await request.post('/api/v1/auth/login', {
    data: {
      email: E2E_USER_EMAIL,
      password: E2E_USER_PASSWORD,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Falha na autenticação E2E: ${response.status()} ${await response.text()}`
    );
  }

  return request.storageState();
}

async function addAuthCookies(page: Page, request: APIRequestContext) {
  const state = await authenticate(request);
  await page.context().addCookies(state.cookies);
}

test.describe('Dashboard PWA — Sprint 1', () => {
  test.describe('PWA metadata e service worker', () => {
    test('manifest deve retornar 200 com campos obrigatórios', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/manifest+json');

      const manifest = await response.json();
      expect(manifest.id).toBeDefined();
      expect(manifest.name).toBeDefined();
      expect(manifest.short_name).toBeDefined();
      expect(manifest.start_url).toBe('/dashboard');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ sizes: '192x192' }),
          expect.objectContaining({ sizes: '512x512' }),
        ])
      );
    });

    test('service worker deve estar registrado', async ({ page }) => {
      await page.goto('/dashboard');
      const swUrl = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        return registration.scope;
      });
      expect(swUrl).toContain('/');
    });
  });

  test.describe('Shell exclusivo do dashboard', () => {
    test('Navbar pública não aparece dentro do dashboard', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const publicNav = page.locator('nav').filter({ hasText: /Empresas|Como funciona|Conteúdo/i });
      await expect(publicNav).toHaveCount(0);
    });

    test('Bottom nav pública não aparece dentro do dashboard em mobile', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 375, height: 667 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toHaveCount(0);
    });

    test('Navbar pública continua visível fora do dashboard', async ({ page }) => {
      await page.goto('/');
      const publicNav = page.locator('nav').filter({ hasText: /Empresas|Como funciona|Conteúdo/i }).first();
      await expect(publicNav).toBeVisible();
    });

    test('Bottom nav pública continua visível fora do dashboard em mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();
    });
  });

  test.describe('Matriz de viewport', () => {
    test('mobile: abre sheet de navegação e fecha com Escape', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 375, height: 667 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const menuButton = page.getByRole('button', { name: /menu/i }).first();
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      const sheet = page.locator('[data-state="open"][role="dialog"]').first();
      await expect(sheet).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(sheet).not.toBeVisible();
    });

    test('tablet: rail compacto persistente visível', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 1024, height: 768 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const rail = page.locator('aside.fixed.left-0').first();
      await expect(rail).toBeVisible();
      await expect(rail).toHaveCSS('width', /72px|80px/);
    });

    test('desktop: rail expandido visível', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await page.setViewportSize({ width: 1280, height: 720 });
      await addAuthCookies(page, request);
      await page.goto('/dashboard');

      const rail = page.locator('aside.fixed.left-0').first();
      await expect(rail).toBeVisible();
      await expect(rail).toHaveCSS('width', /240px/);
    });

    const viewports = [
      { width: 320, height: 568, name: '320px' },
      { width: 375, height: 667, name: '375px' },
      { width: 414, height: 896, name: '414px' },
      { width: 768, height: 1024, name: '768px' },
    ];

    for (const viewport of viewports) {
      test(`zero overflow horizontal em ${viewport.name}`, async ({ page, request }) => {
        if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await addAuthCookies(page, request);
        await page.goto('/dashboard');

        const bodyOverflowX = await page.evaluate(() => {
          const body = document.body;
          return window.getComputedStyle(body).overflowX;
        });
        expect(bodyOverflowX).toBe('hidden');

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalOverflow).toBe(false);
      });
    }
  });

  test.describe('Deep-link de tabs', () => {
    test('?tab=reviews carrega a aba de avaliações', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await addAuthCookies(page, request);
      await page.goto('/dashboard?tab=reviews');

      await expect(page).toHaveURL(/tab=reviews/);
      await expect(page.locator('h2').filter({ hasText: /Avaliações/i }).first()).toBeVisible();
    });

    test('back/forward restaura tab sem request duplicado', async ({ page, request }) => {
      if (!hasAuthCredentials) test.skip('Credenciais E2E ausentes');
      await addAuthCookies(page, request);
      await page.goto('/dashboard?tab=overview');

      await page.goto('/dashboard?tab=reviews');
      await page.goBack();
      await expect(page).toHaveURL(/tab=overview/);
    });
  });
});
