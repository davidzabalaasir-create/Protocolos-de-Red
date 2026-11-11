import { describe, expect, it } from 'vitest'
import { PROTOCOLS, route } from '../data/protocols'
import { QUIZ } from '../data/quiz'
import { decodePacket } from './decode'
import { buildPcapng } from './pcap'

const all = PROTOCOLS.flatMap((p) => p.packets.map((pk, i) => ({ proto: p, pk, i, name: `${p.id} #${i + 1} ${pk.info}` })))

/** Internet checksum over bytes; a correct region (checksum included) sums to 0. */
function sum16(b: ArrayLike<number>) {
  let s = 0
  for (let i = 0; i < b.length; i += 2) s += (b[i] << 8) + (b[i + 1] ?? 0)
  while (s >> 16) s = (s & 0xffff) + (s >> 16)
  return ~s & 0xffff
}

describe('lecciones', () => {
  it('tienen identificadores únicos', () => {
    const ids = PROTOCOLS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(PROTOCOLS.map((p) => [p.id, p] as const))('%s tiene quiz válido', (_, p) => {
    const qs = QUIZ[p.id]
    expect(qs?.length).toBeGreaterThanOrEqual(2)
    for (const q of qs) expect(q.answer).toBeLessThan(q.options.length)
  })

  it.each(all.map((x) => [x.name, x] as const))('ruta válida: %s', (_, { pk }) => {
    const r = route(pk.from, pk.to)
    expect(r[0]).toBe(pk.from)
    expect(r[r.length - 1]).toBe(pk.to)
  })
})

describe('decodificador', () => {
  it.each(all.map((x) => [x.name, x] as const))('%s', (_, { pk }) => {
    const shown = decodePacket(pk)
    for (const l of shown.layers)
      for (const f of l.fields) {
        expect(f.len, `${l.name} › ${f.name}`).toBeGreaterThan(0)
        expect(f.start + f.len, `${l.name} › ${f.name}`).toBeLessThanOrEqual(shown.bytes.length)
        expect(f.value, `${l.name} › ${f.name}`).not.toBe('')
      }

    const { bytes: b, linktype } = decodePacket(pk, { full: true })
    if (linktype !== 1) return
    let ip = 14
    if (b[12] === 0x81 && b[13] === 0x00) ip += 4 // 802.1Q tag
    const ethertype = (b[ip - 2] << 8) | b[ip - 1]

    if (ethertype === 0x0800) {
      const header = b.slice(ip, ip + 20)
      expect(sum16(header), 'checksum IPv4').toBe(0)
      const total = (b[ip + 2] << 8) | b[ip + 3]
      expect(total, 'longitud total IPv4').toBe(b.length - ip)
      const proto = b[ip + 9]
      const fragmented = (b[ip + 6] & 0x3f) !== 0 || b[ip + 7] !== 0 || (b[ip + 6] & 0x20) !== 0
      if (fragmented) return
      const seg = b.slice(ip + 20)
      if (proto === 6 || proto === 17) {
        const pseudo = [...b.slice(ip + 12, ip + 20), 0, proto, seg.length >> 8, seg.length & 0xff]
        expect(sum16([...pseudo, ...seg]), proto === 6 ? 'checksum TCP' : 'checksum UDP').toBe(0)
        if (proto === 17) expect((seg[4] << 8) | seg[5], 'longitud UDP').toBe(seg.length)
      } else if (proto === 1 || proto === 2) expect(sum16(seg), proto === 1 ? 'checksum ICMP' : 'checksum IGMP').toBe(0)
    } else if (ethertype === 0x86dd) {
      const plen = (b[ip + 4] << 8) | b[ip + 5]
      expect(plen, 'longitud de carga IPv6').toBe(b.length - ip - 40)
      const pseudo = [...b.slice(ip + 8, ip + 40), 0, 0, plen >> 8, plen & 0xff, 0, 0, 0, b[ip + 6]]
      expect(sum16([...pseudo, ...b.slice(ip + 40)]), 'checksum ICMPv6').toBe(0)
    }
  })
})

describe('captura pcapng', () => {
  it.each(PROTOCOLS.map((p) => [p.id, p] as const))('%s', (_, p) => {
    const out = buildPcapng(p)
    const v = new DataView(out.buffer)
    let o = 0
    let packets = 0
    let interfaces = 0
    while (o < out.length) {
      const type = v.getUint32(o, true)
      const len = v.getUint32(o + 4, true)
      expect(len % 4).toBe(0)
      expect(v.getUint32(o + len - 4, true)).toBe(len)
      if (o === 0) {
        expect(type).toBe(0x0a0d0d0a)
        expect(v.getUint32(8, true)).toBe(0x1a2b3c4d)
      }
      if (type === 1) interfaces++
      if (type === 6) {
        packets++
        expect(v.getUint32(o + 8, true)).toBeLessThan(interfaces)
      }
      o += len
    }
    expect(o).toBe(out.length)
    expect(packets).toBe(p.packets.length)
  })
})

describe('traducción al inglés', () => {
  it.each(PROTOCOLS.map((p) => [p.id, p] as const))('%s está completa y alineada', async (_, p) => {
    const { LESSONS_EN, loadEnglish } = await import('../i18n')
    await loadEnglish()
    const en = LESSONS_EN[p.id]
    expect(en, 'falta la lección en inglés').toBeDefined()
    expect(en.notes.length, 'notas').toBe(p.packets.length)
    expect(en.facts.length, 'ficha').toBe(p.facts.length)
    expect(en.quiz.length, 'quiz').toBe(QUIZ[p.id].length)
    en.quiz.forEach((q, i) => {
      expect(q.options.length).toBe(QUIZ[p.id][i].options.length)
      expect(q.answer, `respuesta correcta de la pregunta ${i + 1}`).toBe(QUIZ[p.id][i].answer)
    })
  })

  it('la interfaz no deja textos de la lista de capas o del recorrido sin traducir', async () => {
    const { UI_EN } = await import('../i18n/ui-en')
    const { OSI_LAYERS } = await import('../data/protocols')
    const { TOUR } = await import('../data/tour')
    for (const name of Object.values(OSI_LAYERS)) expect(UI_EN[name], name).toBeDefined()
    for (const t of TOUR) expect(UI_EN[t.why], t.why).toBeDefined()
  })
})

describe('textos de la interfaz', () => {
  it('cada t("…") literal tiene traducción al inglés', async () => {
    const { readFileSync, readdirSync } = await import('node:fs')
    const { UI_EN } = await import('../i18n/ui-en')
    const dir = new URL('../components/', import.meta.url)
    const files = [...readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => new URL(f, dir)), new URL('../App.tsx', import.meta.url)]
    const missing: string[] = []
    for (const f of files)
      for (const m of readFileSync(f, 'utf8').matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)) if (!(m[1] in UI_EN)) missing.push(m[1])
    expect(missing).toEqual([])
  })
})

describe('regresiones del decodificador', () => {
  it('DHCP usa los puertos 68 → 67 aunque el resumen tenga flechas entre IP', () => {
    const p = PROTOCOLS.find((x) => x.id === 'dhcp')!.packets[0]
    const f = decodePacket(p)
    const udp = f.layers.find((l) => l.id === 'udp')!
    expect(udp.fields.find((x) => x.name === 'Puerto origen')!.value).toBe('68')
    expect(udp.fields.find((x) => x.name === 'Puerto destino')!.value).toBe('67')
  })
})
