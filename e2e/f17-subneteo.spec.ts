import type { Page } from '@playwright/test'
import { axe, expect, fresh, test } from './fixtures'

async function open(page: Page, hash = '') {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto(`/subneteo/${hash}`)
  await expect(page.getByRole('heading', { name: 'Subneteo', level: 1 })).toBeVisible()
}
const card = (page: Page, label: string) => page.locator('div', { has: page.getByText(label, { exact: true }) }).filter({ has: page.locator('p.font-mono') }).last()

test.describe('F17 subneteo', () => {
  test('F17-H1 calcular una subred', async ({ page }) => {
    await open(page)
    const input = page.getByLabel('Dirección IPv4 y prefijo')
    await input.fill('172.16.5.200/20')
    await expect(card(page, 'Red')).toContainText('172.16.0.0')
    await expect(card(page, 'Broadcast')).toContainText('172.16.15.255')
    await expect(card(page, 'Hosts útiles')).toContainText('4094')
    await expect(card(page, 'Máscara')).toContainText('255.255.240.0')
    await expect(page).toHaveURL(/#172\.16\.5\.200\/20$/)
    // the slider moves the prefix
    await page.getByLabel(/^Prefijo/).fill('24')
    await expect(input).toHaveValue('172.16.5.200/24')
    await expect(card(page, 'Red')).toContainText('172.16.5.0')
    await page.getByRole('button', { name: 'Usar la red' }).click()
    await expect(input).toHaveValue('172.16.5.0/24')
  })

  test('F17-H2 repartir con VLSM', async ({ page }) => {
    await open(page)
    await page.getByRole('tab', { name: 'Dividir (VLSM)' }).click()
    await page.getByLabel('Red que quieres repartir').fill('192.168.1.0/24')
    await page.getByRole('button', { name: 'Añadir subred' }).click()
    await expect(page.getByLabel('Nombre de la subred 4')).toBeFocused()
    await page.getByLabel('Nombre de la subred 4').fill('Enlace')
    await page.getByLabel('Hosts de Enlace').fill('2')
    const rows = page.getByRole('table').getByRole('row')
    await expect(rows.nth(1)).toContainText('Wifi')
    await expect(rows.nth(1)).toContainText('192.168.1.0/25')
    await expect(rows.nth(4)).toContainText('192.168.1.224/30')
    await expect(page.getByText(/Cabe todo/)).toBeVisible()
    await page.getByLabel('Hosts de Wifi').fill('300')
    await expect(page.getByText(/No cabe: faltan/)).toBeVisible()
    await expect(page).toHaveURL(/#vlsm=192\.168\.1\.0\/24;/)
  })

  test('F17-H3 practicar', async ({ page }) => {
    await open(page, '#practicar')
    await expect(page.getByText(/Aciertos: 0 de 0/)).toBeVisible()
    const q = await page.locator('#practice-q').innerText()
    if (q.includes('misma subred')) await page.getByRole('button', { name: 'Sí' }).click()
    else {
      await page.getByLabel('Tu respuesta').fill('0.0.0.0')
      await page.getByRole('button', { name: 'Comprobar' }).click()
    }
    await expect(page.getByText(/Aciertos: \d de 1/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Siguiente ejercicio' })).toBeFocused()
    await page.getByRole('button', { name: 'Siguiente ejercicio' }).click()
    await expect(page.getByText(/Aciertos: \d de 1/)).toBeVisible()
  })

  test('F17-E1 entrada inválida', async ({ page }) => {
    await open(page)
    const input = page.getByLabel('Dirección IPv4 y prefijo')
    await input.fill('192.168.300.1/24')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('El octeto 3 vale 300; el máximo es 255')).toBeVisible()
    await input.fill('10.0.0.1 255.0.255.0')
    await expect(page.getByText(/no es válida/)).toBeVisible()
    await input.fill('10.0.0.6/31')
    await expect(card(page, 'Hosts útiles')).toContainText('2')
    await expect(page.getByText(/enlaces punto a punto/)).toBeVisible()
  })

  test('F17-E2 enlace directo, inglés y vuelta a las lecciones', async ({ page }) => {
    await open(page, '#10.1.2.3/8')
    await expect(page.getByLabel('Dirección IPv4 y prefijo')).toHaveValue('10.1.2.3/8')
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Subnetting', level: 1 })).toBeVisible()
    await expect(page.getByText('Usable hosts', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Español' }).click()
    await page.getByRole('button', { name: 'Protocolos', exact: true }).click()
    await page.getByRole('dialog', { name: 'Protocolos' }).getByRole('button', { name: /^DNS/ }).first().click()
    await expect(page).toHaveURL(/\/dns\/$/)
    await expect(page.getByRole('heading', { name: 'Flujo de paquetes' })).toBeVisible()
  })

  test('F17-E3 se llega desde la cabecera', async ({ page }) => {
    await fresh(page)
    await page.getByRole('link', { name: 'Subneteo' }).click()
    await expect(page).toHaveURL(/\/subneteo\//)
    await expect(page.getByRole('link', { name: 'Subneteo' })).toHaveAttribute('aria-current', 'page')
  })

  test('F17-E4 ir y volver sin recargar la página', async ({ page }) => {
    await fresh(page)
    // a full reload would wipe this marker
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1))
    const marker = () => page.evaluate(() => (window as unknown as { marker?: number }).marker)
    await page.getByRole('link', { name: 'Subneteo' }).click()
    await expect(page.getByRole('heading', { name: 'Subneteo', level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/\/subneteo\//)
    expect(await marker()).toBe(1)
    // clicking it again while there does nothing
    await page.getByRole('link', { name: 'Subneteo' }).click()
    await expect(page.getByLabel('Dirección IPv4 y prefijo')).toBeVisible()
    expect(await marker()).toBe(1)
    // back to a lesson from the menu, then Back to the calculator
    await page.getByRole('button', { name: 'Protocolos', exact: true }).click()
    await page.getByRole('dialog', { name: 'Protocolos' }).getByRole('button', { name: /^DNS/ }).first().click()
    await expect(page.getByRole('heading', { name: 'Flujo de paquetes' })).toBeVisible()
    await expect(page).toHaveURL(/\/dns\//)
    expect(await marker()).toBe(1)
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Subneteo', level: 1 })).toBeVisible()
    expect(await marker()).toBe(1)
  })

  test('F17-A1 accesibilidad y móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    for (const hash of ['', '#vlsm=10.0.0.0/24;Ventas:50;Dirección general:20', '#practicar']) {
      await open(page, hash)
      expect(await axe(page), hash || 'calculadora').toEqual([])
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, hash || 'calculadora').toBeLessThanOrEqual(0)
    }
  })
})
