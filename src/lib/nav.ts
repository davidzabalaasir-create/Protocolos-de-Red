import type { ComponentType, MouseEvent } from 'react'

// Moving between the lessons and the standalone sections (/subneteo/, /referencia/) happens
// inside the page: no reload, no blank screen. Each section's code is downloaded once,
// in the background when possible.

export const NAV_EVENT = 'app:navigate'

const SECTIONS = {
  subneteo: { match: /^\/subneteo\/?$/, load: () => import('../components/subnet/SubnetApp') },
  referencia: { match: /^\/referencia\/?$/, load: () => import('../components/ref/RefApp') },
}
export type SectionId = keyof typeof SECTIONS

const ready: Partial<Record<SectionId, ComponentType>> = {}
const loading: Partial<Record<SectionId, Promise<void> | null>> = {}

export const sectionOf = (path: string): SectionId | null => (Object.keys(SECTIONS) as SectionId[]).find((id) => SECTIONS[id].match.test(path)) ?? null

/** Downloads a section's view once; later calls reuse it. */
export const loadSection = (id: SectionId): Promise<void> =>
  (loading[id] ??= SECTIONS[id].load().then(
    (m) => {
      ready[id] = m.default
    },
    (err) => {
      loading[id] = null // try again next time (e.g. the download was cut off)
      throw err
    },
  ))

export const loadedSection = (id: SectionId) => ready[id] ?? null

/** Background warm-up: a failed download is not an error, the real visit will retry. */
export const prefetchSection = (id: SectionId) => () => void loadSection(id).catch(() => {})

export function navigate(url: string) {
  history.pushState(null, '', url)
  window.dispatchEvent(new Event(NAV_EVENT))
  window.scrollTo(0, 0)
}

/** onClick for links between the lessons and the sections. Ctrl/⌘/middle clicks keep their usual behaviour. */
export function appLinkClick(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const target = new URL(e.currentTarget.href, location.href)
  if (target.origin !== location.origin) return
  const here = sectionOf(location.pathname)
  const there = sectionOf(target.pathname)
  if (here !== null && here === there) {
    // already there: nothing to load
    e.preventDefault()
    return
  }
  if (here === there) return // lesson → lesson: the lessons view handles it with a normal load
  e.preventDefault()
  navigate(target.pathname + target.search + target.hash)
}
