import { describe, expect, it } from 'vitest'
import { blockOf, checkAnswer, makeQuestion, maskOf, parseCidr, prefixFor, prefixOfMask, subnetInfo, toIp, usableHosts, vlsm } from './subnet'

const parse = (s: string) => {
  const r = parseCidr(s)
  if (!r.ok) throw new Error(r.error.key)
  return r
}
const info = (s: string) => {
  const r = parse(s)
  const i = subnetInfo(r.ip, r.prefix)
  return { net: toIp(i.network), bc: toIp(i.broadcast), first: toIp(i.first), last: toIp(i.last), hosts: i.hosts, mask: toIp(i.mask), wild: toIp(i.wildcard), kind: i.kind, cls: i.cls }
}

describe('parseCidr', () => {
  it('reads the usual ways of writing a subnet', () => {
    expect(parse('192.168.10.77/26')).toMatchObject({ prefix: 26 })
    expect(parse('192.168.10.77 /26').prefix).toBe(26)
    expect(parse('192.168.10.77 26').prefix).toBe(26)
    expect(parse('192.168.10.77 255.255.255.192').prefix).toBe(26)
    expect(parse('  IP: 10.0.0.5/8  ').prefix).toBe(8)
  })
  it('uses the class prefix when there is none, with a warning', () => {
    const r = parse('172.20.1.1')
    expect(r.prefix).toBe(16)
    expect(r.warnings[0].key).toMatch(/clase/)
  })
  it('accepts leading zeros as decimal, with a warning', () => {
    const r = parse('192.168.010.1/24')
    expect(toIp(r.ip)).toBe('192.168.10.1')
    expect(r.warnings).toHaveLength(1)
  })
  it.each([
    ['', 'Escribe'],
    ['192.168.1/24', '4 números'],
    ['192.168.300.1/24', 'máximo es 255'],
    ['192.168.a.1/24', 'no es un número'],
    ['10.0.0.1/33', 'va de /0 a /32'],
    ['10.0.0.1 255.0.255.0', 'seguidos'],
  ])('rejects %j', (s, msg) => {
    const r = parseCidr(s)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.key).toContain(msg)
  })
})

describe('subnetInfo', () => {
  it('computes a /26', () => {
    expect(info('192.168.10.77/26')).toEqual({ net: '192.168.10.64', bc: '192.168.10.127', first: '192.168.10.65', last: '192.168.10.126', hosts: 62, mask: '255.255.255.192', wild: '0.0.0.63', kind: 'Privada (RFC 1918)', cls: 'C' })
  })
  it('handles the extremes', () => {
    expect(info('0.0.0.0/0')).toMatchObject({ net: '0.0.0.0', bc: '255.255.255.255', mask: '0.0.0.0', hosts: 4294967294 })
    expect(info('10.0.0.6/31')).toMatchObject({ net: '10.0.0.6', bc: '10.0.0.7', first: '10.0.0.6', last: '10.0.0.7', hosts: 2 })
    expect(info('10.0.0.6/32')).toMatchObject({ net: '10.0.0.6', bc: '10.0.0.6', first: '10.0.0.6', last: '10.0.0.6', hosts: 1 })
    expect(info('255.255.255.255/32').kind).toBe('Difusión limitada')
  })
  it('names special ranges', () => {
    expect(info('100.70.1.1/10').kind).toBe('CGNAT (RFC 6598)')
    expect(info('169.254.3.3/16').kind).toBe('Enlace local (APIPA)')
    expect(info('127.0.0.1/8').kind).toBe('Loopback')
    expect(info('224.0.0.251/32').kind).toBe('Multicast')
    expect(info('172.32.0.1/16').kind).toBe('Pública')
    expect(info('172.31.255.1/16').kind).toBe('Privada (RFC 1918)')
  })
  it('agrees for every prefix', () => {
    for (let p = 0; p <= 32; p++) {
      expect(prefixOfMask(maskOf(p))).toBe(p)
      const i = subnetInfo(0xc0a80a4d, p)
      expect(i.broadcast - i.network + 1).toBe(i.total)
      expect(i.hosts).toBe(usableHosts(p))
    }
  })
})

describe('helpers', () => {
  it('finds the block size', () => {
    expect(blockOf(26)).toEqual({ octet: 3, maskOctet: 192, size: 64, blocks: 4 })
    expect(blockOf(20)).toEqual({ octet: 2, maskOctet: 240, size: 16, blocks: 16 })
    expect(blockOf(24)).toEqual({ octet: 2, maskOctet: 255, size: 1, blocks: 256 })
    expect(blockOf(32)).toBeNull()
  })
  it('finds the prefix for a number of hosts', () => {
    expect(prefixFor(50)).toBe(26)
    expect(prefixFor(62)).toBe(26)
    expect(prefixFor(63)).toBe(25)
    expect(prefixFor(2)).toBe(30)
    expect(prefixFor(0)).toBe(-1)
  })
})

describe('vlsm', () => {
  it('places the largest first, aligned', () => {
    const r = vlsm(parse('192.168.1.0/24'), [
      { name: 'IT', hosts: 20 },
      { name: 'Wifi', hosts: 100 },
      { name: 'Ventas', hosts: 50 },
      { name: 'Enlace', hosts: 2 },
    ])
    expect(r.allocs.map((a) => `${a.name} ${toIp(a.network)}/${a.prefix}`)).toEqual(['Wifi 192.168.1.0/25', 'Ventas 192.168.1.128/26', 'IT 192.168.1.192/27', 'Enlace 192.168.1.224/30'])
    expect(r.allocs.every((a) => a.fits)).toBe(true)
    expect(r.free).toBe(256 - 128 - 64 - 32 - 4)
    expect(r.missing).toBe(0)
  })
  it('says how much is missing', () => {
    const r = vlsm(parse('10.0.0.0/24'), [
      { name: 'A', hosts: 200 },
      { name: 'B', hosts: 100 },
    ])
    expect(r.allocs[1].fits).toBe(false)
    expect(r.missing).toBe(128)
    expect(r.needPrefix).toBe(23)
  })
  it('uses the network even if a host address is given, and keeps ties in order', () => {
    const r = vlsm(parse('10.0.0.77/24'), [
      { name: 'X', hosts: 10 },
      { name: 'Y', hosts: 10 },
    ])
    expect(r.allocs.map((a) => `${a.name} ${toIp(a.network)}`)).toEqual(['X 10.0.0.0', 'Y 10.0.0.16'])
  })
})

describe('practice', () => {
  it('generates questions whose own answer is right', () => {
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(rand)
      expect(checkAnswer(q, q.answer)).toBe(true)
      if (q.kind === 'same') {
        const a = subnetInfo(q.ip, q.prefix).network
        const b = subnetInfo(q.other, q.prefix).network
        expect(q.answer).toBe(a === b ? 'si' : 'no')
      }
    }
  })
  it('is lenient with the format', () => {
    expect(checkAnswer({ kind: 'prefix', hosts: 50, answer: '26' }, ' /26 ')).toBe(true)
    expect(checkAnswer({ kind: 'hosts', ip: 0, prefix: 22, answer: '1022' }, '1.022')).toBe(true)
    expect(checkAnswer({ kind: 'network', ip: 0, prefix: 24, answer: '10.0.0.0' }, '10.0.0.0/24')).toBe(true)
    expect(checkAnswer({ kind: 'network', ip: 0, prefix: 24, answer: '10.0.0.0' }, '10.0.0.1')).toBe(false)
  })
})
