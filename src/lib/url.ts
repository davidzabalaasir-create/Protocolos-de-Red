import { PROTOCOLS } from '../data/protocols'

/**
 * Addresses of the app:
 *   /dns/            a lesson (each one is also a pre-rendered page for search engines)
 *   /dns/#3          that lesson at packet 3
 *   #comparar=tcp,udp   side-by-side comparison      #examen   exam mode
 *   ?embed=1         compact view for an <iframe> in a virtual classroom
 * Old links (/#dns, /#dns/3) keep working and are rewritten to the new form.
 */
export interface Route {
  id: string | null
  /** 0-based packet index, or null */
  step: number | null
  compare: [string, string] | null
  exam: boolean
  embed: boolean
}

const isLesson = (id: string | undefined): id is string => !!id && PROTOCOLS.some((p) => p.id === id)

export function parseUrl(loc: { pathname: string; hash: string; search: string } = location): Route {
  const seg = loc.pathname.split('/').filter(Boolean)[0]
  let id: string | null = isLesson(seg) ? seg : null
  let step: number | null = null
  let compare: [string, string] | null = null
  let exam = false
  const hash = decodeURIComponent(loc.hash.replace(/^#/, ''))
  if (hash.startsWith('comparar=')) {
    const [a, b] = hash.slice('comparar='.length).split(',')
    if (isLesson(a) && isLesson(b)) compare = [a, b]
  } else if (hash === 'examen') exam = true
  else if (hash) {
    const [first, second] = hash.split('/')
    if (isLesson(first)) {
      id = first
      if (second && /^\d+$/.test(second)) step = Number(second) - 1
    } else if (/^\d+$/.test(first)) step = Number(first) - 1
  }
  const embed = new URLSearchParams(loc.search).get('embed') === '1'
  return { id, step, compare, exam, embed }
}

export function lessonUrl(id: string, step = -1, embed = false) {
  return `/${id}/${embed ? '?embed=1' : ''}${step >= 0 ? `#${step + 1}` : ''}`
}

export { SITE } from './site'
