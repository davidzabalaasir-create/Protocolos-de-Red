import type { Protocol } from '../data/protocols'
import { decodePacket } from './decode'

/**
 * Writes a lesson as a pcapng capture that Wireshark opens directly. pcapng (not classic pcap)
 * because some lessons mix link types: Ethernet (1), IEEE 802.11 (105) and Bluetooth LE (251)
 * each get their own interface block.
 */
export function buildPcapng(protocol: Protocol, startMs = Date.UTC(2026, 10, 10, 10, 0, 0)): Uint8Array {
  const frames = protocol.packets.map((p) => ({ p, f: decodePacket(p, { full: true }) }))
  const linktypes = [...new Set(frames.map(({ f }) => f.linktype))]
  const parts: Uint8Array[] = []

  const block = (type: number, body: Uint8Array) => {
    const pad = (4 - (body.length % 4)) % 4
    const total = 12 + body.length + pad
    const b = new Uint8Array(total)
    const v = new DataView(b.buffer)
    v.setUint32(0, type, true)
    v.setUint32(4, total, true)
    b.set(body, 8)
    v.setUint32(total - 4, total, true)
    parts.push(b)
  }

  // Section Header Block
  const shb = new Uint8Array(16)
  const sv = new DataView(shb.buffer)
  sv.setUint32(0, 0x1a2b3c4d, true)
  sv.setUint16(4, 1, true)
  sv.setUint16(6, 0, true)
  sv.setBigInt64(8, -1n, true)
  block(0x0a0d0d0a, shb)

  // One Interface Description Block per link type
  for (const lt of linktypes) {
    const idb = new Uint8Array(8)
    const iv = new DataView(idb.buffer)
    iv.setUint16(0, lt, true)
    iv.setUint32(4, 0, true)
    block(0x00000001, idb)
  }

  // Enhanced Packet Blocks
  for (const { p, f } of frames) {
    const ts = BigInt(startMs) * 1000n + BigInt(Math.round(p.t * 1e6))
    const body = new Uint8Array(20 + f.bytes.length)
    const bv = new DataView(body.buffer)
    bv.setUint32(0, linktypes.indexOf(f.linktype), true)
    bv.setUint32(4, Number(ts >> 32n), true)
    bv.setUint32(8, Number(ts & 0xffffffffn), true)
    bv.setUint32(12, f.bytes.length, true)
    bv.setUint32(16, f.bytes.length, true)
    body.set(f.bytes, 20)
    block(0x00000006, body)
  }

  const out = new Uint8Array(parts.reduce((n, b) => n + b.length, 0))
  let o = 0
  for (const b of parts) {
    out.set(b, o)
    o += b.length
  }
  return out
}

export function downloadPcapng(protocol: Protocol) {
  const blob = new Blob([buildPcapng(protocol) as BlobPart], { type: 'application/vnd.tcpdump.pcap' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `protocolos-de-red-${protocol.id}.pcapng`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
