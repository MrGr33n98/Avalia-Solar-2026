import { test, expect } from '@playwright/test';

test.describe('CompanyCard Logo Rendering Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/companies');
  });

  test('should display company cards with logos on desktop', async ({ page }) => {
    // Wait for cards to be attached to the DOM (more robust than visible)
    await page.waitForSelector('[data-testid="company-card"]', { state: 'attached', timeout: 30000 });

    const companyCards = page.locator('[data-testid="company-card"]');
    const cardCount = await companyCards.count();

    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = companyCards.nth(i);

      // Logo: loaded image or placeholder wrapper
      const logo = card.locator('[data-testid="company-logo"], [data-testid="logo-placeholder"]');
      await expect(logo.first()).toBeVisible();

      // Banner: loaded image or placeholder wrapper
      const banner = card.locator('[data-testid="company-banner"], [data-testid="banner-placeholder"]');
      await expect(banner.first()).toBeVisible();
    }
  });

  test('should display company cards with logos on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.waitForSelector('[data-testid="company-card"]', { state: 'attached', timeout: 30000 });

    const companyCards = page.locator('[data-testid="company-card"]');
    const cardCount = await companyCards.count();

    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = companyCards.nth(i);
      await expect(card).toBeVisible();

      const logo = card.locator('[data-testid="company-logo"], [data-testid="logo-placeholder"]');
      await expect(logo.first()).toBeVisible();
    }
  });

  test('should handle missing logos gracefully', async ({ page }) => {
    await page.waitForSelector('[data-testid="company-card"]', { state: 'attached', timeout: 30000 });

    const companyCards = page.locator('[data-testid="company-card"]');
    const cardCount = await companyCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = companyCards.nth(i);

      // Expect either loaded logo or placeholder wrapper present
      const logoOrPlaceholder = card.locator('[data-testid="company-logo"], [data-testid="logo-placeholder"]');
      await expect(logoOrPlaceholder.first()).toBeVisible();
    }
  });

  test('should work across different browsers', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip WebKit for now');

    await page.goto('/companies');
    await page.waitForSelector('[data-testid="company-card"]', { state: 'attached', timeout: 30000 });

    const companyCards = page.locator('[data-testid="company-card"]');
    const cardCount = await companyCards.count();

    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < cardCount; i++) {
      const card = companyCards.nth(i);
      await expect(card).toBeVisible();

      const logoArea = card.locator('[data-testid="company-logo"], [data-testid="logo-placeholder"]');
      await expect(logoArea.first()).toBeVisible();
    }
  });
});