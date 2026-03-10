import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const supportedRoutes = ['/', '/categories', '/companies', '/compare', '/blog'];
const serviceWorkerTimeoutMs = 60000;

const waitForServiceWorkerActivation = async (page: Page) => {
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) {
            return {
              registered: false,
              active: null,
              waiting: null,
              installing: null,
            };
          }

          const registration = await navigator.serviceWorker.getRegistration('/');

          return {
            registered: Boolean(registration),
            active: registration?.active?.state ?? null,
            waiting: registration?.waiting?.state ?? null,
            installing: registration?.installing?.state ?? null,
          };
        }),
      { timeout: serviceWorkerTimeoutMs }
    )
    .toMatchObject({ registered: true });

  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) return false;
          const registration = await navigator.serviceWorker.getRegistration('/');
          return Boolean(registration?.active);
        }),
      { timeout: serviceWorkerTimeoutMs }
    )
    .toBe(true);
};

test.describe('Mobile offline foundation', () => {
  test.setTimeout(180000);

  test('registers the service worker and precaches the main mobile routes', async ({
    page,
  }) => {
    await page.goto('/offline', {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await waitForServiceWorkerActivation(page);

    const precacheResult = await page.evaluate(async (routes) => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const cacheKeys = await caches.keys();
      const cachedRoutes: Record<string, boolean> = {};

      for (const route of routes) {
        cachedRoutes[route] = false;
        for (const cacheKey of cacheKeys) {
          const cache = await caches.open(cacheKey);
          const match = await cache.match(route, { ignoreSearch: true });
          if (match) {
            cachedRoutes[route] = true;
            break;
          }
        }
      }

      return {
        registrationCount: registrations.length,
        cachedRoutes,
      };
    }, supportedRoutes);

    expect(precacheResult.registrationCount).toBeGreaterThan(0);
    expect(Object.values(precacheResult.cachedRoutes).every(Boolean)).toBe(true);
  });

  test('shows the offline fallback page for uncached routes without network', async ({
    page,
    context,
  }) => {
    await page.goto('/offline', {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await waitForServiceWorkerActivation(page);
    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await expect
      .poll(
        async () => page.evaluate(() => Boolean(navigator.serviceWorker?.controller)),
        { timeout: serviceWorkerTimeoutMs }
      )
      .toBe(true);

    await context.setOffline(true);
    await page.goto('/route-offline-nao-cacheada', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Você está sem conexão no momento' })
    ).toBeVisible();

    await context.setOffline(false);
  });
});
