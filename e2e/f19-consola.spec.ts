import type { Page } from '@playwright/test'
import { axe, expect, fresh, test } from './fixtures'

async function open(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/consola/')
  await expect(page.getByRole('heading', { name: 'Consola', level: 1 })).toBeVisible()
}
const input = (page: Page, dev = 'R1') => page.getByLabel(`Línea de comandos de ${dev}`)
const type = async (page: Page, cmd: string, dev = 'R1') => {
  await input(page, dev).fill(cmd)
  await input(page, dev).press('Enter')
}

test.describe('F19 consola', () => {
  test('F19-H1 comandos show en el router y retos que se marcan', async ({ page }) => {
    await fresh(page)
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1))
    await page.getByRole('link', { name: 'Consola', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Consola', level: 1 })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1)

    await expect(page.getByText('0/8 completados')).toBeVisible()
    await type(page, 'enable')
    await expect(page.getByText('R1#', { exact: true })).toBeVisible()
    await type(page, 'sh ip int br')
    await expect(page.getByText(/GigabitEthernet0\/0\s+192\.168\.1\.1/)).toBeVisible()
    await type(page, 'ping 8.8.8.8')
    await expect(page.getByText(/Success rate is 100 percent/)).toBeVisible()
    await expect(page.getByText('3/8 completados')).toBeVisible()
  })

  test('F19-H2 switch: VLAN nueva, reto guardado tras recargar', async ({ page }) => {
    await open(page)
    await page.getByRole('tab', { name: 'SW1 · Switch' }).click()
    await type(page, 'show vlan brief', 'SW1')
    await expect(page.getByText(/20\s+Impresoras/)).toBeVisible()
    for (const cmd of ['enable', 'conf t', 'vlan 30', 'name Invitados']) await type(page, cmd, 'SW1')
    await expect(page.getByText('SW1(config-vlan)#', { exact: true })).toBeVisible()
    await expect(page.getByText('3/8 completados')).toBeVisible() // vlan brief + enable + crear la VLAN
    await page.reload()
    await expect(page.getByText('3/8 completados')).toBeVisible()
  })

  test('F19-E1 ayuda con ?, autocompletar con Tab e historial', async ({ page }) => {
    await open(page)
    await input(page).press('Shift+?')
    await expect(page.getByText(/ping/).first()).toBeVisible()
    await expect(page.getByText('Comprobar si una IP responde')).toBeVisible()
    await input(page).pressSequentially('pi')
    await input(page).press('Tab')
    await expect(input(page)).toHaveValue('ping ')
    await input(page).fill('ping 192.168.1.10')
    await input(page).press('Enter')
    await input(page).press('ArrowUp')
    await expect(input(page)).toHaveValue('ping 192.168.1.10')
  })

  test('F19-E2 comando desconocido e incompleto', async ({ page }) => {
    await open(page)
    await type(page, 'show')
    await expect(page.getByText('% Incomplete command.')).toBeVisible()
    await type(page, 'patata')
    await expect(page.getByText(/% Invalid input/)).toBeVisible()
  })

  test('F19-E3 en inglés', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Console', level: 1 })).toBeVisible()
    await expect(page.getByText('Challenges')).toBeVisible()
    await page.getByLabel('R1 command line').press('Shift+?')
    await expect(page.getByText('Check whether an IP answers')).toBeVisible()
  })

  test('F19-A1 accesibilidad y móvil', async ({ page }) => {
    test.slow()
    await page.setViewportSize({ width: 375, height: 800 })
    await open(page)
    expect(await axe(page)).toEqual([])
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
