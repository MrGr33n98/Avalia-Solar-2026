import { test, expect } from '@playwright/test'

test.describe('Categoria - banners e logos', () => {
  const categoryUrl = 'http://localhost:3000/categories/paineis-solares'

  test('Banner de categoria deve carregar ou exibir fallback', async ({ page }) => {
    await page.goto(categoryUrl)
    const bannerImg = page.locator('img[alt^="Banner da categoria"]')
    const exists = await bannerImg.count()
    if (exists > 0) {
      await expect(bannerImg.first()).toBeVisible()
    } else {
      // Fallback: container presente mesmo sem imagem
      const container = page.locator('div.relative.w-full.h-48')
      await expect(container.first()).toBeVisible()
    }
  })

  test('Logos e banners de empresas renderizam ou placeholders', async ({ page }) => {
    await page.goto(categoryUrl)
    const cards = page.locator('[data-testid="company-card"]')
    await expect(cards.first()).toBeVisible()

    const logos = page.locator('[data-testid="company-logo"]')
    const banners = page.locator('[data-testid="company-banner"]')

    // Pelo menos um logo ou placeholder deve existir
    await expect(logos.or(page.locator('[data-testid="logo-placeholder"]')).first()).toBeVisible()

    // Banners podem não existir; quando existir, deve estar visível
    if (await banners.count() > 0) {
      await expect(banners.first()).toBeVisible()
    }
  })
})

