import { test, expect } from '@playwright/test'

test.describe('Botão de WhatsApp', () => {
  test('Company detail abre chat com número no formato wa.me/55', async ({ page }) => {
    await page.goto('http://localhost:3000/companies/5')

    const btn = page.getByTestId('whatsapp-button')
    const exists = await btn.count()
    if (exists === 0) test.skip()

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      btn.first().click()
    ])
    await popup.waitForLoadState('domcontentloaded')
    const url = popup.url()
    expect(url).toMatch(/^https:\/\/wa\.me\/55\d{11,13}$/)
  })

  test('Company card exibe botão ou trata ausência de número', async ({ page }) => {
    await page.goto('http://localhost:3000/categories/paineis-solares')
    const btn = page.getByTestId('whatsapp-button')
    // Se existir botão, deve ter label e abrir popup
    if (await btn.count() > 0) {
      await expect(btn.first()).toBeVisible()
      await expect(btn.first()).toHaveAttribute('aria-label', 'Conversar no WhatsApp')
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        btn.first().click()
      ])
      await popup.waitForLoadState('domcontentloaded')
      expect(popup.url()).toMatch(/^https:\/\/wa\.me\//)
    }
    // Botão de orçamento deve estar sempre visível no card
    const quoteBtn = page.getByText('Solicite um orçamento')
    await expect(quoteBtn.first()).toBeVisible()
  })
})
