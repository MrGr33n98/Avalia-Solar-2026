import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Spec 021 / T043–T044 — matriz do playground: 5 blocos × 2 temas × 8 larguras.
// Requer `npm run build:playground` (gera dist/playground.html, servido em 127.0.0.1).
const ITEMS = ['solar-company-card', 'solar-company-list', 'company-comparison-table', 'review-distribution', 'evidence-card'];
const WIDTHS = [280, 320, 360, 390, 480, 720, 960, 1120];
const THEMES = ['light', 'dark'] as const;
const hasPlayground = fs.existsSync(path.resolve(process.cwd(), 'dist/playground.html'));

test.skip(!hasPlayground, 'dist/playground.html ausente: rode npm run build:playground');

for (const item of ITEMS) {
  for (const theme of THEMES) {
    test(`${item} (${theme}) sem overflow em 8 larguras e sem violação axe serious/critical`, async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      for (const width of WIDTHS) {
        await page.goto(`/playground.html?item=${item}&theme=${theme}&width=${width}&state=ready`);
        const frame = page.locator(`[data-registry-preview="${item}"]`);
        await expect(frame).toBeVisible();
        const overflow = await frame.evaluate((el) => el.scrollWidth - el.clientWidth);
        expect(overflow, `${item} ${theme} ${width}px`).toBeLessThanOrEqual(1);
        if (width === 390 || width === 960) {
          await page.getByTestId('preview').screenshot({
            path: `test-results/registry/${item}-${theme}-${width}.png`,
            animations: 'disabled',
          });
        }
      }

      await page.goto(`/playground.html?item=${item}&theme=${theme}&width=360&state=ready`);
      const results = await new AxeBuilder({ page }).include('[data-testid="preview"]').analyze();
      const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(blocking.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
}

for (const state of ['loading', 'empty', 'error'] as const) {
  test(`estado ${state} renderiza sem dados inventados`, async ({ page }) => {
    await page.goto(`/playground.html?item=solar-company-list&theme=light&width=390&state=${state}`);
    const frame = page.locator('[data-registry-preview="solar-company-list"]');
    await expect(frame).toBeVisible();
    await expect(frame.getByRole('article')).toHaveCount(0);
    if (state === 'error') await expect(frame.getByRole('alert')).toBeVisible();
    if (state !== 'error') await expect(frame.getByRole('status').first()).toBeVisible();
  });
}

test('playground sinaliza permanentemente FIXTURE / NÃO PRODUÇÃO', async ({ page }) => {
  await page.goto('/playground.html');
  await expect(page.getByText('FIXTURE / NÃO PRODUÇÃO')).toBeVisible();
});
