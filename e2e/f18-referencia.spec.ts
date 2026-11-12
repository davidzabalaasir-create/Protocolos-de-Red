import type { Page } from '@playwright/test'
import { axe, expect, fresh, test } from './fixtures'

async function open(page: Page, hash = '') {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto(`/referencia/${hash}`)
  await expect(page.getByRole('heading', { name: 'Referencia', level: 1 })).toBeVisible()
}

test.describe('F18 referencia', () => {
  test('F18-H1 buscar en la chuleta y saltar a una lección', async ({ page }) => {
    await open(page)
    await expect(page.getByRole('heading', { name: 'Puertos conocidos' })).toBeVisible()
    const search = page.getByLabel('Buscar en las tablas')
    await search.fill('distancias')
    await expect(page.getByText(/filas encontradas/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Distancias administrativas' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Puertos conocidos' })).toBeHidden()
    await search.fill('inventado-que-no-existe')
    await expect(page.getByText(/Sin resultados para/)).toBeVisible()
    await search.fill('')
    // the first cell links to the lesson, in the same page (no reload)
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1))
    await page.getByRole('link', { name: 'DNS', exact: true }).click()
    await expect(page).toHaveURL(/\/dns\/$/)
    await expect(page.getByRole('heading', { name: 'Flujo de paquetes' })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1)
  })

  test('F18-H2 una tanda de flashcards, con progreso guardado', async ({ page }) => {
    await open(page, '#repasar')
    await page.getByLabel('Tema', { exact: true }).selectOption({ label: 'Modelo OSI y PDU' })
    await expect(page.getByText('Total').locator('..').getByText('6')).toBeVisible()
    await page.getByRole('button', { name: 'Empezar (6 tarjetas)' }).click()
    await expect(page.getByText('Tarjeta 1 de 6')).toBeVisible()
    // first card: miss it on purpose → it comes back at the end of the batch
    await page.getByRole('button', { name: 'Mostrar respuesta' }).click()
    await page.getByRole('button', { name: 'No la sabía', exact: true }).click()
    for (let i = 0; i < 8; i++) {
      if (await page.getByText(/Tanda terminada/).isVisible()) break
      await page.getByRole('button', { name: 'Mostrar respuesta' }).click()
      await page.getByRole('button', { name: 'La sabía', exact: true }).click()
    }
    await expect(page.getByText('Tanda terminada: 6 tarjetas, 1 fallos.')).toBeVisible()
    await page.getByRole('button', { name: 'Volver al resumen' }).click()
    // everything studied: nothing new, nothing due, and the free-review button appears
    await expect(page.getByRole('button', { name: /Repaso libre/ })).toBeVisible()
    // the progress survives a reload
    await page.reload()
    await page.getByLabel('Tema', { exact: true }).selectOption({ label: 'Modelo OSI y PDU' })
    await expect(page.getByRole('button', { name: /Repaso libre/ })).toBeVisible()
  })

  test('F18-E1 enlace directo a la pestaña de repaso', async ({ page }) => {
    await open(page, '#repasar')
    await expect(page.getByRole('tab', { name: 'Repasar' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByLabel('Tema', { exact: true })).toBeVisible()
  })

  test('F18-E2 ir y volver entre secciones sin recargar', async ({ page }) => {
    await fresh(page)
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1))
    const marker = () => page.evaluate(() => (window as unknown as { marker?: number }).marker)
    await page.getByRole('link', { name: 'Referencia' }).click()
    await expect(page.getByRole('heading', { name: 'Referencia', level: 1 })).toBeVisible()
    expect(await marker()).toBe(1)
    await page.getByRole('link', { name: 'Subneteo' }).click()
    await expect(page.getByRole('heading', { name: 'Subneteo', level: 1 })).toBeVisible()
    expect(await marker()).toBe(1)
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Referencia', level: 1 })).toBeVisible()
    expect(await marker()).toBe(1)
  })

  test('F18-E3 en inglés', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Reference', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Well-known ports' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Administrative distances' })).toBeVisible()
    await page.getByRole('tab', { name: 'Review' }).click()
    await page.getByLabel('Topic', { exact: true }).selectOption({ label: 'OSI model and PDUs' })
    await page.getByRole('button', { name: 'Start (6 cards)' }).click()
    await expect(page.getByText('Card 1 of 6')).toBeVisible()
    await page.getByRole('button', { name: 'Show answer' }).click()
    await expect(page.getByRole('button', { name: 'Knew it' })).toBeVisible()
  })

  test('F18-A1 accesibilidad y móvil', async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: 375, height: 800 })
    for (const hash of ['', '#repasar']) {
      await open(page, hash)
      expect(await axe(page), hash || 'chuleta').toEqual([])
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, hash || 'chuleta').toBeLessThanOrEqual(0)
    }
  })
})
