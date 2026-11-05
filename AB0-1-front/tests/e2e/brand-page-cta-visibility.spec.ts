import { expect, test } from '@playwright/test';

const viewports = [320, 360, 390, 430, 768, 1440];

for (const width of viewports) {
  test('Brand Page CTA single WhatsApp and contact details — ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/companies/kaju-energia-solar', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('#company-cta-group');
    await expect(hero).toBeVisible();

    // The WhatsApp contact exists on the hero only when entitled and configured.
    const heroWhatsApp = hero.getByRole('link', { name: /no WhatsApp/i });
    const whatsappCount = await heroWhatsApp.count();
    expect(whatsappCount).toBeLessThanOrEqual(1);
    if (whatsappCount === 1) {
      await expect(heroWhatsApp.first()).toHaveAttribute('href', /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//);
      await expect(heroWhatsApp.first()).toHaveAttribute('rel', /noopener/);
    }

    for (const contactCard of await page.getByTestId('company-contact-card').all()) {
      await expect(contactCard.getByRole('link', { name: /WhatsApp/i })).toHaveCount(0);
      await expect(contactCard).not.toContainText('Falar no WhatsApp');
    }

    // Always-on comparison and review actions remain available.
    await expect(hero.getByRole('link', { name: /Avaliar empresa/i })).toBeVisible();
    await expect(hero.getByText('Comparar')).toBeVisible();

    const horizontalOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth > window.innerWidth + 2
    ));
    expect(horizontalOverflow).toBe(false);
  });
}
