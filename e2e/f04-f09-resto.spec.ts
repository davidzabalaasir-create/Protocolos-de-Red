import { readFileSync } from 'node:fs'
import { axe, expect, fresh, openList, stepBtn, test } from './fixtures'

test.describe('F04 quiz y progreso', () => {
  test('F04-H1 completar DNS y conservar el progreso', async ({ page }) => {
    await fresh(page, 'dns')
    for (let i = 0; i < 8; i++) await stepBtn(page).click()
    await page.getByRole('tab', { name: 'Quiz' }).click()
    await page.getByRole('button', { name: 'A un servidor raíz' }).click()
    await page.getByRole('button', { name: 'Cuánto tiempo puede guardarse en caché' }).click()
    await expect(page.getByText(/Resultado: 2\/2/)).toBeVisible()
    await page.reload()
    const list = await openList(page)
    await expect(list.getByText(/^1\/\d+ completados$/)).toBeVisible()
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
    const list = await openList(page)
    await list.getByRole('button', { name: /Empezar el recorrido guiado/ }).click()
    const tour = page.getByRole('navigation', { name: 'Recorrido guiado' })
    await expect(tour.getByText('Recorrido guiado · 1/15')).toBeVisible()
    await tour.getByRole('button', { name: 'ARP', exact: true }).click()
    await expect(page).toHaveURL(/\/arp\/$/)
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
    await expect(page.getByText(/^Encapsulación:/)).toBeVisible() // the inspector loads on demand
    expect(await axe(page), 'inspector').toEqual([])
    await page.getByRole('tab', { name: 'Quiz' }).click()
    expect(await axe(page), 'quiz').toEqual([])
    await openList(page)
    expect(await axe(page), 'lista de protocolos').toEqual([])
  })

  test('F08-E1 saltar al contenido es lo primero', async ({ page, browserName }) => {
    await fresh(page)
    if (browserName === 'webkit') {
      // Safari only tabs to links with Option+Tab (or "Press Tab to highlight each item"), which the
      // test browser can't press; check instead that the link is the first focusable element.
      const first = await page.evaluate(() => document.querySelector<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')?.textContent)
      expect(first).toBe('Saltar al contenido')
      return
    }
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

test.describe('F10 lista lateral fija', () => {
  test('F10-H1 ocultar y mostrar, recordado', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1280, 'solo en pantallas anchas')
    await fresh(page)
    const side = page.getByRole('complementary', { name: 'Protocolos' })
    await expect(side).toBeVisible()
    await side.getByRole('button', { name: 'Ocultar lista de protocolos' }).click()
    await expect(side).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('complementary', { name: 'Protocolos' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Protocolos', exact: true }).click()
    await expect(page.getByRole('complementary', { name: 'Protocolos' })).toBeVisible()
  })
})

test.describe('F11 protocolos nuevos', () => {
  for (const id of ['mdns', 'ssdp', 'lldp', 'vrrp', 'rip', 'gre', 'syslog', 'wol']) {
    test(`F11-H ${id} se reproduce hasta el final`, async ({ page }) => {
      await fresh(page, id)
      await page.getByRole('radio', { name: '2×' }).click()
      await page.getByRole('button', { name: 'Reproducir' }).click()
      await expect(page.getByRole('heading', { name: 'Lección completada' })).toBeVisible({ timeout: 20_000 })
    })
  }
})

test.describe('F13 escenarios de fallo', () => {
  test('F13-H1 de TCP al escenario de pérdida y vuelta', async ({ page }) => {
    await fresh(page, 'tcp')
    await page.getByRole('button', { name: /Ver qué pasa si falla: TCP: pérdida/ }).click()
    await expect(page).toHaveURL(/\/tcp-loss\/$/)
    await page.getByRole('radio', { name: '2×' }).click()
    await page.getByRole('button', { name: 'Reproducir' }).click()
    await expect(page.getByRole('heading', { name: 'Lección completada' })).toBeVisible({ timeout: 25_000 })
    await page.getByRole('button', { name: /Volver a la lección normal: TCP/ }).click()
    await expect(page).toHaveURL(/\/tcp\/$/)
  })
})

test.describe('F14 comparar', () => {
  test('F14-H1 comparar TCP con UDP y cambiar uno', async ({ page }) => {
    await fresh(page, 'tcp')
    await page.getByRole('button', { name: 'Comparar' }).click()
    const dialog = page.getByRole('dialog', { name: 'Comparar protocolos' })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/#comparar=tcp,udp$/)
    await expect(dialog.getByRole('table')).toContainText('Paquetes')
    await dialog.getByRole('combobox', { name: 'Protocolo B' }).selectOption('quic' === 'x' ? '' : 'http3')
    await expect(page).toHaveURL(/#comparar=tcp,http3$/)
    expect(await axe(page), 'comparación').toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/\/tcp\/$/)
  })

  test('F14-H2 enlace directo a una comparación', async ({ page }) => {
    await page.goto('/#comparar=http2,http3')
    await expect(page.getByRole('dialog', { name: 'Comparar protocolos' })).toBeVisible()
  })
})

test.describe('F15 modo examen', () => {
  test('F15-H1 responder, corregir y nota', async ({ page }) => {
    await fresh(page)
    const list = await openList(page)
    await list.getByRole('button', { name: 'Modo examen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Modo examen' })
    await expect(dialog).toBeVisible()
    const groups = dialog.getByRole('group')
    const n = await groups.count()
    expect(n).toBe(10)
    for (let i = 0; i < n; i++) await groups.nth(i).getByRole('radio').first().click()
    await dialog.getByRole('button', { name: 'Corregir examen' }).click()
    await expect(dialog.getByText(/Nota: \d+\/10/).first()).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Imprimir o guardar en PDF' })).toBeVisible()
    expect(await axe(page), 'examen').toEqual([])
  })
})

test.describe('F16 incrustar', () => {
  test('F16-H1 código para copiar', async ({ page }) => {
    await fresh(page, 'dns')
    await page.getByRole('button', { name: 'Incrustar' }).click()
    const code = page.getByRole('textbox', { name: 'Código' })
    await expect(code).toHaveValue(/<iframe src="https:\/\/protocolos-de-red-eight\.vercel\.app\/dns\/\?embed=1"/)
  })

  test('F16-H2 vista incrustada sin menús', async ({ page }) => {
    await page.goto('/dns/?embed=1')
    await expect(page.getByRole('img', { name: /Diagrama de red de DNS/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Abrir en Protocolos de Red/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Protocolos', exact: true })).toHaveCount(0)
    await expect(page.getByRole('combobox', { name: 'Buscar protocolos' })).toHaveCount(0)
    await page.getByRole('button', { name: /^Paso$/ }).click()
    await expect(page).toHaveURL(/\/dns\/\?embed=1#1$/)
  })
})
