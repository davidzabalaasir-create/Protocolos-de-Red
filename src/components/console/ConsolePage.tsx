import { CircleCheck, Circle, Eraser, RouterIcon, Network } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLang, useT } from '../../i18n'
import { complete, help, makeRouter, makeSwitch, prompt, RETOS, run, type Dev } from '../../lib/ios'
import { Button } from '../ui/Button'

type DevId = 'r1' | 'sw1'

interface Term {
  dev: Dev
  lines: string[]
  hist: string[]
}

const KEY = 'protocolos:consola:retos'
const loadDone = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** /consola/: an educational IOS-style terminal over the lessons' network, plus guided challenges. */
export function ConsolePage() {
  const t = useT()
  const lang = useLang()
  const [terms, setTerms] = useState<Record<DevId, Term>>(() => ({
    r1: { dev: makeRouter(), lines: [], hist: [] },
    sw1: { dev: makeSwitch(), lines: [], hist: [] },
  }))
  const [active, setActive] = useState<DevId>('r1')
  const [buffer, setBuffer] = useState('')
  const [histIdx, setHistIdx] = useState(-1)
  const [done, setDone] = useState<string[]>(loadDone)
  const [announce, setAnnounce] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const term = terms[active]
  const dev = term.dev

  useEffect(() => {
    const box = scrollRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [term.lines])

  const push = (id: DevId, next: Partial<Term>) => setTerms((s) => ({ ...s, [id]: { ...s[id], ...next } }))

  const submit = () => {
    const input = buffer
    const r = run(dev, input)
    const lines = [...term.lines, `${prompt(dev)} ${input}`, ...(r.out ? [r.out] : [])]
    push(active, { dev: r.d, lines, hist: input.trim() ? [...term.hist, input] : term.hist })
    setBuffer('')
    setHistIdx(-1)
    const won = RETOS.filter((x) => !done.includes(x.id) && x.check({ dev: r.d, cmd: r.cmd, args: r.args, out: r.out }))
    if (won.length) {
      const next = [...done, ...won.map((x) => x.id)]
      setDone(next)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* private mode */
      }
      setAnnounce(`${t('Reto completado')}: ${won.map((x) => (lang === 'en' ? x.en : x.es)).join(' · ')}`)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
    else if (e.key === '?') {
      e.preventDefault()
      push(active, { lines: [...term.lines, `${prompt(dev)} ${buffer}?`, help(dev, buffer, lang)] })
    } else if (e.key === 'Tab') {
      const full = complete(dev, buffer)
      if (full) {
        e.preventDefault()
        setBuffer(full)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = histIdx < 0 ? term.hist.length - 1 : Math.max(0, histIdx - 1)
      if (term.hist[idx] !== undefined) {
        setBuffer(term.hist[idx])
        setHistIdx(idx)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx < 0) return
      const idx = histIdx + 1
      if (idx >= term.hist.length) {
        setBuffer('')
        setHistIdx(-1)
      } else {
        setBuffer(term.hist[idx])
        setHistIdx(idx)
      }
    }
  }

  const DEVICES: [DevId, string, typeof RouterIcon][] = [
    ['r1', 'R1 · Router', RouterIcon],
    ['sw1', 'SW1 · Switch', Network],
  ]
  const label = active === 'r1' ? 'R1' : 'SW1'

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-bold">{t('Consola')}</h1>
        <p className="text-sm text-muted">{t('Practica los comandos de router y switch (al estilo Cisco IOS) sobre la red de las lecciones.')}</p>
      </div>

      <div role="tablist" aria-label={t('Equipos')} className="flex gap-0.5 self-start rounded-lg border border-line bg-panel p-1.5">
        {DEVICES.map(([id, name, Icon]) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[id] = el
            }}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls="console-panel"
            tabIndex={active === id ? 0 : -1}
            onClick={() => {
              setActive(id)
              setBuffer('')
              setHistIdx(-1)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const next = id === 'r1' ? 'sw1' : 'r1'
                setActive(next)
                tabRefs.current[next]?.focus()
              }
            }}
            className="flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-bold tracking-wider uppercase hover:bg-panel-2 aria-selected:bg-accent aria-selected:text-accent-fg"
          >
            <Icon aria-hidden className="size-4" />
            {name}
          </button>
        ))}
      </div>

      <div id="console-panel" className="grid items-start gap-3 lg:grid-cols-[1fr_minmax(20rem,24rem)]">
        <section aria-label={t('Terminal de {d}', { d: label })} className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 text-xs text-muted">
            <span>{t('Historial con ↑ ↓ · autocompletar con Tab · ayuda con ?')}</span>
            <Button variant="ghost" size="iconSm" label={t('Limpiar la pantalla')} onClick={() => push(active, { lines: [] })}>
              <Eraser aria-hidden className="size-4" />
            </Button>
          </div>
          {/* the output is plain data for assistive tech; new output is announced politely */}
          <div ref={scrollRef} tabIndex={0} role="log" aria-label={t('Terminal de {d}', { d: label })} className="h-80 overflow-y-auto bg-bg p-3 md:h-96" onClick={() => inputRef.current?.focus()}>
            <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap">{term.lines.join('\n')}</pre>
            <div className="flex items-center gap-2 font-mono text-[13px]">
              <label htmlFor="console-input" className="shrink-0 font-bold text-accent dark:text-blue-300">
                {prompt(dev)}
              </label>
              <input
                id="console-input"
                ref={inputRef}
                value={buffer}
                onChange={(e) => {
                  setBuffer(e.target.value)
                  setHistIdx(-1)
                }}
                onKeyDown={onKey}
                aria-label={t('Línea de comandos de {d}', { d: label })}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent font-mono outline-none"
              />
            </div>
          </div>
          <p className="border-t border-line px-3 py-2 text-xs text-muted">{t('La salida de los comandos está en inglés, como en los equipos reales.')}</p>
        </section>

        <section aria-labelledby="retos-title" className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4 lg:sticky lg:top-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="retos-title" className="text-sm font-bold tracking-widest uppercase">
              {t('Retos')}
            </h2>
            <p className="text-xs text-muted">{t('{done}/{total} completados', { done: done.length, total: RETOS.length })}</p>
          </div>
          <ol className="flex flex-col gap-2">
            {RETOS.map((reto) => {
              const ok = done.includes(reto.id)
              return (
                <li key={reto.id} className="flex items-start gap-2 text-sm leading-snug">
                  {ok ? <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-green-700 dark:text-green-400" /> : <Circle aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />}
                  <span className={ok ? 'text-muted line-through' : ''}>
                    {ok && <span className="sr-only">{t('completado')}: </span>}
                    {lang === 'en' ? reto.en : reto.es}
                  </span>
                </li>
              )
            })}
          </ol>
          <p aria-live="polite" className="sr-only">
            {announce}
          </p>
        </section>
      </div>
    </div>
  )
}
