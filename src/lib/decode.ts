import { NODES, route, type NodeId, type Packet } from '../data/protocols'

/**
 * Builds a realistic frame for a lesson packet — Ethernet, IPv4, TCP/UDP/ICMP/ARP and the
 * application payload — and records which bytes belong to each field, so the inspector can
 * show the decode next to the hex dump. Values are illustrative but structurally correct
 * (lengths, protocol numbers and IPv4/TCP/UDP checksums are computed for real).
 */

export interface Field {
  name: string
  value: string
  start: number
  len: number
}

export interface Layer {
  id: 'eth' | 'arp' | 'ip' | 'tcp' | 'udp' | 'icmp' | 'app'
  name: string
  color: string
  start: number
  len: number
  fields: Field[]
}

export interface Frame {
  bytes: Uint8Array
  layers: Layer[]
  truncated: number
}

export const LAYER_COLORS: Record<Layer['id'], string> = {
  eth: '#64748b',
  arp: '#0ea5e9',
  ip: '#3b82f6',
  tcp: '#22c55e',
  udp: '#06b6d4',
  icmp: '#f43f5e',
  app: '#eab308',
}

const MAX_PAYLOAD = 160

class Writer {
  bytes: number[] = []
  layers: Layer[] = []
  private cur: Layer | null = null

  begin(id: Layer['id'], name: string) {
    this.cur = { id, name, color: LAYER_COLORS[id], start: this.bytes.length, len: 0, fields: [] }
    this.layers.push(this.cur)
  }
  end() {
    if (this.cur) this.cur.len = this.bytes.length - this.cur.start
    this.cur = null
  }
  field(name: string, value: string, data: number[]) {
    this.cur!.fields.push({ name, value, start: this.bytes.length, len: data.length })
    this.bytes.push(...data)
  }
  pos() {
    return this.bytes.length
  }
  patch(at: number, data: number[]) {
    data.forEach((b, i) => (this.bytes[at + i] = b))
  }
}

// ── helpers ────────────────────────────────────────────────────────────────
const u8 = (n: number) => [n & 0xff]
const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff]
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
const ascii = (s: string) => [...new TextEncoder().encode(s)]
const hex2 = (n: number, w = 4) => '0x' + n.toString(16).padStart(w, '0')

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Deterministic pseudo-random bytes (stand in for ciphertext, keys, nonces). */
function noise(seed: string, n: number) {
  let x = hash(seed) || 1
  return Array.from({ length: n }, () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) & 0xff
  })
}

export function macOf(id: NodeId) {
  const h = hash(id)
  return [0x02, 0x42, (h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff]
}
const fmtMac = (m: number[]) => m.map((b) => b.toString(16).padStart(2, '0')).join(':')
const BROADCAST = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff]

function ipOf(id: NodeId) {
  const m = NODES[id].addr.match(/\d+\.\d+\.\d+\.\d+/)
  return m ? m[0] : '0.0.0.0'
}
const ipBytes = (ip: string) => ip.split('.').map(Number)

function checksum(data: number[]) {
  let sum = 0
  for (let i = 0; i < data.length; i += 2) sum += (data[i] << 8) + (data[i + 1] ?? 0)
  while (sum >> 16) sum = (sum & 0xffff) + (sum >> 16)
  return ~sum & 0xffff
}

// ── what each lesson protocol rides on ────────────────────────────────────
type Transport = { kind: 'tcp' | 'udp'; port: number; clientPort?: number } | { kind: 'icmp' } | { kind: 'arp' }

const TRANSPORT: Record<string, Transport> = {
  DNS: { kind: 'udp', port: 53, clientPort: 51515 },
  HTTP: { kind: 'tcp', port: 80 },
  TLS: { kind: 'tcp', port: 443 },
  DHCP: { kind: 'udp', port: 67, clientPort: 68 },
  UDP: { kind: 'udp', port: 5004, clientPort: 49170 },
  ICMP: { kind: 'icmp' },
  ARP: { kind: 'arp' },
  Ethernet: { kind: 'tcp', port: 9100, clientPort: 52350 },
  SSH: { kind: 'tcp', port: 22 },
  SMTP: { kind: 'tcp', port: 587 },
  WebSocket: { kind: 'tcp', port: 80 },
  QUIC: { kind: 'udp', port: 443, clientPort: 61001 },
  'HTTP/3': { kind: 'udp', port: 443, clientPort: 61001 },
  NTP: { kind: 'udp', port: 123, clientPort: 123 },
  IMAP: { kind: 'tcp', port: 143 },
  BGP: { kind: 'tcp', port: 179, clientPort: 40112 },
  WireGuard: { kind: 'udp', port: 51820, clientPort: 51820 },
}

/** Which end of a conversation is the "server" side (gets the well-known port). */
const RANK: Partial<Record<NodeId, number>> = { client: 0, isp: 0, switch: 1, router: 1, dns: 2 }
const rank = (id: NodeId) => RANK[id] ?? 3

// ── application payloads ──────────────────────────────────────────────────
function dnsPayload(w: Writer, p: Packet, isResponse: boolean) {
  // query and its response share the ID: derive it from the (unordered) pair of hosts
  const id = hash([p.from, p.to].sort().join('-')) & 0xffff
  const answer = p.info.match(/A (\d+\.\d+\.\d+\.\d+)/)
  w.field('ID de transacción', hex2(id), u16(id))
  const flags = isResponse ? (answer ? 0x8180 : 0x8100) : 0x0100
  w.field('Flags', `${hex2(flags)} (${isResponse ? 'respuesta' : 'consulta'}, recursión ${isResponse ? 'disponible' : 'deseada'})`, u16(flags))
  w.field('Preguntas', '1', u16(1))
  w.field('Respuestas', answer && isResponse ? '1' : '0', u16(answer && isResponse ? 1 : 0))
  w.field('Autoridad', '0', u16(0))
  w.field('Adicionales', '0', u16(0))
  const name = 'www.ejemplo.com'
  const qname = name.split('.').flatMap((l) => [l.length, ...ascii(l)]).concat(0)
  w.field('Nombre consultado', name, qname)
  w.field('Tipo', 'A (1)', u16(1))
  w.field('Clase', 'IN (1)', u16(1))
  if (answer && isResponse) {
    w.field('Nombre (puntero)', '0xc00c → www.ejemplo.com', u16(0xc00c))
    w.field('Tipo / Clase', 'A / IN', [...u16(1), ...u16(1)])
    const ttl = Number(p.info.match(/TTL=(\d+)/)?.[1] ?? 300)
    w.field('TTL', `${ttl} s`, u32(ttl))
    w.field('Longitud', '4', u16(4))
    w.field('Dirección', answer[1], ipBytes(answer[1]))
  }
}

function dhcpPayload(w: Writer, p: Packet, fromClient: boolean) {
  const type = /Discover/.test(p.info) ? 1 : /Offer/.test(p.info) ? 2 : /Request/.test(p.info) ? 3 : 5
  const names = { 1: 'DISCOVER', 2: 'OFFER', 3: 'REQUEST', 5: 'ACK' } as Record<number, string>
  w.field('Op', fromClient ? 'BOOTREQUEST (1)' : 'BOOTREPLY (2)', u8(fromClient ? 1 : 2))
  w.field('Hardware', 'Ethernet, 6 bytes', [1, 6])
  w.field('Saltos', '0', u8(0))
  w.field('ID de transacción', '0x3903f326', u32(0x3903f326))
  w.field('Segundos / Flags', '0 / broadcast', [0, 0, 0x80, 0])
  w.field('IP del cliente', '0.0.0.0', [0, 0, 0, 0])
  const yi = fromClient ? '0.0.0.0' : '192.168.1.10'
  w.field('IP asignada (yiaddr)', yi, ipBytes(yi))
  w.field('IP del servidor', fromClient ? '0.0.0.0' : '192.168.1.1', fromClient ? [0, 0, 0, 0] : ipBytes('192.168.1.1'))
  w.field('IP del relay', '0.0.0.0', [0, 0, 0, 0])
  w.field('MAC del cliente', fmtMac(macOf('client')), [...macOf('client'), ...Array(10).fill(0)])
  w.field('Servidor / fichero (vacíos)', '192 bytes a cero', Array(192).fill(0))
  w.field('Cookie mágica', '0x63825363 (DHCP)', u32(0x63825363))
  w.field('Opción 53: tipo', `DHCP${names[type]} (${type})`, [53, 1, type])
  if (!fromClient) w.field('Opción 3: router', '192.168.1.1', [3, 4, ...ipBytes('192.168.1.1')])
  w.field('Fin de opciones', '255', [255])
}

function textPayload(w: Writer, p: Packet, fromClient: boolean) {
  let text = p.info.replace(/\s*·\s*/g, '\r\n').replace(/ \(.*\)$/, '') + '\r\n'
  if (p.proto === 'HTTP' && fromClient) text = 'GET / HTTP/1.1\r\nHost: www.ejemplo.com\r\nUser-Agent: Mozilla/5.0\r\nAccept: text/html\r\n\r\n'
  if (p.proto === 'HTTP' && !fromClient) text = 'HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: 12543\r\n\r\n<!doctype html><html lang="es">…'
  if (p.proto === 'WebSocket' && /GET/.test(p.info)) text = 'GET /chat HTTP/1.1\r\nHost: www.ejemplo.com\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n'
  if (p.proto === 'WebSocket' && /101/.test(p.info)) text = 'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\r\n\r\n'
  if (p.proto === 'SSH') text = 'SSH-2.0-OpenSSH_9.6\r\n'
  if (p.proto === 'Ethernet') text = '%!PS-Adobe-3.0\n%%Title: documento.pdf\n'
  const firstLine = text.split('\r\n')[0]
  const bytes = ascii(text)
  w.field('Texto', `"${firstLine}"${text.length > firstLine.length + 2 ? ' …' : ''}`, bytes)
}

function wsFrame(w: Writer, p: Packet, fromClient: boolean) {
  const msg = p.info.match(/"(.+)"/)?.[1] ?? ''
  const op = /Ping/.test(p.info) ? 0x9 : /Pong/.test(p.info) ? 0xa : 0x1
  w.field('FIN + opcode', `FIN=1, ${op === 1 ? 'texto (0x1)' : op === 9 ? 'ping (0x9)' : 'pong (0xA)'}`, u8(0x80 | op))
  const data = ascii(msg)
  w.field('Máscara + longitud', `MASK=${fromClient ? 1 : 0}, ${data.length} bytes`, u8((fromClient ? 0x80 : 0) | data.length))
  if (fromClient) {
    const key = [0x37, 0xfa, 0x21, 0x3d]
    w.field('Clave de máscara', '37 fa 21 3d', key)
    w.field('Datos (enmascarados)', `"${msg}" XOR clave`, data.map((b, i) => b ^ key[i % 4]))
  } else if (data.length) w.field('Datos', `"${msg}"`, data)
}

function bgpPayload(w: Writer, p: Packet) {
  const type = /OPEN/.test(p.info) ? 1 : /UPDATE/.test(p.info) ? 2 : 4
  let body: number[] = []
  if (type === 1) {
    const as = Number(p.info.match(/AS (\d+)/)?.[1] ?? 64500)
    body = [4, ...u16(as), ...u16(90), ...ipBytes(as === 64500 ? '192.0.2.1' : '192.0.2.2'), 0]
  } else if (type === 2) {
    const [net, len] = (p.info.match(/(\d+\.\d+\.\d+\.\d+)\/(\d+)/)?.slice(1) ?? ['0.0.0.0', '0']) as [string, string]
    const as = Number(p.info.match(/AS_PATH (\d+)/)?.[1] ?? 0)
    const attrs = [0x40, 1, 1, 0, 0x40, 2, 4, 2, 1, ...u16(as), 0x40, 3, 4, ...ipBytes(as === 64500 ? '192.0.2.1' : '192.0.2.2')]
    body = [0, 0, ...u16(attrs.length), ...attrs, Number(len), ...ipBytes(net).slice(0, Math.ceil(Number(len) / 8))]
  }
  w.field('Marcador', '16 × 0xff', Array(16).fill(0xff))
  w.field('Longitud', `${19 + body.length}`, u16(19 + body.length))
  w.field('Tipo', type === 1 ? 'OPEN (1)' : type === 2 ? 'UPDATE (2)' : 'KEEPALIVE (4)', u8(type))
  if (type === 1) {
    w.field('Versión', '4', u8(4))
    w.field('Mi AS', p.info.match(/AS (\d+)/)![1], body.slice(1, 3))
    w.field('Hold time', '90 s', body.slice(3, 5))
    w.field('Identificador BGP', body.slice(5, 9).join('.'), body.slice(5, 9))
    w.field('Parámetros opcionales', '0', [0])
  } else if (type === 2) w.field('Atributos + NLRI', p.info.replace('UPDATE ', ''), body)
}

function cryptoPayload(w: Writer, p: Packet) {
  const seed = p.info + p.t
  if (p.proto === 'TLS') {
    const ct = /Hello|Certificate/.test(p.info) ? 0x16 : /Finished/.test(p.info) ? 0x16 : 0x17
    const n = Math.min(/Server/.test(p.info) ? 120 : 96, MAX_PAYLOAD)
    w.field('Tipo de registro', ct === 0x16 ? 'Handshake (22)' : 'Application Data (23)', u8(ct))
    w.field('Versión', ct === 0x16 && /Client/.test(p.info) ? 'TLS 1.0 (0x0301, compatibilidad)' : 'TLS 1.2 (0x0303, compatibilidad)', /Client/.test(p.info) ? [3, 1] : [3, 3])
    w.field('Longitud', `${n}`, u16(n))
    if (/Client Hello/.test(p.info)) {
      w.field('Tipo de mensaje', 'ClientHello (1)', [1])
      w.field('Aleatorio + suites + extensiones', 'incluye SNI=www.ejemplo.com', noise(seed, n - 1))
    } else w.field(ct === 0x17 ? 'Datos cifrados' : 'Mensajes de saludo', ct === 0x17 ? 'ilegibles sin la clave' : p.info, noise(seed, n))
  } else if (p.proto === 'QUIC' || p.proto === 'HTTP/3') {
    const long = !/1-RTT/.test(p.info)
    w.field('Cabecera', long ? 'larga (Initial/Handshake)' : 'corta (1-RTT)', u8(long ? 0xc3 : 0x43))
    if (long) w.field('Versión', 'QUIC v1 (0x00000001)', u32(1))
    w.field('ID de conexión destino', '8 bytes', noise(seed + 'cid', 8))
    w.field('Carga cifrada', p.info, noise(seed, 64))
  } else if (p.proto === 'WireGuard') {
    const type = /Initiation/.test(p.info) ? 1 : /Response/.test(p.info) ? 2 : 4
    w.field('Tipo', type === 1 ? 'Handshake Initiation (1)' : type === 2 ? 'Handshake Response (2)' : 'Transport Data (4)', [type, 0, 0, 0])
    w.field(type === 4 ? 'Índice del receptor' : 'Índice del emisor', '0x5a1c…', u32(0x5a1c0e9b))
    if (type === 4) w.field('Contador', '0', [0, 0, 0, 0, 0, 0, 0, 0])
    if (!/Keepalive/.test(p.info)) w.field(type === 4 ? 'Paquete IP cifrado' : 'Clave efímera + datos cifrados', 'ChaCha20-Poly1305', noise(seed, type === 2 ? 76 : 96))
  } else if (p.proto === 'SSH') {
    w.field('Paquete SSH cifrado', p.info, noise(seed, 64))
  } else if (p.proto === 'UDP') {
    w.field('Cabecera RTP', 'v2, tipo 96 (vídeo)', [0x80, 0x60, ...u16(hash(p.info) & 0xffff), ...u32(90000), ...u32(0x1234abcd)])
    w.field('Fotograma de vídeo', 'fragmento comprimido', noise(seed, 96))
  }
}

function ntpPayload(w: Writer, p: Packet, fromClient: boolean) {
  w.field('LI / Versión / Modo', fromClient ? 'v4, modo 3 (cliente)' : 'v4, modo 4 (servidor)', u8(fromClient ? 0x23 : 0x24))
  w.field('Estrato', fromClient ? '0' : '2', u8(fromClient ? 0 : 2))
  w.field('Intervalo / precisión', 'poll 6, prec −20', [6, 0xec])
  w.field('Retardo / dispersión raíz', '—', Array(8).fill(0))
  w.field('ID de referencia', fromClient ? '0' : '192.0.2.1', fromClient ? [0, 0, 0, 0] : ipBytes('192.0.2.1'))
  const ts = (n: number) => [...u32(0xeb1c5a00 + n), ...noise(p.info + n, 4)]
  w.field('Marca de referencia', fromClient ? '0' : 'última sincronización', fromClient ? Array(8).fill(0) : ts(0))
  w.field('Origen (T1)', fromClient ? '0' : 'copia de T1', fromClient ? Array(8).fill(0) : ts(1))
  w.field('Recepción (T2)', fromClient ? '0' : 'llegada al servidor', fromClient ? Array(8).fill(0) : ts(2))
  w.field('Transmisión', fromClient ? 'T1: salida del cliente' : 'T3: salida del servidor', ts(3))
}

// ── frame builder ─────────────────────────────────────────────────────────
export function decodePacket(p: Packet): Frame {
  const w = new Writer()
  const tr = TRANSPORT[p.proto] ?? TRANSPORT.HTTP
  const fromServer = rank(p.from) > rank(p.to)
  const fromClient = !fromServer
  // next layer-3 hop: switches are transparent and the cloud is not a device
  const hop = route(p.from, p.to).slice(1).find((n) => n !== 'switch' && n !== 'internet') ?? p.to
  const isDhcpBroadcast = p.proto === 'DHCP' && fromClient
  const isArpBroadcast = p.proto === 'ARP' && p.kind !== 'res'

  // Ethernet (as seen on the first hop leaving the sender)
  w.begin('eth', 'Ethernet II')
  const srcNode = p.from === 'switch' ? 'client' : p.from
  w.field('MAC destino', isDhcpBroadcast || isArpBroadcast ? 'ff:ff:ff:ff:ff:ff (difusión)' : `${fmtMac(macOf(hop))} (${NODES[hop].label})`, isDhcpBroadcast || isArpBroadcast ? BROADCAST : macOf(hop))
  w.field('MAC origen', `${fmtMac(macOf(srcNode))} (${NODES[srcNode].label})`, macOf(srcNode))
  w.field('EtherType', tr.kind === 'arp' ? 'ARP (0x0806)' : 'IPv4 (0x0800)', tr.kind === 'arp' ? [0x08, 0x06] : [0x08, 0x00])
  w.end()

  if (tr.kind === 'arp') {
    const reply = p.kind === 'res'
    w.begin('arp', 'ARP')
    w.field('Hardware / protocolo', 'Ethernet (1) / IPv4 (0x0800)', [0, 1, 8, 0])
    w.field('Longitudes', 'MAC 6, IP 4', [6, 4])
    w.field('Operación', reply ? 'respuesta (2)' : 'petición (1)', u16(reply ? 2 : 1))
    const sender: NodeId = reply ? 'printer' : 'client'
    const target: NodeId = reply ? 'client' : 'printer'
    w.field('MAC del emisor', fmtMac(macOf(sender)), macOf(sender))
    w.field('IP del emisor', ipOf(sender), ipBytes(ipOf(sender)))
    w.field('MAC buscada', reply ? fmtMac(macOf(target)) : '00:00:00:00:00:00 (desconocida)', reply ? macOf(target) : Array(6).fill(0))
    w.field('IP buscada', ipOf(target), ipBytes(ipOf(target)))
    w.end()
    return { bytes: Uint8Array.from(w.bytes), layers: w.layers, truncated: 0 }
  }

  // IPv4 — total length and checksum patched once the rest is known
  const srcIp = isDhcpBroadcast ? '0.0.0.0' : ipOf(p.from)
  const dstIp = isDhcpBroadcast ? '255.255.255.255' : ipOf(p.to)
  const ipStart = w.pos()
  const protoNum = tr.kind === 'tcp' ? 6 : tr.kind === 'udp' ? 17 : 1
  w.begin('ip', 'IPv4')
  w.field('Versión / IHL', '4 / 20 bytes', [0x45])
  w.field('DSCP / ECN', '0', [0])
  const lenAt = w.pos()
  w.field('Longitud total', '', [0, 0])
  const ipId = hash(p.info + p.t) & 0xffff
  w.field('Identificación', hex2(ipId), u16(ipId))
  w.field('Flags / fragmento', "DF (no fragmentar)", [0x40, 0])
  w.field('TTL', '64', [64])
  w.field('Protocolo', tr.kind === 'tcp' ? 'TCP (6)' : tr.kind === 'udp' ? 'UDP (17)' : 'ICMP (1)', [protoNum])
  const ipCkAt = w.pos()
  w.field('Checksum', '', [0, 0])
  w.field('IP origen', srcIp, ipBytes(srcIp))
  w.field('IP destino', dstIp, ipBytes(dstIp))
  w.end()
  const ipLayer = w.layers[w.layers.length - 1]

  // Transport
  const l4Start = w.pos()
  const ports = p.info.match(/(\d+) → (\d+)/)
  const clientPort = 'clientPort' in tr && tr.clientPort ? tr.clientPort : 52344
  const serverPort = tr.kind === 'tcp' || tr.kind === 'udp' ? tr.port : 0
  const sport = ports ? Number(ports[1]) : fromClient ? clientPort : serverPort
  const dport = ports ? Number(ports[2]) : fromClient ? serverPort : clientPort
  let l4CkAt = -1
  let udpLenAt = -1

  if (tr.kind === 'tcp') {
    const flagsTxt = p.info.match(/\[([A-Z, ]+)\]/)?.[1] ?? 'PSH, ACK'
    const bits: Record<string, number> = { FIN: 1, SYN: 2, RST: 4, PSH: 8, ACK: 16 }
    const flags = flagsTxt.split(',').reduce((a, f) => a | (bits[f.trim()] ?? 0), 0)
    const seq = Number(p.info.match(/Seq=(\d+)/)?.[1] ?? 1)
    const ack = Number(p.info.match(/Ack=(\d+)/)?.[1] ?? (flags & 16 ? 1 : 0))
    w.begin('tcp', 'TCP')
    w.field('Puerto origen', `${sport}`, u16(sport))
    w.field('Puerto destino', `${dport}`, u16(dport))
    w.field('Número de secuencia', `${seq} (relativo)`, u32(seq))
    w.field('Número de ACK', `${ack} (relativo)`, u32(ack))
    w.field('Longitud de cabecera', '20 bytes', [0x50])
    w.field('Flags', `[${flagsTxt}]`, [flags])
    w.field('Ventana', '64240', u16(64240))
    l4CkAt = w.pos()
    w.field('Checksum', '', [0, 0])
    w.field('Puntero urgente', '0', [0, 0])
    w.end()
  } else if (tr.kind === 'udp') {
    w.begin('udp', 'UDP')
    w.field('Puerto origen', `${sport}`, u16(sport))
    w.field('Puerto destino', `${dport}`, u16(dport))
    udpLenAt = w.pos()
    w.field('Longitud', '', [0, 0])
    l4CkAt = w.pos()
    w.field('Checksum', '', [0, 0])
    w.end()
  } else {
    const reply = p.kind === 'res'
    const seq = Number(p.info.match(/seq=(\d+)/)?.[1] ?? 1)
    w.begin('icmp', 'ICMP')
    w.field('Tipo', reply ? 'Echo Reply (0)' : 'Echo Request (8)', [reply ? 0 : 8])
    w.field('Código', '0', [0])
    l4CkAt = w.pos()
    w.field('Checksum', '', [0, 0])
    w.field('Identificador', '1', u16(1))
    w.field('Secuencia', `${seq}`, u16(seq))
    w.field('Datos', '56 bytes de relleno', Array.from({ length: 56 }, (_, i) => (i + 0x10) & 0xff))
    w.end()
  }
  const l4Layer = w.layers[w.layers.length - 1]

  // Application payload (TCP handshake/ACK-only segments carry none)
  const pureTcp = p.proto === 'TCP' && !/Len=/.test(p.info)
  if (tr.kind !== 'icmp' && !pureTcp) {
    w.begin('app', p.proto === 'Ethernet' ? 'Datos de impresión' : p.proto === 'TCP' ? 'Datos' : p.proto)
    if (p.proto === 'DNS') dnsPayload(w, p, fromServer)
    else if (p.proto === 'DHCP') dhcpPayload(w, p, fromClient)
    else if (p.proto === 'NTP') ntpPayload(w, p, fromClient)
    else if (p.proto === 'BGP') bgpPayload(w, p)
    else if (p.proto === 'WebSocket' && !/GET|101/.test(p.info)) wsFrame(w, p, fromClient)
    else if (['TLS', 'QUIC', 'HTTP/3', 'WireGuard', 'UDP'].includes(p.proto) || (p.proto === 'SSH' && !/Versión/.test(p.info))) cryptoPayload(w, p)
    else if (p.proto === 'TCP') w.field('Datos', `${p.info.match(/Len=(\d+)/)?.[1]} bytes de la aplicación`, noise(p.info, Number(p.info.match(/Len=(\d+)/)?.[1] ?? 0)))
    else textPayload(w, p, fromClient)
    w.end()
  }

  // Lengths and checksums, computed for real
  const total = w.pos() - ipStart
  w.patch(lenAt, u16(total))
  ipLayer.fields[2].value = `${total} bytes`
  const ipCk = checksum(w.bytes.slice(ipStart, ipStart + 20))
  w.patch(ipCkAt, u16(ipCk))
  ipLayer.fields[7].value = hex2(ipCk) + ' ✓'

  const l4Len = w.pos() - l4Start
  if (udpLenAt >= 0) {
    w.patch(udpLenAt, u16(l4Len))
    l4Layer.fields[2].value = `${l4Len} bytes`
  }
  const segment = w.bytes.slice(l4Start)
  const pseudo = tr.kind === 'icmp' ? [] : [...ipBytes(srcIp), ...ipBytes(dstIp), 0, protoNum, ...u16(l4Len)]
  const ck = checksum([...pseudo, ...segment])
  w.patch(l4CkAt, u16(ck))
  const ckField = l4Layer.fields.find((f) => f.name === 'Checksum')!
  ckField.value = hex2(ck) + ' ✓'

  // Keep the dump readable: show at most MAX_PAYLOAD bytes past the headers
  const headerEnd = w.layers.find((l) => l.id === 'app')?.start ?? w.pos()
  const limit = headerEnd + MAX_PAYLOAD
  const truncated = Math.max(0, w.pos() - limit)
  const bytes = Uint8Array.from(w.bytes.slice(0, limit))
  for (const l of w.layers) {
    l.fields = l.fields.filter((f) => f.start < limit).map((f) => ({ ...f, len: Math.min(f.len, limit - f.start) }))
    l.len = Math.min(l.len, limit - l.start)
  }
  return { bytes, layers: w.layers, truncated }
}
