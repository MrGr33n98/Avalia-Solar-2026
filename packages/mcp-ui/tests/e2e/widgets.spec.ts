import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  FIXTURE_CATEGORIES,
  FIXTURE_COMPARE,
  FIXTURE_INTEGRATORS,
  FIXTURE_PROFILE,
  FIXTURE_REPUTATION_LARGE,
  FIXTURE_REPUTATION_ZERO,
} from '../../src/fixtures/staging-fixtures';

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 700 },
  { name: 'mobile-375', width: 375, height: 760 },
  { name: 'tablet-480', width: 480, height: 800 },
  { name: 'slot-640', width: 640, height: 800 },
  { name: 'tablet-768', width: 768, height: 900 },
  { name: 'desktop-1024', width: 1024, height: 900 },
];

const SURFACES = [
  { file: 'search.v1.html', fixture: FIXTURE_INTEGRATORS, heading: /Integradores Solares/i },
  { file: 'profile.v1.html', fixture: FIXTURE_PROFILE, heading: /Perfil Público/i },
  { file: 'reputation.v1.html', fixture: FIXTURE_REPUTATION_LARGE, heading: /Reputação Pública/i },
  { file: 'compare.v1.html', fixture: FIXTURE_COMPARE, heading: /Comparação \(3 integradores\)/i },
  { file: 'categories.v1.html', fixture: FIXTURE_CATEGORIES, heading: /Categorias Solares/i },
];

for (const surface of SURFACES) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${surface.file} passes axe WCAG AA and layout checks in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 900 });
      await page.addInitScript(
        ({ payload, mode }) => {
          window.__AVALIA_MCP_HARNESS__ = {
            toolOutput: payload,
            theme: mode,
            displayMode: 'inline',
          };
        },
        { payload: surface.fixture, mode: theme }
      );

      await page.goto(`/${surface.file}`);
      await expect(page.getByRole('heading', { name: surface.heading })).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(seriousOrCritical).toEqual([]);

      await page.screenshot({
        path: `test-results/${surface.file.replace('.v1.html', '')}-${theme}-768.png`,
        fullPage: false,
        animations: 'disabled',
      });
    });
  }
}

for (const vp of VIEWPORTS) {
  test(`search.v1.html has zero horizontal overflow at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.addInitScript(
      ({ payload }) => {
        window.__AVALIA_MCP_HARNESS__ = {
          toolOutput: payload,
          theme: 'light',
        };
      },
      { payload: FIXTURE_INTEGRATORS }
    );

    await page.goto('/search.v1.html');
    await expect(page.getByText('Solar Staging Alfa LTDA')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);

    if (vp.width === 375 || vp.width === 1024) {
      await page.screenshot({
        path: `test-results/search-light-${vp.width}.png`,
        fullPage: true,
      });
    }
  });
}

test('reputation.v1.html shows Sem avaliações (0) when zero approved reviews and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 480, height: 700 });
  await page.addInitScript(
    ({ payload }) => {
      window.__AVALIA_MCP_HARNESS__ = {
        toolOutput: payload,
        theme: 'light',
      };
    },
    { payload: FIXTURE_REPUTATION_ZERO }
  );

  await page.goto('/reputation.v1.html');
  await expect(page.getByText(/Sem avaliações \(0\)/i)).toBeVisible();
  await expect(page.getByText(/Nota não atribuída/i)).toBeVisible();
});

test('interactive search -> compare flow works via host bridge in real compiled HTML', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.addInitScript(
    ({ initialPayload, comparePayload }) => {
      window.__AVALIA_MCP_HARNESS__ = {
        toolOutput: initialPayload,
        theme: 'light',
        callTool: async (name) => {
          if (name === 'compare_integrators') {
            return { structuredContent: comparePayload };
          }
          return { structuredContent: initialPayload };
        },
      };
    },
    { initialPayload: FIXTURE_INTEGRATORS, comparePayload: FIXTURE_COMPARE }
  );

  await page.goto('/search.v1.html');
  const checkboxes = page.getByRole('checkbox', { name: /Comparar/i });
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.getByRole('button', { name: /Comparar \(2\)/i }).click();

  await expect(page.getByText(/Comparação \(3 integradores\)/i)).toBeVisible();
  await expect(page.getByText(/sem vencedor absoluto/i)).toBeVisible();
});

