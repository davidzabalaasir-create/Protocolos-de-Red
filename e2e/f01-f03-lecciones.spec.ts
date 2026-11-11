import { expect, fresh, openList, stepBtn, test } from './fixtures'

test.describe('F01 elegir una lección', () => {
  test('F01-H1 desde la lista de protocolos', async ({ page }) => {
    await fresh(page)
    const list = await openList(page)
    await list.getByRole('button', { name: /^DNS Sistema/ }).click()
    await expect(page).toHaveURL(/#dns$/)
    await expect(page.getByText('Sistema de nombres de dominio').first()).toBeVisible()
  })

  test('F01-H2 buscar y abrir con Enter', async ({ page }) => {
    await fresh(page)
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('combobox', { name: 'Buscar protocolos' })).toBeFocused()
    await page.keyboard.type('quic')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#http3$/)
  })

  test('F01-H3 filtrar por capa OSI', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: /^Capa 2, Enlace de datos/ }).click()
    const list = (page.viewportSize()?.width ?? 0) >= 1280 ? page.getByRole('complementary', { name: 'Protocolos' }) : page.getByRole('dialog', { name: 'Protocolos' })
    await expect(list.getByText('Filtrado: capa 2 · Enlace de datos')).toBeVisible()
    await expect(list.getByRole('button', { name: /^ARP/ })).toBeVisible()
    await expect(list.getByRole('button', { name: /^HTTP / })).toHaveCount(0)
  })

  test('F01-E1 enlace a un protocolo que no existe', async ({ page }) => {
    await fresh(page, 'noexiste')
    await expect(page.getByRole('heading', { name: 'Flujo de paquetes' })).toBeVisible()
    await expect(page.getByRole('img', { name: /Diagrama de red de HTTP/ })).toBeVisible()
  })

  test('F01-E2 búsqueda con acentos y sin resultados', async ({ page }) => {
    await fresh(page)
    const search = page.getByRole('combobox', { name: 'Buscar protocolos' })
    await search.fill('CONEXIÓN')
    await search.fill('zzzz-ñ-🙂')
    await expect(page.getByText('Sin resultados')).toBeVisible()
  })

  test('F01-E3 cambiar el hash sin recargar', async ({ page }) => {
    await fresh(page)
    await page.evaluate(() => (location.hash = 'tcp'))
    await expect(page.getByRole('img', { name: /Diagrama de red de TCP/ })).toBeVisible()
  })
})

test.describe('F02 reproducir una lección', () => {
  test('F02-H1 avanzar paso a paso', async ({ page }) => {
    await fresh(page)
    for (let i = 0; i < 3; i++) await stepBtn(page).click()
    await expect(page.getByRole('progressbar', { name: 'Progreso de la captura' })).toHaveAttribute('aria-valuetext', 'Paquete 3 de 8')
    await expect(page.getByText('Explicación')).toBeVisible()
    const card = page.getByRole('region', { name: 'Etapa actual' })
    await expect(card).toContainText('Etapa 2 de 3')
    await expect(card).toContainText('Conexión TCP')
  })

  test('F02-H2 reproducir hasta el final a 2×', async ({ page }) => {
    await fresh(page)
    await page.getByRole('radio', { name: '2×' }).click()
    await page.getByRole('button', { name: 'Reproducir' }).click()
    await expect(page.getByRole('heading', { name: 'Lección completada' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Ponte a prueba' })).toBeVisible()
  })

  test('F02-H3 saltar a una etapa', async ({ page }) => {
    await fresh(page)
    const stages = page.getByRole('list', { name: 'Etapas de la lección' })
    await stages.getByRole('button', { name: /Conexión TCP/ }).click()
    await expect(page.getByRole('progressbar', { name: 'Progreso de la captura' })).toHaveAttribute('aria-valuetext', 'Paquete 3 de 8')
  })

  test('F02-E1 más pasos que paquetes', async ({ page }) => {
    await fresh(page, 'dhcp')
    for (let i = 0; i < 10; i++) await stepBtn(page).click({ force: true })
    await expect(page.getByRole('progressbar', { name: 'Progreso de la captura' })).toHaveAttribute('aria-valuetext', 'Paquete 4 de 4')
    await expect(stepBtn(page)).toBeDisabled()
  })

  test('F02-E2 recargar a mitad', async ({ page }) => {
    await fresh(page)
    await stepBtn(page).click()
    await stepBtn(page).click()
    await page.reload()
    await expect(page.getByRole('progressbar', { name: 'Progreso de la captura' })).toHaveAttribute('aria-valuetext', 'Paquete 0 de 8')
  })

  test('F02-E3 solo teclado', async ({ page }) => {
    await fresh(page)
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('progressbar', { name: 'Progreso de la captura' })).toHaveAttribute('aria-valuetext', 'Paquete 1 de 8')
    await page.keyboard.press(' ')
    await expect(page.getByRole('button', { name: 'Pausa' })).toBeVisible()
    await page.keyboard.press(' ')
    await expect(page.getByRole('button', { name: /Reproducir|Repetir/ })).toBeVisible()
  })
})

test.describe('F03 inspeccionar bytes', () => {
  test('F03-H1 abrir el inspector desde la tabla', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: 'Inspeccionar paquete 1' }).click()
    const panel = page.getByRole('tabpanel', { name: 'Inspector' })
    await expect(panel.getByRole('button', { name: /Ethernet II/ })).toBeVisible()
    await expect(panel.getByRole('button', { name: /IPv4/ })).toBeVisible()
    await expect(panel.getByRole('button', { name: /UDP/ })).toBeVisible()
    await expect(panel.getByText('Bytes en el cable')).toBeVisible()
  })

  test('F03-H2 plegar y desplegar una capa', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: 'Inspeccionar paquete 1' }).click()
    const ip = page.getByRole('tabpanel', { name: 'Inspector' }).getByRole('button', { name: /IPv4/ })
    await expect(ip).toHaveAttribute('aria-expanded', 'true')
    await ip.click()
    await expect(ip).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('F02 la página no salta al avanzar', () => {
  test('F02-E4 avanzar no desplaza la página, solo la tabla', async ({ page }) => {
    await fresh(page, 'ftp')
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(120)
    }
    await expect(page.getByRole('progressbar', { name: 'Progreso de la captura' })).toHaveAttribute('aria-valuetext', 'Paquete 12 de 12')
    await page.waitForTimeout(600)
    expect(await page.evaluate(() => window.scrollY), 'la página no debe moverse').toBe(0)
    const tableScroll = await page.locator('table').evaluate((t) => (t.parentElement as HTMLElement).scrollTop)
    expect(tableScroll, 'la tabla sí se desplaza hasta el paquete actual').toBeGreaterThan(0)
  })
})
