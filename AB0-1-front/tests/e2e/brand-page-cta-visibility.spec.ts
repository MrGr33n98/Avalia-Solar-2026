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

    // Compare is borderless and right-aligned; review moves beside favorite on mobile.
    const identity = page.locator('#company-identity-card');
    const secondary = hero.getByTestId('company-secondary-ctas');
    await expect(secondary).toHaveClass(/justify-end/);
    const compare = secondary.getByRole('checkbox', { name: /à comparação/i });
    await expect(compare).toBeAttached();
    await expect(secondary.getByText('Comparar')).toBeVisible();
    const compareLabel = secondary.locator('label').filter({ hasText: 'Comparar' });
    await expect(compareLabel).toHaveCount(1);
    await expect(compareLabel).not.toHaveClass(/border-slate/);

    if (width < 1024) {
      const mobileStar = identity.getByRole('link', { name: /Avaliar empresa:/ });
      await expect(mobileStar).toBeVisible();
      await expect(mobileStar).toHaveAttribute('href', /\/review(?:\/|$)/);
      await expect(mobileStar.locator('svg')).toHaveCount(1);
      await expect(mobileStar).toHaveText('');
      await expect(identity.getByRole('button', { name: 'Favoritar empresa' })).toBeVisible();
      await expect(hero.getByRole('link', { name: /Avaliar empresa:/ })).toHaveCount(0);
    } else {
      await expect(hero.getByRole('link', { name: /Avaliar empresa:/ })).toBeVisible();
      await expect(identity.getByRole('button', { name: 'Compartilhar empresa' })).toBeVisible();
    }

    const quote = hero.getByRole('button', { name: 'Solicitar orçamento' });
    if (await quote.count()) {
      const bounds = await quote.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.height).toBeGreaterThanOrEqual(40);
      expect(bounds!.height).toBeLessThanOrEqual(44.5);
    }

    const horizontalOverflow = await page.evaluate(() => (
      document.documentElement.scrollWidth > window.innerWidth + 2
    ));
    expect(horizontalOverflow).toBe(false);
  });
}
