import { readFileSync } from 'node:fs'
import { axe, expect, fresh, stepBtn, test } from './fixtures'

test.describe('F04 quiz y progreso', () => {
  test('F04-H1 completar DNS y conservar el progreso', async ({ page }) => {
    await fresh(page, 'dns')
    for (let i = 0; i < 8; i++) await stepBtn(page).click()
    await page.getByRole('tab', { name: 'Quiz' }).click()
    await page.getByRole('button', { name: 'A un servidor raíz' }).click()
    await page.getByRole('button', { name: 'Cuánto tiempo puede guardarse en caché' }).click()
    await expect(page.getByText(/Resultado: 2\/2/)).toBeVisible()
    await page.reload()
    await page.getByRole('button', { name: 'Protocolos', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Protocolos' }).getByText(/^1\/\d+ completados$/)).toBeVisible()
  })

  test('F04-E1 doble clic en una respuesta', async ({ page }) => {
    await fresh(page, 'dns')
    await page.getByRole('tab', { name: 'Quiz' }).click()
    await page.getByRole('button', { name: 'Al servidor web' }).dblclick()
    await page.getByRole('button', { name: 'Cuánto tiempo puede guardarse en caché' }).click()
    await expect(page.getByText(/Resultado: 1\/2/)).toBeVisible()
  })
})

test.describe('F05 ajustes que se recuerdan', () => {
  test('F05-H1 idioma inglés', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Packet flow' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Packet flow' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('F05-H2 tema claro', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: 'Tema claro' }).click()
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('F05-H3 vista y velocidad', async ({ page }) => {
    await fresh(page)
    await page.getByRole('tab', { name: 'Secuencia' }).click()
    await page.getByRole('radio', { name: '2×' }).click()
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Secuencia' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('radio', { name: '2×' })).toHaveAttribute('aria-checked', 'true')
  })

  test('F05-H4 modo foco', async ({ page }) => {
    await fresh(page)
    await expect(page.getByRole('complementary', { name: 'Panel del protocolo' })).toBeVisible()
    await page.getByRole('button', { name: 'Modo foco' }).click()
    await expect(page.getByRole('complementary', { name: 'Panel del protocolo' })).toHaveCount(0)
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('f')
    await expect(page.getByRole('complementary', { name: 'Panel del protocolo' })).toBeVisible()
  })
})

test.describe('F06 recorrido guiado', () => {
  test('F06-H1 empezar y avanzar', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: 'Protocolos', exact: true }).click()
    await page.getByRole('button', { name: /Empezar el recorrido guiado/ }).click()
    const tour = page.getByRole('navigation', { name: 'Recorrido guiado' })
    await expect(tour.getByText('Recorrido guiado · 1/15')).toBeVisible()
    await tour.getByRole('button', { name: 'ARP', exact: true }).click()
    await expect(page).toHaveURL(/#arp$/)
  })
})

test.describe('F07 descargar la captura', () => {
  test('F07-H1 pcapng válido', async ({ page }) => {
    await fresh(page)
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Descargar la captura/ }).click()])
    expect(download.suggestedFilename()).toBe('protocolos-de-red-http.pcapng')
    const bytes = readFileSync((await download.path())!)
    expect(bytes.readUInt32LE(0)).toBe(0x0a0d0d0a)
    expect(bytes.length).toBeGreaterThan(500)
  })
})

test.describe('F08 accesibilidad', () => {
  test('F08-H1 axe en las pantallas principales', async ({ page }) => {
    await fresh(page)
    await stepBtn(page).click()
    expect(await axe(page), 'pantalla principal').toEqual([])
    await page.getByRole('tab', { name: 'Inspector' }).click()
    expect(await axe(page), 'inspector').toEqual([])
    await page.getByRole('tab', { name: 'Quiz' }).click()
    expect(await axe(page), 'quiz').toEqual([])
    await page.getByRole('button', { name: 'Protocolos', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Protocolos' })).toBeVisible()
    expect(await axe(page), 'lista de protocolos').toEqual([])
  })

  test('F08-E1 saltar al contenido es lo primero', async ({ page }) => {
    await fresh(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused()
  })
})

test.describe('F09 móvil', () => {
  test('F09-H1 sin desbordamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await fresh(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible()
  })
})
