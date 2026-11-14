import { Calculator, Check, Copy, Dumbbell, Plus, Split, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLang, useT } from '../../i18n'
import { blockOf, checkAnswer, makeQuestion, maskOf, parseCidr, prefixFor, subnetInfo, toBits, toIp, vlsm, type Cidr, type Msg, type Question, type VlsmRow } from '../../lib/subnet'
import { Button } from '../ui/Button'

// ── address ↔ state ─────────────────────────────────────────────────
export type SubnetTab = 'calc' | 'vlsm' | 'practice'
interface Row {
  name: string
  hosts: string
}
export interface SubnetRoute {
  tab: SubnetTab
  cidr: string
  base: string
  rows: Row[]
}

const DEFAULT_ROWS: Row[] = [
  { name: 'Ventas', hosts: '50' },
  { name: 'IT', hosts: '20' },
  { name: 'Wifi', hosts: '100' },
]

/** /subneteo/#192.168.10.77/26 · #vlsm=10.0.0.0/24;Ventas:50;IT:20 · #practicar */
export function parseSubnetHash(hash: string): SubnetRoute {
  const h = decodeURIComponent(hash.replace(/^#/, ''))
  const route: SubnetRoute = { tab: 'calc', cidr: '192.168.10.77/26', base: '192.168.1.0/24', rows: DEFAULT_ROWS }
  if (h === 'practicar') return { ...route, tab: 'practice' }
  if (h.startsWith('vlsm=')) {
    const [base, ...rows] = h.slice(5).split(';')
    return {
      ...route,
      tab: 'vlsm',
      base: base || route.base,
      rows: rows.length ? rows.slice(0, 32).map((r) => ({ name: r.split(':')[0].slice(0, 24), hosts: r.split(':')[1] ?? '' })) : route.rows,
    }
  }
  if (h) return { ...route, cidr: h }
  return route
}

export function subnetHash(r: SubnetRoute) {
  if (r.tab === 'practice') return '#practicar'
  if (r.tab === 'vlsm') return `#vlsm=${[r.base, ...r.rows.map((x) => `${x.name.replace(/[;:]/g, '')}:${x.hosts}`)].join(';')}`
  return `#${r.cidr}`
}

const TABS: [SubnetTab, string, typeof Calculator][] = [
  ['calc', 'Calculadora', Calculator],
  ['vlsm', 'Dividir (VLSM)', Split],
  ['practice', 'Practicar', Dumbbell],
]

const useFmt = () => {
  const lang = useLang()
  return (n: number) => n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')
}
const useMsg = () => {
  const t = useT()
  return (m: Msg) => t(m.key, m.vars)
}

export function SubnetPage({ initial }: { initial: SubnetRoute }) {
  const t = useT()
  const [route, setRoute] = useState(initial)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const url = `/subneteo/${subnetHash(route)}`
    if (location.pathname + location.hash !== url) history.replaceState(null, '', url)
  }, [route])
  useEffect(() => {
    const on = () => setRoute(parseSubnetHash(location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const move = (dir: number) => {
    const i = TABS.findIndex(([id]) => id === route.tab)
    const next = TABS[(i + dir + TABS.length) % TABS.length][0]
    setRoute((r) => ({ ...r, tab: next }))
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-bold">{t('Subneteo')}</h1>
        <p className="text-sm text-muted">{t('Calcula subredes IPv4, reparte una red con VLSM y practica para el examen.')}</p>
      </div>
      <div role="tablist" aria-label={t('Herramientas de subneteo')} className="flex gap-0.5 self-start rounded-lg border border-line bg-panel p-1.5">
        {TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[id] = el
            }}
            id={`subnet-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={route.tab === id}
            aria-controls="subnet-panel"
            tabIndex={route.tab === id ? 0 : -1}
            onClick={() => setRoute((r) => ({ ...r, tab: id }))}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(1)
              else if (e.key === 'ArrowLeft') move(-1)
            }}
            className="flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-bold tracking-wider uppercase hover:bg-panel-2 aria-selected:bg-accent aria-selected:text-accent-fg sm:px-3"
          >
            <Icon aria-hidden className="size-4" />
            {t(label)}
          </button>
        ))}
      </div>
      <div id="subnet-panel" role="tabpanel" aria-labelledby={`subnet-tab-${route.tab}`}>
        {route.tab === 'calc' && <CalcTab value={route.cidr} onChange={(cidr) => setRoute((r) => ({ ...r, cidr }))} />}
        {route.tab === 'vlsm' && <VlsmTab base={route.base} rows={route.rows} onChange={(base, rows) => setRoute((r) => ({ ...r, base, rows }))} />}
        {route.tab === 'practice' && <PracticeTab />}
      </div>
    </div>
  )
}

// ── shared pieces ───────────────────────────────────────────────────
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-panel p-4 ${className}`}>{children}</section>
}

function CidrField({ id, label, value, onChange, error, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold tracking-wider uppercase">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder="192.168.1.0/24"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`min-h-11 w-full rounded-md border bg-bg px-3 font-mono text-lg ${error ? 'border-[var(--k-err)]' : 'border-line-strong'}`}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-[var(--k-err)]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useT()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setDone(false), 1500)
    return () => clearTimeout(id)
  }, [done])
  return (
    <Button
      variant="ghost"
      size="iconSm"
      label={done ? t('Copiado') : t('Copiar {what}', { what: label })}
      onClick={() => navigator.clipboard?.writeText(text).then(() => setDone(true), () => {})}
    >
      {done ? <Check aria-hidden className="size-4 text-[var(--k-tcp)]" /> : <Copy aria-hidden className="size-4" />}
    </Button>
  )
}

function ResultCard({ label, value, sub, highlight, copy = true }: { label: string; value: string; sub?: string; highlight?: boolean; copy?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-2 rounded-lg border p-3 ${highlight ? 'border-accent bg-panel-2' : 'border-line bg-panel'}`}>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-wider text-muted uppercase">{label}</p>
        <p className="font-mono text-lg font-bold [overflow-wrap:anywhere] sm:text-xl">{value}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      {copy && <CopyButton text={value} label={label} />}
    </div>
  )
}

/** 32 bits split in octets; network bits in the network colour and underlined, host bits in the host colour. */
function BitRow({ label, value, prefix }: { label: string; value: number; prefix: number }) {
  const bits = toBits(value)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
        {label} <span className="font-mono normal-case">{toIp(value)}</span>
      </p>
      <div aria-hidden className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:gap-2">
        {[0, 1, 2, 3].map((o) => (
          <span key={o} className="flex gap-px">
            {bits
              .slice(o * 8, o * 8 + 8)
              .split('')
              .map((b, i) => {
                const n = o * 8 + i
                const net = n < prefix
                return (
                  <span
                    key={i}
                    title={String(2 ** (7 - i))}
                    className={`grid h-6 w-4 place-items-center rounded-sm font-mono text-xs transition-colors duration-150 motion-reduce:transition-none sm:w-5 ${
                      net ? 'bg-[color-mix(in_srgb,var(--k-dns)_16%,transparent)] font-bold text-[var(--k-dns)] underline underline-offset-2' : 'bg-[color-mix(in_srgb,var(--k-tcp)_12%,transparent)] text-[var(--k-tcp)]'
                    } ${n === prefix && n > 0 ? 'border-l-2 border-fg' : ''}`}
                  >
                    {b}
                  </span>
                )
              })}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The steps a student would do on paper. */
export function HowPanel({ ip, prefix }: Cidr) {
  const t = useT()
  const fmt = useFmt()
  const i = subnetInfo(ip, prefix)
  const b = blockOf(prefix)
  const h = 32 - prefix
  return (
    <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
      <li>{t('La máscara /{p} son {p} unos seguidos de {h} ceros: {mask}.', { p: prefix, h, mask: toIp(i.mask) })}</li>
      {b && (
        <li>
          {b.size === 1
            ? t('El prefijo es múltiplo de 8: la red ocupa octetos enteros y las redes avanzan de 1 en 1 en el {o}º octeto.', { o: b.octet + 1 })
            : t('El octeto interesante es el {o}º: la máscara vale {m} ahí, así que las redes van de {s} en {s} (256 − {m}).', { o: b.octet + 1, m: b.maskOctet, s: b.size })}
        </li>
      )}
      <li>{t('Red = IP AND máscara (los bits de host a 0): {net}.', { net: toIp(i.network) })}</li>
      <li>{t('Broadcast = los bits de host a 1: {bc}.', { bc: toIp(i.broadcast) })}</li>
      <li>
        {prefix === 32
          ? t('Un /32 es una sola dirección: un único equipo (rutas de host, loopbacks).')
          : prefix === 31
            ? t('Un /31 tiene 2 direcciones y ambas se usan: solo para enlaces punto a punto (RFC 3021).')
            : t('Hosts útiles = 2^{h} − 2 = {n} (se restan la red y el broadcast).', { h, n: fmt(i.hosts) })}
      </li>
    </ol>
  )
}

// ── calculator ──────────────────────────────────────────────────────
function CalcTab({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT()
  const msg = useMsg()
  const fmt = useFmt()
  const parsed = parseCidr(value)
  // while the field holds an invalid value, keep showing the last valid subnet (dimmed)
  const [lastOk, setLastOk] = useState<Cidr>(() => (parsed.ok ? { ip: parsed.ip, prefix: parsed.prefix } : { ip: 0xc0a80a4d, prefix: 26 }))
  const { ip, prefix } = parsed.ok ? parsed : lastOk
  const change = (v: string) => {
    const r = parseCidr(v)
    if (r.ok) setLastOk({ ip: r.ip, prefix: r.prefix })
    onChange(v)
  }
  const i = subnetInfo(ip, prefix)
  const b = blockOf(prefix)

  // a short spoken summary, after typing pauses
  const [spoken, setSpoken] = useState('')
  const summary = t('Red {net}/{p}, {n} hosts útiles', { net: toIp(i.network), p: prefix, n: fmt(i.hosts) })
  useEffect(() => {
    const id = setTimeout(() => setSpoken(summary), 500)
    return () => clearTimeout(id)
  }, [summary])

  const set = (nextIp: number, p: number) => change(`${toIp(nextIp)}/${p}`)

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[1fr_minmax(20rem,26rem)]">
      <div className="flex min-w-0 flex-col gap-3">
        <Card className="flex flex-col gap-4">
          <CidrField
            id="cidr"
            label={t('Dirección IPv4 y prefijo')}
            value={value}
            onChange={change}
            error={parsed.ok ? undefined : msg(parsed.error)}
            hint={t('Vale /26, una máscara (255.255.255.192) o solo la IP.')}
          />
          {parsed.ok && parsed.warnings.map((w) => <p key={w.key} className="text-sm text-muted">{msg(w)}</p>)}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prefix" className="flex justify-between text-[11px] font-bold tracking-wider uppercase">
              <span>{t('Prefijo')}</span>
              <span className="font-mono normal-case">
                /{prefix} · {toIp(maskOf(prefix))}
              </span>
            </label>
            <input
              id="prefix"
              type="range"
              min={0}
              max={32}
              value={prefix}
              list="prefix-marks"
              aria-valuetext={t('/{p}, máscara {m}', { p: prefix, m: toIp(maskOf(prefix)) })}
              onChange={(e) => set(ip, Number(e.target.value))}
              className="min-h-11 w-full accent-[var(--accent)]"
            />
            <datalist id="prefix-marks">
              {[8, 16, 24, 30].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          {parsed.ok && ip !== i.network && prefix < 31 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-panel-2 p-3 text-sm">
              <span>{t('{ip} es un equipo de la red {net}/{p}.', { ip: toIp(ip), net: toIp(i.network), p: prefix })}</span>
              <Button size="sm" onClick={() => set(i.network, prefix)}>
                {t('Usar la red')}
              </Button>
            </div>
          )}
        </Card>

        <div className={`grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 2xl:grid-cols-4 ${parsed.ok ? '' : 'opacity-60'}`}>
          <ResultCard label={t('Red')} value={toIp(i.network)} highlight />
          <ResultCard label={t('Broadcast')} value={toIp(i.broadcast)} highlight />
          <ResultCard label={t('Primer host')} value={toIp(i.first)} />
          <ResultCard label={t('Último host')} value={toIp(i.last)} />
          <ResultCard label={t('Hosts útiles')} value={fmt(i.hosts)} sub={t('{n} direcciones en total', { n: fmt(i.total) })} />
          <ResultCard label={t('Máscara')} value={toIp(i.mask)} sub={`/${prefix}`} />
          <ResultCard label={t('Wildcard')} value={toIp(i.wildcard)} sub={t('Para ACL y OSPF')} />
          <ResultCard label={t('Tipo')} value={t(i.kind)} sub={t('Clase {c}', { c: i.cls })} copy={false} />
        </div>
        <p aria-live="polite" className="sr-only">
          {spoken}
        </p>

        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold tracking-widest uppercase">{t('En binario')}</h2>
          <div role="img" aria-label={t('{n} bits de red y {h} de host', { n: prefix, h: 32 - prefix })} className="flex flex-col gap-3">
            <BitRow label={t('IP')} value={ip} prefix={prefix} />
            <BitRow label={t('Máscara')} value={i.mask} prefix={prefix} />
            <BitRow label={t('Red')} value={i.network} prefix={prefix} />
          </div>
          <p className="flex flex-wrap gap-4 text-xs text-muted">
            <span className="font-bold text-[var(--k-dns)] underline underline-offset-2">{t('Bits de red ({n})', { n: prefix })}</span>
            <span className="text-[var(--k-tcp)]">{t('Bits de host ({n})', { n: 32 - prefix })}</span>
          </p>
          {b && b.blocks <= 64 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-bold tracking-wider text-muted uppercase">{t('Bloques en el {o}º octeto', { o: b.octet + 1 })}</p>
              <div aria-hidden className="flex h-8 gap-px overflow-hidden rounded-md">
                {Array.from({ length: b.blocks }, (_, k) => {
                  const active = Math.floor(((ip >>> (24 - b.octet * 8)) & 255) / b.size) === k
                  return <span key={k} title={`${k * b.size}–${k * b.size + b.size - 1}`} className={`flex-1 transition-colors duration-200 motion-reduce:transition-none ${active ? 'bg-accent' : 'bg-panel-2'}`} />
                })}
              </div>
              <p className="text-sm">
                {t('Bloque {k} de {n}: del {a} al {z} en el {o}º octeto.', {
                  k: Math.floor(((ip >>> (24 - b.octet * 8)) & 255) / b.size) + 1,
                  n: b.blocks,
                  a: Math.floor(((ip >>> (24 - b.octet * 8)) & 255) / b.size) * b.size,
                  z: Math.floor(((ip >>> (24 - b.octet * 8)) & 255) / b.size) * b.size + b.size - 1,
                  o: b.octet + 1,
                })}
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-3 lg:sticky lg:top-3">
        <h2 className="text-sm font-bold tracking-widest uppercase">{t('Cómo se calcula')}</h2>
        <HowPanel ip={ip} prefix={prefix} />
      </Card>
    </div>
  )
}

// ── VLSM ────────────────────────────────────────────────────────────
function VlsmTab({ base, rows, onChange }: { base: string; rows: Row[]; onChange: (base: string, rows: Row[]) => void }) {
  const t = useT()
  const msg = useMsg()
  const fmt = useFmt()
  const parsed = parseCidr(base)
  const nameRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusRow, setFocusRow] = useState<number | null>(null)
  useEffect(() => {
    if (focusRow !== null) nameRefs.current[focusRow]?.focus()
  }, [focusRow])

  const hostError = (h: string) => {
    if (h.trim() === '') return t('Escribe cuántos hosts necesita')
    const n = Number(h)
    if (!Number.isInteger(n) || n < 1) return t('Tiene que ser un número entero mayor que 0')
    if (prefixFor(n) < 0) return t('Demasiados hosts para IPv4')
    return undefined
  }
  const valid: VlsmRow[] = rows.filter((r) => !hostError(r.hosts)).map((r, i) => ({ name: r.name.trim() || t('Subred {n}', { n: i + 1 }), hosts: Number(r.hosts) }))
  const result = parsed.ok ? vlsm(parsed, valid) : null

  const setRow = (i: number, r: Partial<Row>) => onChange(base, rows.map((x, j) => (j === i ? { ...x, ...r } : x)))

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-4">
        <CidrField id="vlsm-base" label={t('Red que quieres repartir')} value={base} onChange={(v) => onChange(v, rows)} error={parsed.ok ? undefined : msg(parsed.error)} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[11px] font-bold tracking-wider uppercase">{t('Subredes que necesitas')}</legend>
          {rows.map((r, i) => {
            const err = hostError(r.hosts)
            return (
              <div key={i} className="grid grid-cols-[1fr_6.5rem_auto] items-start gap-2">
                <div>
                  <label htmlFor={`vlsm-name-${i}`} className="sr-only">
                    {t('Nombre de la subred {n}', { n: i + 1 })}
                  </label>
                  <input
                    id={`vlsm-name-${i}`}
                    ref={(el) => {
                      nameRefs.current[i] = el
                    }}
                    value={r.name}
                    maxLength={24}
                    placeholder={t('Nombre')}
                    onChange={(e) => setRow(i, { name: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-line-strong bg-bg px-3"
                  />
                </div>
                <div>
                  <label htmlFor={`vlsm-hosts-${i}`} className="sr-only">
                    {t('Hosts de {name}', { name: r.name || t('Subred {n}', { n: i + 1 }) })}
                  </label>
                  <input
                    id={`vlsm-hosts-${i}`}
                    value={r.hosts}
                    inputMode="numeric"
                    placeholder={t('Hosts')}
                    aria-invalid={!!err}
                    aria-describedby={err ? `vlsm-hosts-${i}-error` : undefined}
                    onChange={(e) => setRow(i, { hosts: e.target.value.replace(/[^\d]/g, '') })}
                    className={`min-h-11 w-full rounded-md border bg-bg px-3 font-mono ${err ? 'border-[var(--k-err)]' : 'border-line-strong'}`}
                  />
                  {err && (
                    <p id={`vlsm-hosts-${i}-error`} className="mt-1 text-xs text-[var(--k-err)]">
                      {err}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" label={t('Eliminar la subred {name}', { name: r.name || t('Subred {n}', { n: i + 1 }) })} onClick={() => onChange(base, rows.filter((_, j) => j !== i))}>
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </div>
            )
          })}
          <Button
            className="self-start"
            disabled={rows.length >= 32}
            onClick={() => {
              onChange(base, [...rows, { name: '', hosts: '' }])
              setFocusRow(rows.length)
            }}
          >
            <Plus aria-hidden className="size-4" />
            {t('Añadir subred')}
          </Button>
        </fieldset>
      </Card>

      {result && valid.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold tracking-widest uppercase">{t('Reparto')}</h2>
          <p aria-live="polite" className={`text-sm ${result.missing ? 'font-bold text-[var(--k-err)]' : ''}`}>
            {result.missing
              ? t('No cabe: faltan {n} direcciones. Usa una red /{p} o pide menos hosts.', { n: fmt(result.missing), p: result.needPrefix })
              : t('Cabe todo: {used} direcciones usadas y {free} libres.', { used: fmt(result.used), free: fmt(result.free) })}
          </p>
          <div className="relative overflow-x-auto rounded-md" tabIndex={0} role="region" aria-label={t('Subredes asignadas, de mayor a menor')}>
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">{t('Subredes asignadas, de mayor a menor')}</caption>
              <thead className="text-[11px] tracking-wider text-muted uppercase">
                <tr className="border-b border-line">
                  {['Nombre', 'Pedidos', 'Red', 'Rango de hosts', 'Broadcast', 'Sobran'].map((h) => (
                    <th key={h} scope="col" className="px-2 py-2">
                      {t(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {result.allocs.map((a, k) => (
                  <tr key={k} className={`border-b border-line odd:bg-panel-2 ${a.fits ? '' : 'text-[var(--k-err)]'}`}>
                    <td className="max-w-[10rem] truncate px-2 py-2 font-sans font-bold" title={a.name}>
                      {a.name}
                    </td>
                    <td className="px-2 py-2">{fmt(a.hosts)}</td>
                    <td className="px-2 py-2">{a.fits ? `${toIp(a.network)}/${a.prefix}` : t('no cabe')}</td>
                    <td className="px-2 py-2">{a.fits ? `${toIp(a.first)} – ${toIp(a.last)}` : '—'}</td>
                    <td className="px-2 py-2">{a.fits ? toIp(a.broadcast) : '—'}</td>
                    <td className="px-2 py-2">{fmt(a.waste)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">{t('Se asignan de mayor a menor para que cada bloque empiece en un múltiplo de su tamaño y no se solapen.')}</p>
        </Card>
      )}
    </div>
  )
}

// ── practice ────────────────────────────────────────────────────────
function questionText(q: Question, t: ReturnType<typeof useT>, fmt: (n: number) => string) {
  switch (q.kind) {
    case 'network':
      return t('¿Cuál es la dirección de red de {ip}/{p}?', { ip: toIp(q.ip), p: q.prefix })
    case 'broadcast':
      return t('¿Cuál es el broadcast de {ip}/{p}?', { ip: toIp(q.ip), p: q.prefix })
    case 'hosts':
      return t('¿Cuántos hosts útiles tiene una red /{p}?', { p: q.prefix })
    case 'prefix':
      return t('¿Qué prefijo necesitas, como mínimo, para {n} hosts?', { n: fmt(q.hosts) })
    case 'same':
      return t('¿Están {a} y {b} en la misma subred /{p}?', { a: toIp(q.ip), b: toIp(q.other), p: q.prefix })
  }
}

function PracticeTab() {
  const t = useT()
  const fmt = useFmt()
  const [q, setQ] = useState<Question>(() => makeQuestion())
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<null | boolean>(null)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState({ ok: 0, total: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const submit = (given: string) => {
    if (result !== null || !given.trim()) return
    const ok = checkAnswer(q, given)
    setResult(ok)
    setStreak((s) => (ok ? s + 1 : 0))
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }))
    setTimeout(() => nextRef.current?.focus(), 0)
  }
  const next = () => {
    setQ(makeQuestion())
    setAnswer('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }
  const shown = q.kind === 'same' ? (q.answer === 'si' ? t('Sí') : t('No')) : q.kind === 'prefix' ? `/${q.answer}` : q.kind === 'hosts' ? fmt(Number(q.answer)) : q.answer

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[1fr_minmax(20rem,26rem)]">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>{t('Aciertos: {ok} de {total}', score)}</span>
          <span>{t('Racha: {n}', { n: streak })}</span>
        </div>
        <h2 id="practice-q" className="text-xl font-bold">
          {questionText(q, t, fmt)}
        </h2>
        {q.kind === 'same' ? (
          <div className="flex gap-2">
            {(['si', 'no'] as const).map((v) => (
              <Button key={v} disabled={result !== null} aria-pressed={answer === v} onClick={() => (setAnswer(v), submit(v))}>
                {v === 'si' ? t('Sí') : t('No')}
              </Button>
            ))}
          </div>
        ) : (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              submit(answer)
            }}
          >
            <div className="flex min-w-48 flex-1 flex-col gap-1.5">
              <label htmlFor="practice-answer" className="text-[11px] font-bold tracking-wider uppercase">
                {t('Tu respuesta')}
              </label>
              <input
                id="practice-answer"
                ref={inputRef}
                value={answer}
                readOnly={result !== null}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className="min-h-11 w-full rounded-md border border-line-strong bg-bg px-3 font-mono text-lg"
              />
            </div>
            <Button type="submit" variant="primary" disabled={result !== null || !answer.trim()}>
              {t('Comprobar')}
            </Button>
          </form>
        )}
        <div aria-live="polite">
          {result !== null && (
            <p className={`font-bold ${result ? 'text-[var(--k-tcp)]' : 'text-[var(--k-err)]'}`}>
              {result ? t('¡Correcto!') : t('No es correcto. La respuesta es {a}.', { a: shown })}
            </p>
          )}
        </div>
        {result !== null && (
          <Button ref={nextRef} variant="primary" className="self-start" onClick={next}>
            {t('Siguiente ejercicio')}
          </Button>
        )}
      </Card>

      {result === false && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-bold tracking-widest uppercase">{t('Solución paso a paso')}</h2>
          {q.kind === 'prefix' ? (
            <p className="text-sm leading-relaxed">
              {t('{h} hosts + la red + el broadcast = {n} direcciones. La potencia de 2 que lo cubre es 2^{b} = {pow}, así que quedan {b} bits de host: /{p}.', {
                h: fmt(q.hosts),
                n: fmt(q.hosts + 2),
                b: 32 - prefixFor(q.hosts),
                pow: fmt(2 ** (32 - prefixFor(q.hosts))),
                p: prefixFor(q.hosts),
              })}
            </p>
          ) : (
            <>
              <HowPanel ip={q.ip} prefix={q.prefix} />
              {q.kind === 'same' && (
                <p className="text-sm">
                  {t('{b} está en la red {net}.', { b: toIp(q.other), net: toIp(subnetInfo(q.other, q.prefix).network) })}
                </p>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}
