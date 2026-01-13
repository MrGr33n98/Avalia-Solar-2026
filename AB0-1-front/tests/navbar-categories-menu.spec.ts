import { test, expect } from '@playwright/test'

test.describe('Navbar - menu de categorias', () => {
  test('abre e fecha o dropdown no desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/categories')

    const trigger = page.getByTestId('categories-dropdown-trigger')
    await expect(trigger).toBeVisible()

    await trigger.click()
    await expect(page.getByTestId('categories-dropdown-menu')).toBeVisible()

    // click fora fecha
    await page.mouse.click(5, 5)
    await expect(page.getByTestId('categories-dropdown-menu')).toBeHidden()
  })

  test('abre o dropdown no mobile dentro do menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000/categories')

    // abre menu mobile
    await page.getByTestId('mobile-menu-button').click()
    // fallback mais robusto: primeiro bot\u00e3o no navbar que alterna mobile menu (lucide Menu)
    const mobileMenu = page.getByTestId('mobile-menu')
    await expect(mobileMenu).toBeVisible()

    const trigger = page.getByTestId('categories-dropdown-trigger-mobile')
    await trigger.click()
    await expect(page.getByTestId('categories-dropdown-menu-mobile')).toBeVisible()
  })
})
