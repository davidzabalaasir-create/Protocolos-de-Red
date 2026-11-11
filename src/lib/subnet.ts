// IPv4 subnetting maths. Addresses are unsigned 32-bit integers (`>>> 0` everywhere).
// Messages are Spanish keys with {placeholders}, translated by the UI with t().

export interface Msg {
  key: string
  vars?: Record<string, string | number>
}

export interface Cidr {
  ip: number
  prefix: number
}

export type ParseResult = ({ ok: true } & Cidr & { warnings: Msg[] }) | { ok: false; error: Msg }

export const toIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.')
export const toBits = (n: number) => (n >>> 0).toString(2).padStart(32, '0')
export const maskOf = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0)

/** Prefix of a contiguous mask, or -1 when the ones are not all together on the left. */
export function prefixOfMask(mask: number) {
  const bits = toBits(mask)
  return /^1*0*$/.test(bits) ? bits.indexOf('0') === -1 ? 32 : bits.indexOf('0') : -1
}

function parseIp(text: string, warnings: Msg[]): number | Msg {
  const parts = text.split('.')
  if (parts.length !== 4 || parts.some((p) => p === '')) return { key: 'Una IPv4 tiene 4 números separados por puntos, p. ej. 192.168.1.10' }
  let n = 0
  for (let i = 0; i < 4; i++) {
    if (!/^\d{1,3}$/.test(parts[i])) return { key: 'El octeto {n} («{v}») no es un número entre 0 y 255', vars: { n: i + 1, v: parts[i] } }
    const v = Number(parts[i])
    if (v > 255) return { key: 'El octeto {n} vale {v}; el máximo es 255', vars: { n: i + 1, v } }
    if (parts[i].length > 1 && parts[i].startsWith('0')) warnings.push({ key: 'Se han quitado los ceros a la izquierda ({v} → {n})', vars: { v: parts[i], n: v } })
    n = n * 256 + v
  }
  return n >>> 0
}

const DEFAULT_PREFIX = (ip: number) => (ip >>> 24 < 128 ? 8 : ip >>> 24 < 192 ? 16 : 24)

/** Accepts "10.0.0.5/8", "10.0.0.5 8", "10.0.0.5 255.0.0.0", "10.0.0.5" or pasted text around them. */
export function parseCidr(input: string): ParseResult {
  const text = input.trim()
  if (!text) return { ok: false, error: { key: 'Escribe una IP con su prefijo, p. ej. 192.168.1.0/24' } }
  const m = text.match(/([0-9a-z]+(?:\.[0-9a-z]*)+)(?:\s*\/\s*(\d+)|\s+(\d+(?:\.\d+){3})(?!\d)|\s+(\d+)(?![\d.]))?/i)
  if (!m) return { ok: false, error: { key: 'Escribe una IP con su prefijo, p. ej. 192.168.1.0/24' } }
  const warnings: Msg[] = []
  const ip = parseIp(m[1], warnings)
  if (typeof ip !== 'number') return { ok: false, error: ip }
  let prefix: number
  if (m[2] !== undefined || m[4] !== undefined) {
    prefix = Number(m[2] ?? m[4])
    if (prefix > 32) return { ok: false, error: { key: 'El prefijo /{p} no existe: va de /0 a /32', vars: { p: prefix } } }
  } else if (m[3] !== undefined) {
    const mask = parseIp(m[3], [])
    if (typeof mask !== 'number') return { ok: false, error: mask }
    prefix = prefixOfMask(mask)
    if (prefix < 0) return { ok: false, error: { key: 'La máscara {m} no es válida: sus unos deben ir todos seguidos a la izquierda', vars: { m: m[3] } } }
  } else {
    prefix = DEFAULT_PREFIX(ip)
    warnings.push({ key: 'Sin prefijo: se usa el de su clase (/{p})', vars: { p: prefix } })
  }
  return { ok: true, ip, prefix, warnings }
}

const inRange = (ip: number, base: string, prefix: number) => ((ip & maskOf(prefix)) >>> 0) === ((parseIp(base, []) as number) & maskOf(prefix)) >>> 0

/** Spanish label of the kind of address (key for t()). */
export function kindOf(ip: number) {
  if (inRange(ip, '10.0.0.0', 8) || inRange(ip, '172.16.0.0', 12) || inRange(ip, '192.168.0.0', 16)) return 'Privada (RFC 1918)'
  if (inRange(ip, '100.64.0.0', 10)) return 'CGNAT (RFC 6598)'
  if (inRange(ip, '127.0.0.0', 8)) return 'Loopback'
  if (inRange(ip, '169.254.0.0', 16)) return 'Enlace local (APIPA)'
  if (inRange(ip, '0.0.0.0', 8)) return 'Esta red (0.0.0.0/8)'
  if (inRange(ip, '224.0.0.0', 4)) return 'Multicast'
  if (ip === 0xffffffff) return 'Difusión limitada'
  if (inRange(ip, '240.0.0.0', 4)) return 'Reservada'
  if (inRange(ip, '192.0.2.0', 24) || inRange(ip, '198.51.100.0', 24) || inRange(ip, '203.0.113.0', 24)) return 'Documentación (RFC 5737)'
  return 'Pública'
}

export const classOf = (ip: number) => {
  const a = ip >>> 24
  return a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D' : 'E'
}

/** Usable hosts: 2^h − 2, except /31 (2, point-to-point links, RFC 3021) and /32 (1). */
export const usableHosts = (prefix: number) => (prefix === 32 ? 1 : prefix === 31 ? 2 : 2 ** (32 - prefix) - 2)

export interface SubnetInfo {
  ip: number
  prefix: number
  network: number
  broadcast: number
  first: number
  last: number
  total: number
  hosts: number
  mask: number
  wildcard: number
  cls: string
  kind: string
}

export function subnetInfo(ip: number, prefix: number): SubnetInfo {
  const mask = maskOf(prefix)
  const network = (ip & mask) >>> 0
  const broadcast = (network | ~mask) >>> 0
  const small = prefix >= 31
  return {
    ip,
    prefix,
    network,
    broadcast,
    first: small ? network : network + 1,
    last: small ? broadcast : broadcast - 1,
    total: 2 ** (32 - prefix),
    hosts: usableHosts(prefix),
    mask,
    wildcard: ~mask >>> 0,
    cls: classOf(ip),
    kind: kindOf(ip),
  }
}

/** The octet where network and host bits meet, and the block size ("salto") in it. */
export function blockOf(prefix: number) {
  if (prefix === 0 || prefix === 32) return null
  const octet = Math.min(3, Math.floor((prefix - 1) / 8))
  const maskOctet = (maskOf(prefix) >>> (24 - octet * 8)) & 255
  return { octet, maskOctet, size: 256 - maskOctet, blocks: 256 / (256 - maskOctet) }
}

/** Smallest prefix whose usable hosts cover `hosts` (classic rule: hosts + network + broadcast). */
export function prefixFor(hosts: number) {
  if (hosts <= 0) return -1
  const p = 32 - Math.ceil(Math.log2(hosts + 2))
  return p < 0 ? -1 : p
}

// ── VLSM ─────────────────────────────────────────────────────────────
export interface VlsmRow {
  name: string
  hosts: number
}

export interface VlsmAlloc extends VlsmRow {
  prefix: number
  network: number
  broadcast: number
  first: number
  last: number
  usable: number
  waste: number
  fits: boolean
}

export interface VlsmResult {
  allocs: VlsmAlloc[]
  used: number
  free: number
  /** addresses missing when not everything fits (0 when it does) */
  missing: number
  /** smallest prefix of the base network that would fit everything */
  needPrefix: number
}

/** Largest subnets first so every block stays aligned. Ties keep the order they were written in. */
export function vlsm(base: Cidr, rows: VlsmRow[]): VlsmResult {
  const network = (base.ip & maskOf(base.prefix)) >>> 0
  const end = network + 2 ** (32 - base.prefix)
  const valid = rows.filter((r) => prefixFor(r.hosts) >= 0)
  const sorted = valid.map((r, i) => ({ r, i })).sort((a, b) => b.r.hosts - a.r.hosts || a.i - b.i)
  let next = network
  let needed = 0
  const allocs = sorted.map(({ r }) => {
    const prefix = prefixFor(r.hosts)
    const size = 2 ** (32 - prefix)
    needed += size
    const fits = next + size <= end
    const net = next
    next += size
    const usable = usableHosts(prefix)
    return { ...r, prefix, network: net >>> 0, broadcast: (net + size - 1) >>> 0, first: (net + 1) >>> 0, last: (net + size - 2) >>> 0, usable, waste: usable - r.hosts, fits }
  })
  const total = end - network
  const missing = Math.max(0, needed - total)
  return { allocs, used: Math.min(needed, total), free: Math.max(0, total - needed), missing, needPrefix: needed === 0 ? 32 : 32 - Math.ceil(Math.log2(needed)) }
}

// ── practice ─────────────────────────────────────────────────────────
export type Question =
  | { kind: 'network' | 'broadcast' | 'hosts'; ip: number; prefix: number; answer: string }
  | { kind: 'prefix'; hosts: number; answer: string }
  | { kind: 'same'; ip: number; other: number; prefix: number; answer: 'si' | 'no' }

export function makeQuestion(rand: () => number = Math.random): Question {
  const pick = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
  const prefix = pick(18, 30)
  const firsts = [10, 172, 192]
  const a = firsts[pick(0, 2)]
  const ip = (((a === 10 ? 10 : a) << 24) | ((a === 172 ? pick(16, 31) : a === 192 ? 168 : pick(0, 255)) << 16) | (pick(0, 255) << 8) | pick(1, 254)) >>> 0
  const info = subnetInfo(ip, prefix)
  const kind = (['network', 'broadcast', 'hosts', 'prefix', 'same'] as const)[pick(0, 4)]
  if (kind === 'network') return { kind, ip, prefix, answer: toIp(info.network) }
  if (kind === 'broadcast') return { kind, ip, prefix, answer: toIp(info.broadcast) }
  if (kind === 'hosts') return { kind, ip, prefix, answer: String(info.hosts) }
  if (kind === 'prefix') {
    const hosts = pick(3, 1000)
    return { kind, hosts, answer: String(prefixFor(hosts)) }
  }
  // half the time the other address is in the same subnet
  const same = rand() < 0.5
  const other = same ? (info.network + pick(0, info.total - 1)) >>> 0 : (info.network + info.total * (rand() < 0.5 ? 1 : -1) + pick(0, info.total - 1)) >>> 0
  return { kind, ip, other, prefix, answer: same ? 'si' : 'no' }
}

/** Lenient comparison: spaces, a leading "/" and thousands separators don't matter. */
export function checkAnswer(q: Question, given: string) {
  const norm = (s: string) => s.trim().toLowerCase().replace(/^\//, '').replace(/[\s.,](?=\d{3}\b)/g, '').replace(/í/g, 'i')
  if (q.kind === 'network' || q.kind === 'broadcast') {
    const r = parseCidr(given.split('/')[0])
    return r.ok && toIp(r.ip) === q.answer
  }
  return norm(given) === q.answer
}
