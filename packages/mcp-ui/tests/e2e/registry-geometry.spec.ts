import { expect, test } from '@playwright/test';
import { FIXTURE_INTEGRATORS } from '../../src/fixtures/staging-fixtures';

// Spec 021 / T011 — `.as-frame` declara `container-type`, mas as regras de padding
// do próprio frame estavam dentro de `@container widget`, que só consulta ancestrais.
const CASES = [
  { width: 320, padding: '12px' },
  { width: 480, padding: '16px' },
  { width: 768, padding: '18px' },
  { width: 1024, padding: '24px' },
];

for (const item of CASES) {
  test(`as-frame aplica padding responsivo ${item.padding} em ${item.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: item.width, height: 800 });
    await page.addInitScript((payload) => {
      window.__AVALIA_MCP_HARNESS__ = { toolOutput: payload, theme: 'light', displayMode: 'inline' };
    }, FIXTURE_INTEGRATORS);
    await page.goto('/search.v1.html');
    const frame = page.locator('.as-frame').first();
    await expect(frame).toBeVisible();
    const padding = await frame.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(padding).toBe(item.padding);
  });
}

test('tokens tipográficos e de espaçamento existem sem quebrar aliases legados', async ({ page }) => {
  await page.addInitScript((payload) => {
    window.__AVALIA_MCP_HARNESS__ = { toolOutput: payload, theme: 'light', displayMode: 'inline' };
  }, FIXTURE_INTEGRATORS);
  await page.goto('/search.v1.html');
  const values = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const names = [
      '--as-space-1',
      '--as-space-2',
      '--as-space-3',
      '--as-space-4',
      '--as-space-6',
      '--as-type-heading-2',
      '--as-type-heading-3',
      '--as-type-body',
      '--as-type-caption',
      '--as-brand-primary',
      '--as-bg',
      '--as-radius',
    ];
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
  });
  for (const [name, value] of Object.entries(values)) {
    expect(value, name).not.toBe('');
  }
  const title = page.locator('.as-title-lg').first();
  await expect(title).toHaveCSS('font-size', '18px');
  await expect(title).toHaveCSS('line-height', '24px');
});
