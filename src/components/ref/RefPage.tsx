import { Layers, Play, RotateCcw, Search, Table } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { REF_CARDS, REF_TABLES } from '../../data/reference'
import { useT } from '../../i18n'
import { appLinkClick } from '../../lib/nav'
import { buildSession, counts, loadSrs, review, saveSrs, type SrsState } from '../../lib/srs'
import { lessonUrl } from '../../lib/url'
import { Button } from '../ui/Button'

type RefTab = 'chuleta' | 'repasar'
const TABS: [RefTab, string, typeof Table][] = [
  ['chuleta', 'Chuleta', Table],
  ['repasar', 'Repasar', Layers],
]

const tabFromHash = (): RefTab => (decodeURIComponent(location.hash.replace(/^#/, '')) === 'repasar' ? 'repasar' : 'chuleta')

/** /referencia/: the CCNA cheat sheet and its spaced-repetition flashcards. */
export function RefPage() {
  const t = useT()
  const [tab, setTab] = useState<RefTab>(tabFromHash)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const on = () => setTab(tabFromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const pick = (id: RefTab) => {
    setTab(id)
    history.replaceState(null, '', `/referencia/${id === 'repasar' ? '#repasar' : ''}`)
  }
  const move = (dir: number) => {
    const i = TABS.findIndex(([id]) => id === tab)
    const next = TABS[(i + dir + TABS.length) % TABS.length][0]
    pick(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-bold">{t('Referencia')}</h1>
        <p className="text-sm text-muted">{t('Las tablas que hay que saberse para el CCNA y flashcards con repaso espaciado para memorizarlas.')}</p>
      </div>
      <div role="tablist" aria-label={t('Herramientas de referencia')} className="flex gap-0.5 self-start rounded-lg border border-line bg-panel p-1.5">
        {TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[id] = el
            }}
            id={`ref-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls="ref-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => pick(id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(1)
              else if (e.key === 'ArrowLeft') move(-1)
            }}
            className="flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-bold tracking-wider uppercase hover:bg-panel-2 aria-selected:bg-accent aria-selected:text-accent-fg"
          >
            <Icon aria-hidden className="size-4" />
            {t(label)}
          </button>
        ))}
      </div>
      <div id="ref-panel" role="tabpanel" aria-labelledby={`ref-tab-${tab}`}>
        {tab === 'chuleta' ? <Chuleta /> : <Repaso />}
      </div>
    </div>
  )
}

// ── cheat sheet ─────────────────────────────────────────────────────
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function Chuleta() {
  const t = useT()
  const [query, setQuery] = useState('')
  const q = fold(query.trim())

  // a row matches in either language; an empty query shows everything
  const visible = REF_TABLES.map((table) => {
    if (!q) return { table, rows: table.rows }
    const inTitle = fold(table.title + ' ' + t(table.title)).includes(q)
    const rows = inTitle ? table.rows : table.rows.filter((r) => r.c.some((cell) => fold(cell + ' ' + t(cell)).includes(q)))
    return { table, rows }
  }).filter((v) => v.rows.length > 0)
  const found = visible.reduce((n, v) => n + v.rows.length, 0)

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor="ref-search" className="sr-only">
            {t('Buscar en las tablas')}
          </label>
          <input
            id="ref-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Buscar en las tablas')}
            autoComplete="off"
            spellCheck={false}
            className="min-h-11 w-full rounded-md border border-line-strong bg-bg pr-3 pl-10"
          />
        </div>
        <nav aria-label={t('Tablas')} className="flex flex-wrap gap-1.5">
          {REF_TABLES.map((table) => (
            <a key={table.id} href={`#${table.id}`} className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold hover:border-accent hover:bg-panel-2">
              {t(table.title)}
            </a>
          ))}
        </nav>
        <p aria-live="polite" className={`text-xs text-muted ${q ? '' : 'sr-only'}`}>
          {q ? t('{n} filas encontradas', { n: found }) : ''}
        </p>
      </section>

      {q && found === 0 && <p className="rounded-lg border border-line bg-panel p-4 text-sm text-muted">{t('Sin resultados para «{q}»', { q: query.trim() })}</p>}

      {visible.map(({ table, rows }) => (
        <section key={table.id} id={table.id} aria-labelledby={`ref-h-${table.id}`} className="scroll-mt-3 rounded-lg border border-line bg-panel p-4">
          <h2 id={`ref-h-${table.id}`} className="text-sm font-bold tracking-widest uppercase">
            {t(table.title)}
          </h2>
          <div tabIndex={0} role="region" aria-labelledby={`ref-h-${table.id}`} className="mt-2 overflow-x-auto rounded-md">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] tracking-wider text-muted uppercase">
                <tr className="border-b border-line">
                  {table.cols.map((c) => (
                    <th key={c} scope="col" className="px-2 py-2">
                      {t(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-line odd:bg-panel-2 last:border-0">
                    {r.c.map((cell, j) => (
                      <td key={j} className={`px-2 py-2 ${j === 0 ? 'font-bold' : 'font-mono'}`}>
                        {j === 0 && r.lesson ? (
                          <a href={lessonUrl(r.lesson)} onClick={appLinkClick} className="underline decoration-dotted underline-offset-4 hover:text-accent dark:hover:text-blue-300">
                            {t(cell)}
                          </a>
                        ) : (
                          t(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.note && !q && <p className="mt-2 text-xs leading-relaxed text-muted">{t(table.note)}</p>}
        </section>
      ))}
    </div>
  )
}

// ── flashcards ──────────────────────────────────────────────────────
interface Session {
  queue: string[]
  total: number
  misses: number
  free: boolean
}

function Repaso() {
  const t = useT()
  const [srs, setSrs] = useState<SrsState>(loadSrs)
  const [topic, setTopic] = useState('all')
  const [session, setSession] = useState<Session | null>(null)
  const [revealed, setRevealed] = useState(false)
  const revealRef = useRef<HTMLButtonElement>(null)
  const gradeRef = useRef<HTMLButtonElement>(null)

  const byId = useMemo(() => new Map(REF_CARDS.map((c) => [c.id, c])), [])
  const ids = useMemo(() => REF_CARDS.filter((c) => topic === 'all' || c.topic === topic).map((c) => c.id), [topic])
  const stats = counts(ids, srs)
  const pending = Math.min(20, stats.paraHoy + stats.nuevas)

  // translate the values dropped into the question template (e.g. «Estática»)
  const tvars = (v?: Record<string, string | number>) => v && Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? t(x) : x]))

  const start = () => {
    const { queue, free } = buildSession(ids, srs)
    setSession({ queue, total: queue.length, misses: 0, free })
    setRevealed(false)
    setTimeout(() => revealRef.current?.focus(), 0)
  }
  const grade = (ok: boolean) => {
    if (!session) return
    const id = session.queue[0]
    const next = review(srs, id, ok)
    saveSrs(next)
    setSrs(next)
    setSession((s) => {
      if (!s) return s
      const rest = s.queue.slice(1)
      return { ...s, queue: ok ? rest : [...rest, id], misses: s.misses + (ok ? 0 : 1) }
    })
    setRevealed(false)
    setTimeout(() => revealRef.current?.focus(), 0)
  }

  const card = session?.queue.length ? byId.get(session.queue[0]) : null
  const position = session ? Math.min(session.total - new Set(session.queue).size + 1, session.total) : 0

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[1fr_minmax(20rem,26rem)]">
      <section className="flex flex-col gap-4 rounded-lg border border-line bg-panel p-4">
        {!session && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ['Para hoy', stats.paraHoy],
                  ['Nuevas', stats.nuevas],
                  ['Dominadas', stats.dominadas],
                  ['Total', stats.total],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-panel-2 p-3">
                  <p className="text-[11px] font-bold tracking-wider text-muted uppercase">{t(label)}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ref-topic" className="text-[11px] font-bold tracking-wider uppercase">
                {t('Tema')}
              </label>
              <select id="ref-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-11 w-full rounded-md border border-line-strong bg-bg px-3">
                <option value="all">{t('Todos los temas')}</option>
                {REF_TABLES.map((table) => (
                  <option key={table.id} value={table.id}>
                    {t(table.title)}
                  </option>
                ))}
              </select>
            </div>
            {pending === 0 && <p className="text-sm">{t('¡Todo al día! Hoy no hay tarjetas pendientes.')}</p>}
            <Button variant="primary" className="self-start" onClick={start}>
              <Play aria-hidden className="size-4" />
              {pending > 0 ? t('Empezar ({n} tarjetas)', { n: pending }) : t('Repaso libre ({n} al azar)', { n: Math.min(20, stats.total) })}
            </Button>
          </>
        )}

        {session && card && (
          <>
            <p className="text-xs text-muted">{t('Tarjeta {i} de {n}', { i: position, n: session.total })}</p>
            <p className="min-h-16 text-xl font-bold">{t(card.q, tvars(card.v))}</p>
            <div aria-live="polite">
              {revealed && <p className="rounded-md border border-line bg-panel-2 p-3 font-mono text-lg">{t(card.a)}</p>}
            </div>
            {!revealed ? (
              <Button ref={revealRef} variant="primary" className="self-start" onClick={() => (setRevealed(true), setTimeout(() => gradeRef.current?.focus(), 0))}>
                {t('Mostrar respuesta')}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button ref={gradeRef} onClick={() => grade(false)}>
                  {t('No la sabía')}
                </Button>
                <Button variant="primary" onClick={() => grade(true)}>
                  {t('La sabía')}
                </Button>
              </div>
            )}
          </>
        )}

        {session && !card && (
          <>
            <p aria-live="polite" className="text-lg font-bold">
              {t('Tanda terminada: {n} tarjetas, {f} fallos.', { n: session.total, f: session.misses })}
            </p>
            <div className="flex flex-wrap gap-2">
              {pending > 0 && (
                <Button variant="primary" onClick={start}>
                  {t('Otra tanda')}
                </Button>
              )}
              <Button onClick={() => setSession(null)}>{t('Volver al resumen')}</Button>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4 text-sm leading-relaxed text-muted">
        <p>{t('Si aciertas, la tarjeta tarda más en volver (1, 3, 7, 15 y 30 días); si fallas, vuelve a empezar. El progreso se guarda en este navegador.')}</p>
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            if (confirm(t('¿Borrar el progreso de todas las tarjetas?'))) {
              saveSrs({})
              setSrs({})
              setSession(null)
            }
          }}
        >
          <RotateCcw aria-hidden className="size-4" />
          {t('Reiniciar el repaso')}
        </Button>
      </section>
    </div>
  )
}
