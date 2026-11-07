import { expect, test } from '@playwright/test';

test.describe('Founder 2026 — G2 editorial mobile-first redesign', () => {
  test('desktop renders the editorial sections in buyer-friendly order and a contextual index', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const shell = page.locator('main#founder-conteudo');
    await expect(shell).toBeVisible();
    const aside = page.getByRole('complementary', { name: 'Nesta página' });
    await expect(aside).toBeVisible();
    await expect(aside.getByRole('link', { name: 'Como começar' })).toHaveAttribute('href', '#founder-processo');
    await expect(aside.getByRole('link', { name: 'Tour da Brand Page' })).toHaveAttribute('href', '#founder-tour');

    const orderedIds = await shell.locator(':scope > div[id]').evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(orderedIds).toEqual([
      'founder-processo', 'founder-metodologia', 'founder-tour',
      'founder-comparador', 'founder-conversao',
    ]);
    await expect(page.getByRole('heading', { name: /Plano Founder Avalia Solar:/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Agendar Apresentação Executiva/ })).toHaveAttribute('href', 'https://zbooking.us/6shCH');
  });

  test('mobile presents a compact accessible section index and no document-level overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const index = page.locator('details').filter({ has: page.getByText('Explore as seções do Plano Founder') });
    await expect(index.locator('summary')).toBeVisible();
    await index.locator('summary').click();
    await expect(index.getByRole('link', { name: 'Antes e depois' })).toBeVisible();
    await index.getByRole('link', { name: 'Antes e depois' }).click();
    await expect(index).not.toHaveAttribute('open', '');

    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `overflow horizontal em ${width}px`).toBe(false);
    }
  });

  test('preserves interactive tours, comparison, keyboard and prefers-reduced-motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });

    const journey = page.getByRole('tablist', { name: 'Etapas da metodologia Founder' });
    await expect(journey.getByRole('tab')).toHaveCount(7);
    await journey.getByRole('tab').nth(1).click();
    await expect(journey.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');

    const compare = page.locator('#comparador-visual');
    await compare.scrollIntoViewIfNeeded();
    await expect(compare).toBeVisible();
    await compare.getByRole('button', { name: 'Comparar com divisor' }).click();
    await expect(compare.getByRole('slider')).toBeVisible();

    const tour = page.locator('#tour-interativo');
    await tour.scrollIntoViewIfNeeded();
    await expect(tour.getByRole('button', { name: 'Próximo recurso' })).toBeVisible();
    await tour.getByRole('button', { name: 'Próximo recurso' }).click();
    await expect(tour.getByText('02 / 10')).toBeVisible();
  });

  test('preserves semantic FAQ interaction and commercial link', async ({ page }) => {
    await page.goto('/founder', { waitUntil: 'domcontentloaded' });
    const faq = page.locator('#founder-faq');
    const question = faq.getByRole('button', { name: 'O que é exatamente o Plano Founder da Avalia Solar?' });
    await expect(question).toHaveAttribute('aria-expanded', 'false');
    await question.click();
    await expect(question).toHaveAttribute('aria-expanded', 'true');
    const answerId = await question.getAttribute('aria-controls');
    expect(answerId).toBeTruthy();
    await expect(page.locator(`#${answerId}`)).toBeVisible();
    await expect(page.locator('#founder-agendar').getByRole('link', { name: 'Agendar apresentação' })).toHaveAttribute(
      'href', 'https://zbooking.us/6shCH'
    );
  });
});
