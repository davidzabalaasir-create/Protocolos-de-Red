import type { MouseEvent } from 'react'

// Moving between the lessons and /subneteo/ happens inside the page: no reload, no blank screen.
// (Both are separate top-level views picked in main.tsx; within the lessons, App handles its own URLs.)

export const NAV_EVENT = 'app:navigate'
export const isSubnetPath = (path: string) => /^\/subneteo\/?$/.test(path)

type SubnetModule = typeof import('../components/subnet/SubnetApp')
let subnet: SubnetModule | null = null
let loading: Promise<SubnetModule> | null = null

/** Downloads the subnetting view once; later calls reuse it. */
export const loadSubnet = () =>
  (loading ??= import('../components/subnet/SubnetApp').then(
    (m) => (subnet = m),
    (err) => {
      loading = null // try again next time (e.g. the download was cut off)
      throw err
    },
  ))

/** Background warm-up: a failed download is not an error, the real visit will retry. */
export const prefetchSubnet = () => void loadSubnet().catch(() => {})
export const loadedSubnet = () => subnet

export function navigate(url: string) {
  history.pushState(null, '', url)
  window.dispatchEvent(new Event(NAV_EVENT))
  window.scrollTo(0, 0)
}

/** onClick for links between the lessons and the subnetting tools. Ctrl/⌘/middle clicks keep their usual behaviour. */
export function appLinkClick(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const target = new URL(e.currentTarget.href, location.href)
  if (target.origin !== location.origin) return
  const here = isSubnetPath(location.pathname)
  const there = isSubnetPath(target.pathname)
  if (here && there) {
    // already there: nothing to load
    e.preventDefault()
    return
  }
  if (here === there) return // lesson → lesson: the lessons view handles it with a normal load
  e.preventDefault()
  navigate(target.pathname + target.search + target.hash)
}
