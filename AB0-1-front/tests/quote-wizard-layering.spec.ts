import { test, expect } from '@playwright/test'

test.describe('Quote wizard - layering', () => {
  test('aparece acima dos cards na p\u00e1gina de categorias', async ({ page }) => {
    await page.goto('http://localhost:3000/categories')

    // Garante que existem cards com bot\u00e3o "Or\u00e7amento"
    const quoteBtn = page.getByRole('button', { name: /orcamento/i }).first()
    await expect(quoteBtn).toBeVisible()

    await quoteBtn.click()

    // O dialog deve ficar vis\u00edvel e \u00e0 frente
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verifica se a overlay foi aplicada (body fica com overflow bloqueado)
    const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow)
    expect(bodyOverflow).not.toBe('visible')
  })
})

