import AxeBuilder from '@axe-core/playwright'
import { test as base, expect, type Page } from '@playwright/test'

/** Every spec fails on console errors, uncaught exceptions or 5xx responses. */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = []
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
      page.on('response', (r) => r.status() >= 500 && problems.push(`${r.status()} ${r.url()}`))
      await use()
      expect(problems, 'errores en la página').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Start each test from a clean slate (no saved language, theme, progress…). */
export async function fresh(page: Page, hash = 'http') {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto(`/#${hash}`)
  await expect(page.getByRole('heading', { name: 'Flujo de paquetes' })).toBeVisible()
}

export async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)
}

export const stepBtn = (page: Page) => page.getByRole('button', { name: /^Paso$/ })

/** The protocol list: a fixed sidebar on wide screens, a modal panel on narrow ones. */
export async function openList(page: Page) {
  const width = page.viewportSize()?.width ?? 0
  if (width >= 1280) {
    const side = page.getByRole('complementary', { name: 'Protocolos' })
    await expect(side).toBeVisible()
    return side
  }
  await page.getByRole('button', { name: 'Protocolos', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Protocolos' })
  await expect(dialog).toBeVisible()
  return dialog
}
