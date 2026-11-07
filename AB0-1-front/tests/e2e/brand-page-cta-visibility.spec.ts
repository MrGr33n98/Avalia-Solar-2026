import { expect, test } from '@playwright/test';

const viewports = [320, 360, 390, 430, 768, 1440];

for (const width of viewports) {
  test(`Brand Page quick actions and paid CTAs — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/companies/kaju-energia-solar', { waitUntil: 'domcontentloaded' });

    const identity = page.locator('#company-identity-card');
    await expect(identity).toBeVisible();

    const actions = identity.getByTestId('company-quick-actions');
    const comparison = actions.getByRole('checkbox', { name: /à comparação/i });
    const compareAction = actions.getByTestId('company-compare-action');
    const favorite = actions.getByRole('button', { name: 'Favoritar empresa' });
    const share = actions.getByRole('button', { name: 'Compartilhar empresa' });
    const review = actions.getByRole('link', { name: /Avaliar empresa:/ });

    await expect(comparison).toBeAttached();
    await expect(compareAction.getByText('Comparar')).toBeVisible();
    await expect(favorite).toBeVisible();
    await expect(share).toBeVisible();
    await expect(review).toBeVisible();
    await expect(review).toHaveText('');
    await expect(review).toHaveAttribute('href', /\/review(?:\/|$)/);

    // One and only one Compare checkbox lives at the beginning of the upper shelf.
    const firstAction = await actions.evaluate(el => el.firstElementChild?.getAttribute('data-testid'));
    expect(firstAction).toBe('company-compare-action');
    await expect(identity.getByRole('checkbox')).toHaveCount(1);
    await expect(identity.getByRole('link', { name: /Avaliar empresa:/ })).toHaveCount(1);
    const compareLabel = compareAction.locator('label');
    await expect(compareLabel).not.toHaveClass(/border-slate/);

    for (const control of [favorite, share, review]) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    const primary = identity.locator('#company-cta-group');
    await expect(primary.getByRole('checkbox')).toHaveCount(0);
    await expect(primary.getByRole('link', { name: /Avaliar empresa:/ })).toHaveCount(0);
    const whatsapp = primary.getByRole('link', { name: /no WhatsApp/i });
    expect(await whatsapp.count()).toBeLessThanOrEqual(1);
    if (await whatsapp.count()) {
      await expect(whatsapp).toHaveAttribute('href', /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//);
      await expect(whatsapp).toHaveAttribute('rel', /noopener/);
    }
    for (const contactCard of await page.getByTestId('company-contact-card').all()) {
      await expect(contactCard.getByRole('link', { name: /WhatsApp/i })).toHaveCount(0);
    }

    const quote = primary.getByRole('button', { name: 'Solicitar orçamento' });
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
