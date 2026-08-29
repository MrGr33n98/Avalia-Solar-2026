import { test, expect } from '@playwright/test';

test.describe('Feed premium', () => {
  test('preserva filtros compartilháveis e renderiza o envelope do feed', async ({ page }) => {
    await page.route('**/api/v1/feed**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: {
            next_cursor: null,
            has_more: false,
            trending_topics: [],
            suggested_creators: [],
            suggested_companies: [],
            suggested_groups: [],
          },
        }),
      });
    });

    await page.goto('/feed?view=recent&type=Review');
    await expect(page).toHaveURL(/view=recent.*type=Review|type=Review.*view=recent/);
    await expect(page.getByRole('button', { name: 'Recentes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avaliações' })).toBeVisible();
    await expect(page.getByText('Sem publicações no momento')).toBeVisible();
  });
});
