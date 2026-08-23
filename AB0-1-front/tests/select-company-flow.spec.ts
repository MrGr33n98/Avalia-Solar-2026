import { test, expect } from '@playwright/test';

test.describe('Select Company Flow', () => {
  test('authenticated user can search by name and request admin approval', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'jwt_token',
        value: 'fake-jwt-token',
        url: 'http://localhost:3000',
      },
    ]);

    let requestPayload: any = null;
    let queryWasSent = false;

    await page.route('**/*', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/v1/auth/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 7,
              email: 'company@example.com',
              name: 'Company User',
              role: 'company',
              status: 'active',
            },
          }),
        });
        return;
      }

      if (url.includes('/api/v1/companies/mine')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (url.includes('/api/v1/company_access/context')) {
        const parsedUrl = new URL(url);
        const q = (parsedUrl.searchParams.get('q') || '').toLowerCase();

        if (q.includes('voli')) {
          queryWasSent = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              active_memberships: [],
              pending_requests: [],
              suggested_companies: [
                {
                  company_id: 99,
                  company_name: 'Volitbras',
                  company_slug: 'volitbras',
                  city: 'Sao Paulo',
                  state: 'SP',
                  verified: true,
                  logo_url: 'http://localhost:3001/uploads/volitbras-logo.png',
                },
              ],
            }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            active_memberships: [],
            pending_requests: [],
            suggested_companies: [
              {
                company_id: 11,
                company_name: 'Solar Hub',
                company_slug: 'solar-hub',
                city: 'Goiania',
                state: 'GO',
                verified: true,
                logo_url: null,
              },
            ],
          }),
        });
        return;
      }

      if (
        url.includes('/api/v1/company_access_requests') &&
        route.request().method().toUpperCase() === 'POST'
      ) {
        requestPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            request: { id: 123, company_id: requestPayload.company_id, status: 'pending' },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/select-company');
    await expect(page.locator('h1')).toContainText('Encontre a empresa que você busca');

    await page.fill('input[placeholder="Buscar por nome da empresa"]', 'voli');
    await expect(page.locator('text=Volitbras')).toBeVisible();
    await expect(page.locator('img[alt=\"Volitbras\"]')).toBeVisible();
    await page.click('button:has-text("Solicitar acesso")');

    await expect(
      page.locator('text=Solicitacao enviada para aprovacao do admin da empresa Volitbras.')
    ).toBeVisible();
    expect(queryWasSent).toBeTruthy();
    expect(requestPayload).toBeTruthy();
    expect(requestPayload.company_id).toBe(99);
  });

  test('authenticated user with owned companies skips onboarding and opens active workspace', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'jwt_token',
        value: 'fake-jwt-token',
        url: 'http://localhost:3000',
      },
    ]);

    await page.route('**/*', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/v1/auth/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 9,
              email: 'owner@example.com',
              name: 'Owner',
              role: 'company',
              status: 'active',
            },
          }),
        });
        return;
      }

      if (url.includes('/api/v1/companies/mine')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 321,
              name: 'Solar Prime',
              slug: 'solar-prime',
              city: 'Curitiba',
              state: 'PR',
              logo_url: null,
              verified: true,
              status: 'active',
            },
            {
              id: 654,
              name: 'Solar Duo',
              slug: 'solar-duo',
              city: 'Joinville',
              state: 'SC',
              logo_url: null,
              verified: true,
              status: 'active',
            },
          ]),
        });
        return;
      }

      if (url.includes('/api/v1/company_access/context')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            active_memberships: [
              {
                company_id: 321,
                company_name: 'Solar Prime',
                member_role: 'owner',
                member_status: 'active',
              },
              {
                company_id: 654,
                company_name: 'Solar Duo',
                member_role: 'owner',
                member_status: 'active',
              },
            ],
            pending_requests: [],
            suggested_companies: [],
          }),
        });
        return;
      }

      if (url.includes('/api/v1/company_access/select_active_company')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'ok', company_id: 321 }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/select-company');
    await expect(page).toHaveURL(/\/dashboard\?company_id=321/, { timeout: 10_000 });
    await expect(page.getByText('Encontre a empresa que você busca')).toHaveCount(0);
  });
});
