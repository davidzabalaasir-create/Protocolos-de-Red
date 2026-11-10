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
type Transport =
  | { kind: 'tcp' | 'udp'; port: number; clientPort?: number }
  | { kind: 'icmp' }
  | { kind: 'icmp6' }
  | { kind: 'arp' }
  | { kind: 'ip'; num: number; label: string }
  | { kind: 'l2' }

const TRANSPORT: Record<string, Transport> = {
  DNS: { kind: 'udp', port: 53, clientPort: 51515 },
  HTTP: { kind: 'tcp', port: 80 },
  TLS: { kind: 'tcp', port: 443 },
  DHCP: { kind: 'udp', port: 67, clientPort: 68 },
  UDP: { kind: 'udp', port: 5004, clientPort: 49170 },
  ICMP: { kind: 'icmp' },
  ICMPv6: { kind: 'icmp6' },
  ARP: { kind: 'arp' },
  Ethernet: { kind: 'tcp', port: 9100, clientPort: 52350 },
  '802.1Q': { kind: 'tcp', port: 445, clientPort: 52351 },
  SSH: { kind: 'tcp', port: 22 },
  SMTP: { kind: 'tcp', port: 587 },
  WebSocket: { kind: 'tcp', port: 80 },
  QUIC: { kind: 'udp', port: 443, clientPort: 61001 },
  'HTTP/3': { kind: 'udp', port: 443, clientPort: 61001 },
  NTP: { kind: 'udp', port: 123, clientPort: 123 },
  IMAP: { kind: 'tcp', port: 143 },
  BGP: { kind: 'tcp', port: 179, clientPort: 40112 },
  WireGuard: { kind: 'udp', port: 51820, clientPort: 51820 },
  STUN: { kind: 'udp', port: 3478, clientPort: 54400 },
  DTLS: { kind: 'udp', port: 54401, clientPort: 54400 },
  SRTP: { kind: 'udp', port: 54401, clientPort: 54400 },
  RTP: { kind: 'udp', port: 5004, clientPort: 40000 },
  SIP: { kind: 'udp', port: 5060, clientPort: 5060 },
  RTSP: { kind: 'tcp', port: 554 },
  RTMP: { kind: 'tcp', port: 1935 },
  DoH: { kind: 'tcp', port: 443 },
  POP3: { kind: 'tcp', port: 110 },
  FTP: { kind: 'tcp', port: 21 },
  'FTP-DATA': { kind: 'tcp', port: 50000, clientPort: 52346 },
  SMB: { kind: 'tcp', port: 445 },
  SOCKS5: { kind: 'tcp', port: 1080 },
  Modbus: { kind: 'tcp', port: 502 },
  MQTT: { kind: 'tcp', port: 1883, clientPort: 50883 },
  SNMP: { kind: 'udp', port: 161, clientPort: 50161 },
  'SNMP-Trap': { kind: 'udp', port: 50162, clientPort: 162 },
  LDAP: { kind: 'tcp', port: 389 },
  RADIUS: { kind: 'udp', port: 1812, clientPort: 50200 },
  IKE: { kind: 'udp', port: 500, clientPort: 500 },
  IPv4: { kind: 'udp', port: 9000, clientPort: 52500 },
  Multicast: { kind: 'udp', port: 5000, clientPort: 5000 },
  ESP: { kind: 'ip', num: 50, label: 'ESP (50)' },
  OSPF: { kind: 'ip', num: 89, label: 'OSPF (89)' },
  IGMP: { kind: 'ip', num: 2, label: 'IGMP (2)' },
  PPPoE: { kind: 'l2' },
  EAPOL: { kind: 'l2' },
  STP: { kind: 'l2' },
  '802.11': { kind: 'l2' },
}

/** Which end of a conversation is the "server" side (gets the well-known port). */
const RANK: Partial<Record<NodeId, number>> = { client: 0, isp: 0, phone: 0, iot: 0, switch: 1, switch2: 1, router: 1, ap: 1, dns: 2 }
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
    if (data.length) w.field('Datos (enmascarados)', `"${msg}" XOR clave`, data.map((b, i) => b ^ key[i % 4]))
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

// ── payloads added with the second expansion ──────────────────────────────
const LLC_SNAP_EAPOL = [0xaa, 0xaa, 0x03, 0, 0, 0, 0x88, 0x8e]

function berLen(n: number) {
  return n < 128 ? [n] : [0x81, n]
}

/** Application payloads for the newer lessons. Returns false when not handled here. */
function morePayload(w: Writer, p: Packet): boolean {
  const seed = p.info + p.t
  switch (p.proto) {
    case 'STUN': {
      const resp = /Success/.test(p.info)
      w.field('Tipo de mensaje', resp ? 'Binding Success (0x0101)' : 'Binding Request (0x0001)', u16(resp ? 0x0101 : 0x0001))
      const attrs: number[] = resp
        ? [...u16(0x0020), ...u16(8), 0, 1, ...u16(54400 ^ 0x2112), ...ipBytes('198.51.100.37').map((b, i) => b ^ [0x21, 0x12, 0xa4, 0x42][i])]
        : /ICE/.test(p.info)
          ? [...u16(0x0024), ...u16(4), ...u32(0x6e7f1eff)]
          : []
      w.field('Longitud', `${attrs.length}`, u16(attrs.length))
      w.field('Cookie mágica', '0x2112a442', u32(0x2112a442))
      w.field('ID de transacción', '96 bits aleatorios', noise(p.from + p.to, 12))
      if (resp && attrs.length) w.field('XOR-MAPPED-ADDRESS', '198.51.100.37:54400 (tu IP pública)', attrs)
      else if (attrs.length) w.field('PRIORITY', 'prioridad del candidato ICE', attrs)
      return true
    }
    case 'DTLS': {
      const n = /Server/.test(p.info) ? 140 : 100
      w.field('Tipo de registro', 'Handshake (22)', [22])
      w.field('Versión', 'DTLS 1.2 (0xfefd)', [0xfe, 0xfd])
      w.field('Época / secuencia', '0 / ' + (/Server/.test(p.info) ? 0 : 1), [0, 0, 0, 0, 0, 0, 0, /Server/.test(p.info) ? 0 : 1])
      w.field('Longitud', `${n}`, u16(n))
      w.field('Mensajes de saludo', p.info.replace('DTLS ', ''), noise(seed, n))
      return true
    }
    case 'RTP':
    case 'SRTP': {
      const audio = /audio/.test(p.info)
      const pt = audio ? 111 : 96
      w.field('Versión / marcadores', 'RTP v2', [0x80])
      w.field('Tipo de carga', audio ? 'Opus (111)' : p.info.includes('H.264') ? 'H.264 (96)' : 'vídeo (96)', [pt])
      w.field('Secuencia', p.info.match(/seq=(\d+)/)?.[1] ?? '1', u16(Number(p.info.match(/seq=(\d+)/)?.[1] ?? 1)))
      w.field('Marca de tiempo', '90 kHz / 48 kHz', u32(hash(seed) >>> 8))
      w.field('SSRC (fuente)', hex2(hash(p.from) >>> 0, 8), u32(hash(p.from)))
      w.field(p.proto === 'SRTP' ? 'Medio cifrado' : 'Medio', audio ? '20 ms de audio' : 'fragmento de fotograma', noise(seed, audio ? 80 : 120))
      if (p.proto === 'SRTP') w.field('Etiqueta de autenticación', 'HMAC-SHA1 80 bits', noise(seed + 'tag', 10))
      return true
    }
    case 'RTMP': {
      if (/Handshake C0/.test(p.info)) {
        w.field('C0: versión', 'RTMP 3', [3])
        w.field('C1: tiempo + ceros', '8 bytes', [0, 0, 0, 0, 0, 0, 0, 0])
        w.field('C1: aleatorio', '1528 bytes', noise(seed, 1528))
      } else if (/S0/.test(p.info)) {
        w.field('S0: versión', 'RTMP 3', [3])
        w.field('S1 + S2', '3072 bytes (S2 = eco de C1)', noise(seed, 3072))
      } else if (/C2/.test(p.info)) {
        w.field('C2', 'eco de S1 (1536 bytes)', noise(seed, 1536))
      } else {
        const video = /VideoData/.test(p.info)
        const name = p.info.match(/^(\w+)/)?.[1] ?? 'cmd'
        const body = video ? [0x17, 0x00, ...noise(seed, 200)] : [0x02, ...u16(name.length), ...ascii(name), 0x00, ...noise(seed, 24)]
        w.field('Cabecera de chunk', video ? 'csid 6, tipo 0' : 'csid 3, tipo 0', [video ? 0x06 : 0x03])
        w.field('Marca de tiempo', '0', [0, 0, 0])
        w.field('Longitud del mensaje', `${body.length}`, [0, ...u16(body.length)])
        w.field('Tipo de mensaje', video ? 'Vídeo (9)' : 'Comando AMF0 (20)', [video ? 9 : 20])
        w.field('ID de flujo', video ? '1' : '0', [video ? 1 : 0, 0, 0, 0])
        w.field(video ? 'Fotograma H.264' : 'Comando AMF0', video ? 'fotograma clave (0x17)' : `"${name}"`, body)
      }
      return true
    }
    case 'DoH': {
      w.field('Tipo de registro', 'Application Data (23)', [0x17])
      w.field('Versión', 'TLS 1.2 (0x0303, compatibilidad)', [3, 3])
      w.field('Longitud', '96', u16(96))
      w.field('Datos cifrados', `${p.info} (cifrado)`, noise(seed, 96))
      return true
    }
    case 'FTP-DATA': {
      w.field('Contenido del archivo', '"%PDF-1.7" …', [...ascii('%PDF-1.7\n'), ...noise(seed, 1391)])
      return true
    }
    case 'SMB': {
      const cmd = /Negotiate/.test(p.info) ? 0 : /Session/.test(p.info) ? 1 : /Tree/.test(p.info) ? 3 : 8
      const names = ['NEGOTIATE', 'SESSION_SETUP', '', 'TREE_CONNECT', '', '', '', '', 'READ']
      const resp = /Response/.test(p.info)
      const body = noise(seed, 48)
      w.field('NetBIOS: longitud', `${64 + body.length}`, [0, 0, ...u16(64 + body.length)])
      w.field('ID de protocolo', '\\xfeSMB (SMB2/3)', [0xfe, 0x53, 0x4d, 0x42])
      w.field('Longitud de cabecera', '64', [64, 0])
      w.field('Créditos / estado', resp ? 'STATUS_SUCCESS' : '—', [1, 0, 0, 0, 0, 0])
      w.field('Comando', `${names[cmd]} (${cmd})`, [cmd, 0])
      w.field('Créditos pedidos', '1', [1, 0])
      w.field('Flags', resp ? 'respuesta' : 'petición', [resp ? 1 : 0, 0, 0, 0])
      w.field('Siguiente / ID de mensaje', `${cmd}`, [0, 0, 0, 0, cmd, 0, 0, 0, 0, 0, 0, 0])
      w.field('Tree ID / Session ID', cmd >= 3 ? 'asignados' : '0', [0, 0, 0, 0, ...(cmd >= 3 ? [1, 0, 0, 0] : [0, 0, 0, 0]), ...(cmd >= 1 ? noise('sid', 8) : Array(8).fill(0))])
      w.field('Firma', cmd >= 3 ? 'AES-CMAC' : 'sin firmar', cmd >= 3 ? noise(seed + 'sig', 16) : Array(16).fill(0))
      w.field('Cuerpo del mensaje', p.info, body)
      return true
    }
    case 'SOCKS5': {
      if (/^Saludo/.test(p.info)) {
        w.field('Versión', '5', [5])
        w.field('Nº de métodos', '1', [1])
        w.field('Métodos', 'sin autenticación (0x00)', [0])
      } else if (/Método/.test(p.info)) {
        w.field('Versión', '5', [5])
        w.field('Método elegido', 'sin autenticación (0x00)', [0])
      } else if (/CONNECT/.test(p.info)) {
        const host = 'www.ejemplo.com'
        w.field('Versión / orden', '5 / CONNECT (1)', [5, 1, 0])
        w.field('Tipo de dirección', 'nombre de dominio (3)', [3])
        w.field('Destino', host, [host.length, ...ascii(host)])
        w.field('Puerto', '443', u16(443))
      } else {
        w.field('Versión / respuesta', '5 / éxito (0)', [5, 0, 0])
        w.field('Dirección enlazada', '192.0.2.80:41000', [1, ...ipBytes('192.0.2.80'), ...u16(41000)])
      }
      return true
    }
    case 'Modbus': {
      const fn = /\(06\)/.test(p.info) ? 6 : 3
      const resp = /^Respuesta/.test(p.info)
      let pdu: number[]
      let desc: string
      if (fn === 3 && !resp) [pdu, desc] = [[...u16(0), ...u16(2)], 'dirección 0, cantidad 2']
      else if (fn === 3) [pdu, desc] = [[4, ...u16(215), ...u16(1013)], '4 bytes: 215, 1013']
      else [pdu, desc] = [[...u16(10), ...u16(1)], 'registro 10 = 1']
      w.field('ID de transacción', `${fn === 3 ? 1 : 2}`, u16(fn === 3 ? 1 : 2))
      w.field('ID de protocolo', '0 (Modbus)', u16(0))
      w.field('Longitud', `${pdu.length + 2}`, u16(pdu.length + 2))
      w.field('Unidad', '1', [1])
      w.field('Función', fn === 3 ? 'Leer registros (0x03)' : 'Escribir registro (0x06)', [fn])
      w.field('Datos', desc, pdu)
      return true
    }
    case 'MQTT': {
      const type = p.info.split(' ')[0]
      const codes: Record<string, number> = { CONNECT: 0x10, CONNACK: 0x20, PUBLISH: 0x32, PUBACK: 0x40, PINGREQ: 0xc0, PINGRESP: 0xd0 }
      let rest: number[] = []
      let desc = ''
      if (type === 'CONNECT') {
        const id = 'sensor-salon'
        rest = [...u16(4), ...ascii('MQTT'), 5, 0x02, ...u16(60), 0, ...u16(id.length), ...ascii(id)]
        desc = 'MQTT v5, keepalive 60 s, id=sensor-salon'
      } else if (type === 'CONNACK') [rest, desc] = [[0, 0, 0], 'aceptado (0)']
      else if (type === 'PUBLISH') {
        const topic = 'casa/salon/temp'
        rest = [...u16(topic.length), ...ascii(topic), ...u16(1), 0, ...ascii('21.5')]
        desc = `${topic} = "21.5", id 1`
      } else if (type === 'PUBACK') [rest, desc] = [[...u16(1), 0], 'id 1, éxito']
      w.field('Tipo / flags', `${type}${type === 'PUBLISH' ? ' (QoS 1)' : ''}`, [codes[type] ?? 0])
      w.field('Longitud restante', `${rest.length}`, [rest.length])
      if (rest.length) w.field('Cabecera variable + carga', desc, rest)
      return true
    }
    case 'SNMP':
    case 'SNMP-Trap': {
      const tag = /trap/.test(p.info) ? 0xa7 : /response/.test(p.info) ? 0xa2 : 0xa0
      const oid = /sysUpTime/.test(p.info) ? [0x2b, 6, 1, 2, 1, 1, 3, 0] : [0x2b, 6, 1, 2, 1, 2, 2, 1, 10, 2]
      const pdu = [0x02, 4, ...u32(hash(seed) & 0x7fffffff), 0x02, 1, 0, 0x02, 1, 0, 0x30, oid.length + 6, 0x30, oid.length + 4, 0x06, oid.length, ...oid, 0x05, 0]
      const body = [0x02, 1, 1, 0x04, 6, ...ascii('public'), tag, ...berLen(pdu.length), ...pdu]
      w.field('SEQUENCE (BER)', `${body.length} bytes`, [0x30, ...berLen(body.length)])
      w.field('Versión', 'v2c (1)', [0x02, 1, 1])
      w.field('Comunidad', '"public"', [0x04, 6, ...ascii('public')])
      w.field('PDU', tag === 0xa0 ? 'GetRequest' : tag === 0xa2 ? 'GetResponse' : 'SNMPv2-Trap', [tag, ...berLen(pdu.length)])
      w.field('ID, error, variables', p.info.replace(/^\S+ /, ''), pdu)
      return true
    }
    case 'LDAP': {
      const ops: [RegExp, number, string][] = [
        [/bindRequest/, 0x60, 'BindRequest'],
        [/bindResponse/, 0x61, 'BindResponse'],
        [/searchRequest/, 0x63, 'SearchRequest'],
        [/searchResEntry/, 0x64, 'SearchResultEntry'],
        [/searchResDone/, 0x65, 'SearchResultDone'],
        [/unbind/, 0x42, 'UnbindRequest'],
      ]
      const [, tag, name] = ops.find(([re]) => re.test(p.info)) ?? ops[0]
      const content = tag === 0x42 ? [] : [...ascii(p.info.replace(/^\S+ ?/, '')).slice(0, 60)]
      const msgId = /bind/.test(p.info) ? 1 : /unbind/.test(p.info) ? 3 : 2
      const op = [tag, ...berLen(content.length), ...content]
      w.field('LDAPMessage (BER)', `${op.length + 3} bytes`, [0x30, ...berLen(op.length + 3)])
      w.field('ID de mensaje', `${msgId}`, [0x02, 1, msgId])
      w.field('Operación', name, op.slice(0, 1 + berLen(content.length).length))
      if (content.length) w.field('Contenido', p.info.replace(/^\S+ ?/, ''), content)
      return true
    }
    case 'RADIUS': {
      const code = /Accept/.test(p.info) ? 2 : /Challenge/.test(p.info) ? 11 : 1
      const attrs = [79, 20, ...noise(seed, 18), ...(code === 1 ? [1, 19, ...ascii('david@ejemplo.com')] : []), 80, 18, ...noise(seed + 'ma', 16)]
      w.field('Código', code === 1 ? 'Access-Request (1)' : code === 11 ? 'Access-Challenge (11)' : 'Access-Accept (2)', [code])
      w.field('Identificador', '42', [42])
      w.field('Longitud', `${20 + attrs.length}`, u16(20 + attrs.length))
      w.field('Autenticador', '16 bytes', noise(seed + 'auth', 16))
      w.field('Atributos', 'EAP-Message, User-Name, Message-Authenticator', attrs)
      return true
    }
    case 'IKE': {
      const init = /SA_INIT/.test(p.info)
      const resp = /response/.test(p.info)
      w.field('SPI del iniciador', '8 bytes', noise('ike-i', 8))
      w.field('SPI del respondedor', init && !resp ? '0 (aún no existe)' : '8 bytes', init && !resp ? Array(8).fill(0) : noise('ike-r', 8))
      w.field('Siguiente carga', init ? 'SA (33)' : 'Encrypted (46)', [init ? 33 : 46])
      w.field('Versión', 'IKEv2 (0x20)', [0x20])
      w.field('Intercambio', init ? 'IKE_SA_INIT (34)' : 'IKE_AUTH (35)', [init ? 34 : 35])
      w.field('Flags', resp ? 'respuesta' : 'iniciador', [resp ? 0x20 : 0x08])
      w.field('ID de mensaje', init ? '0' : '1', u32(init ? 0 : 1))
      const body = noise(seed, init ? 120 : 140)
      w.field('Longitud', `${28 + body.length}`, u32(28 + body.length))
      w.field(init ? 'SA, KE, Nonce' : 'Cargas cifradas (IDi, AUTH, SA, TS)', init ? 'propuestas + clave DH' : 'ilegibles sin la clave', body)
      return true
    }
    default:
      return false
  }
}

/** Payloads that ride directly on IP (no TCP/UDP): IGMP, OSPF, ESP. */
function ipPayload(w: Writer, p: Packet) {
  const seed = p.info + p.t
  if (p.proto === 'IGMP') {
    const type = /Query/.test(p.info) ? 0x11 : /Leave/.test(p.info) ? 0x17 : 0x16
    const group = type === 0x11 ? '0.0.0.0' : '239.1.1.1'
    const msg = [type, type === 0x11 ? 100 : 0, 0, 0, ...ipBytes(group)]
    const ck = checksum(msg)
    w.field('Tipo', type === 0x11 ? 'Membership Query (0x11)' : type === 0x17 ? 'Leave Group (0x17)' : 'Membership Report v2 (0x16)', [type])
    w.field('Tiempo máx. de respuesta', type === 0x11 ? '10 s' : '0', [msg[1]])
    w.field('Checksum', hex2(ck) + ' ✓', u16(ck))
    w.field('Grupo', group === '0.0.0.0' ? '0.0.0.0 (todos)' : group, ipBytes(group))
  } else if (p.proto === 'OSPF') {
    const type = /Hello/.test(p.info) ? 1 : /Database/.test(p.info) ? 2 : /Request/.test(p.info) ? 3 : /Update/.test(p.info) ? 4 : 5
    const names = ['', 'Hello', 'Database Description', 'Link State Request', 'Link State Update', 'Link State Ack']
    const rid = p.from === 'router' ? '192.168.1.1' : '10.0.0.2'
    const body =
      type === 1
        ? [...ipBytes('255.255.255.0'), ...u16(10), 0x02, 1, ...u32(40), ...ipBytes('10.0.0.2'), ...ipBytes('0.0.0.0'), ...(p.from === 'core' ? ipBytes('192.168.1.1') : [])]
        : noise(seed, type === 4 ? 140 : 40)
    const len = 24 + body.length
    w.field('Versión / tipo', `OSPFv2 / ${names[type]} (${type})`, [2, type])
    w.field('Longitud', `${len}`, u16(len))
    w.field('ID de router', rid, ipBytes(rid))
    w.field('Área', '0.0.0.0 (troncal)', [0, 0, 0, 0])
    w.field('Checksum / autenticación', 'sin autenticación', [...noise(seed + 'ck', 2), 0, 0, ...Array(8).fill(0)])
    w.field(type === 1 ? 'Hello: máscara, intervalos, DR, vecinos' : 'LSA', type === 1 ? 'máscara /24, hello 10 s, dead 40 s' : names[type], body)
  } else if (p.proto === 'ESP') {
    const spi = Number('0x' + (p.info.match(/SPI=0x([0-9a-f]+)/)?.[1] ?? '1'))
    w.field('SPI', hex2(spi, 8), u32(spi))
    w.field('Número de secuencia', p.info.match(/seq=(\d+)/)?.[1] ?? '1', u32(Number(p.info.match(/seq=(\d+)/)?.[1] ?? 1)))
    w.field('IV + paquete IP cifrado', 'AES-GCM: el paquete original es ilegible', noise(seed, 112))
    w.field('ICV (integridad)', '16 bytes', noise(seed + 'icv', 16))
  }
}

/** Builds a pure layer-2 frame (802.11, EAPOL, PPPoE, STP). */
function l2Frame(w: Writer, p: Packet) {
  const seed = p.info + p.t
  const wifi = p.proto === '802.11' || (p.proto === 'EAPOL' && (p.from === 'ap' || p.to === 'ap'))
  const apMac = macOf('ap')

  if (wifi) {
    const mgmt = p.proto === '802.11'
    const sub: [RegExp, number, string][] = [
      [/Beacon/, 0x80, 'Beacon'],
      [/Probe Request/, 0x40, 'Probe Request'],
      [/Probe Response/, 0x50, 'Probe Response'],
      [/Authentication/, 0xb0, 'Authentication'],
      [/Association Request/, 0x00, 'Association Request'],
      [/Association Response/, 0x10, 'Association Response'],
    ]
    const [, fc0, fcName] = mgmt ? (sub.find(([re]) => re.test(p.info)) ?? sub[0]) : [/./, 0x08, 'Datos']
    const toAp = p.to === 'ap'
    const recv = /Beacon/.test(p.info) ? BROADCAST : macOf(p.to)
    w.begin('eth', 'IEEE 802.11')
    w.field('Control de trama', `${mgmt ? 'Gestión' : 'Datos'}: ${fcName}`, [fc0, mgmt ? 0 : toAp ? 0x01 : 0x02])
    w.field('Duración', '314 µs', u16(314))
    w.field('Dirección 1 (receptor)', /Beacon/.test(p.info) ? 'ff:ff:ff:ff:ff:ff (difusión)' : `${fmtMac(recv)} (${NODES[p.to].label})`, recv)
    w.field('Dirección 2 (emisor)', `${fmtMac(macOf(p.from))} (${NODES[p.from].label})`, macOf(p.from))
    w.field('Dirección 3 (BSSID)', `${fmtMac(apMac)} (punto de acceso)`, apMac)
    w.field('Secuencia', `${hash(seed) & 0xfff}`, u16((hash(seed) & 0xfff) << 4))
    if (!mgmt) w.field('LLC/SNAP', 'EtherType 0x888e (EAPOL)', LLC_SNAP_EAPOL)
    w.end()

    w.begin('app', mgmt ? `802.11 ${fcName}` : 'EAPOL')
    if (mgmt) {
      const ssid = ascii('MiWiFi')
      if (/Beacon|Probe Response/.test(p.info)) {
        w.field('Marca de tiempo', 'µs desde el arranque del AP', noise(seed, 8))
        w.field('Intervalo de baliza', '100 TU (102,4 ms)', [100, 0])
        w.field('Capacidades', 'ESS, privacidad', [0x11, 0x04])
      }
      if (/Association Request/.test(p.info)) {
        w.field('Capacidades', 'ESS, privacidad', [0x11, 0x04])
        w.field('Intervalo de escucha', '10', [10, 0])
      }
      if (/Association Response/.test(p.info)) {
        w.field('Capacidades', 'ESS, privacidad', [0x11, 0x04])
        w.field('Estado', 'éxito (0)', [0, 0])
        w.field('AID', '1', [0x01, 0xc0])
      }
      if (/Authentication/.test(p.info)) {
        const sae = /SAE/.test(p.info)
        const confirm = /Confirm/.test(p.info)
        const seq = sae ? (confirm ? 2 : 1) : p.to === 'ap' ? 1 : 2
        w.field('Algoritmo', sae ? 'SAE (3)' : 'sistema abierto (0)', [sae ? 3 : 0, 0])
        w.field('Secuencia', `${seq}`, [seq, 0])
        w.field('Estado', 'éxito (0)', [0, 0])
        if (sae && !confirm) {
          w.field('Grupo', '19 (curva P-256)', [19, 0])
          w.field('Escalar + elemento', 'compromiso derivado de la contraseña', noise(seed, 96))
        } else if (sae) {
          w.field('Contador de envío', '1', [1, 0])
          w.field('Confirmación', 'HMAC de la clave compartida', noise(seed, 32))
        }
      }
      if (/Beacon|Probe|Association Request/.test(p.info)) w.field('SSID', '"MiWiFi"', [0, ssid.length, ...ssid])
      if (/Beacon|Probe Response/.test(p.info)) w.field('Seguridad (RSN)', 'WPA3-SAE, AES-CCMP', [48, 20, 1, 0, ...noise(seed + 'rsn', 18)])
    }
  } else {
    // Wired framing: STP uses 802.3 + LLC, PPPoE/EAPOL use Ethernet II
    const stp = p.proto === 'STP'
    const broadcast = p.proto === 'PPPoE' && /PADI/.test(p.info)
    const dst = stp ? [0x01, 0x80, 0xc2, 0, 0, 0] : broadcast ? BROADCAST : macOf(p.to)
    const session = p.proto === 'PPPoE' && !/PAD/.test(p.info)
    w.begin('eth', stp ? 'IEEE 802.3 + LLC' : 'Ethernet II')
    w.field('MAC destino', stp ? '01:80:c2:00:00:00 (puentes STP)' : broadcast ? 'ff:ff:ff:ff:ff:ff (difusión)' : `${fmtMac(dst)} (${NODES[p.to].label})`, dst)
    w.field('MAC origen', `${fmtMac(macOf(p.from))} (${NODES[p.from].label})`, macOf(p.from))
    if (stp) {
      w.field('Longitud', '39', u16(39))
      w.field('LLC', 'DSAP/SSAP 0x42 (STP), UI', [0x42, 0x42, 0x03])
    } else
      w.field(
        'EtherType',
        p.proto === 'EAPOL' ? 'EAPOL (0x888e)' : session ? 'PPPoE sesión (0x8864)' : 'PPPoE descubrimiento (0x8863)',
        p.proto === 'EAPOL' ? [0x88, 0x8e] : session ? [0x88, 0x64] : [0x88, 0x63],
      )
    w.end()
    w.begin('app', p.proto === 'STP' ? 'BPDU (RSTP)' : p.proto)
  }

  if (p.proto === 'EAPOL') {
    const key = /Key/.test(p.info)
    const start = /Start/.test(p.info)
    if (key) {
      const n = Number(p.info.match(/mensaje (\d)/)?.[1] ?? 1)
      const info = [0x008a, 0x010a, 0x13ca, 0x030a][n - 1]
      const data = n === 3 ? noise(seed + 'gtk', 56) : n === 2 ? noise(seed + 'rsn', 22) : []
      w.field('Versión / tipo', '802.1X-2004 / Key (3)', [2, 3])
      w.field('Longitud', `${95 + data.length}`, u16(95 + data.length))
      w.field('Descriptor', 'RSN (2)', [2])
      w.field('Información de clave', `mensaje ${n} de 4${n >= 2 ? ', MIC' : ''}${n === 3 ? ', instalar' : ''}`, u16(info))
      w.field('Longitud de clave / contador', '16 / ' + (n <= 2 ? 1 : 2), [0, 16, 0, 0, 0, 0, 0, 0, 0, n <= 2 ? 1 : 2])
      w.field('Nonce', n === 1 ? 'ANonce (del AP)' : n === 2 ? 'SNonce (del cliente)' : '—', n <= 2 ? noise(seed + 'nonce', 32) : Array(32).fill(0))
      w.field('IV + RSC + reservado', 'ceros', Array(32).fill(0))
      w.field('MIC', n === 1 ? 'ninguno' : 'integridad con la KCK', n === 1 ? Array(16).fill(0) : noise(seed + 'mic', 16))
      w.field('Datos de clave', n === 3 ? 'GTK cifrada' : `${data.length} bytes`, [...u16(data.length), ...data])
    } else if (start) {
      w.field('Versión / tipo', '802.1X-2004 / Start (1)', [2, 1])
      w.field('Longitud', '0', [0, 0])
    } else {
      const code = /Success/.test(p.info) ? 3 : /Request/.test(p.info) ? 1 : 2
      const id = ascii(p.info.match(/Identity (\S+)/)?.[1] ?? '')
      const eap = code === 3 ? [3, 7, 0, 4] : [code, 7, ...u16(5 + id.length), 1, ...id]
      w.field('Versión / tipo', '802.1X-2004 / EAP (0)', [2, 0])
      w.field('Longitud', `${eap.length}`, u16(eap.length))
      w.field('EAP', code === 1 ? 'Request Identity' : code === 2 ? `Response Identity "${p.info.split(' ').pop()}"` : 'Success', eap)
    }
  } else if (p.proto === 'PPPoE') {
    const codes: [RegExp, number, string][] = [
      [/PADI/, 0x09, 'PADI'],
      [/PADO/, 0x07, 'PADO'],
      [/PADR/, 0x19, 'PADR'],
      [/PADS/, 0x65, 'PADS'],
    ]
    const disc = codes.find(([re]) => re.test(p.info))
    const sid = disc && disc[1] !== 0x65 ? 0 : 0x1a2b
    let payload: number[]
    let desc: string
    if (disc) {
      const ac = /PADO/.test(p.info) ? [1, 2, 0, 7, ...ascii('bras-01')] : []
      payload = [1, 1, 0, 0, ...ac]
      desc = ac.length ? 'Service-Name, AC-Name="bras-01"' : 'Service-Name (cualquiera)'
    } else {
      const proto = /LCP/.test(p.info) ? 0xc021 : /CHAP/.test(p.info) ? 0xc223 : 0x8021
      const pname = proto === 0xc021 ? 'LCP' : proto === 0xc223 ? 'CHAP' : 'IPCP'
      const code = /Success/.test(p.info) ? 3 : /Response/.test(p.info) ? 2 : /Ack/.test(p.info) ? 2 : 1
      const opt = proto === 0xc021 ? [1, 4, ...u16(1492)] : proto === 0x8021 ? [3, 6, ...ipBytes('198.51.100.37')] : proto === 0xc223 && code === 2 ? [16, ...noise(seed, 16), ...ascii('usuario@isp')] : []
      payload = [...u16(proto), code, 1, ...u16(4 + opt.length), ...opt]
      desc = `${pname}: ${p.info.replace(/^\S+ /, '')}`
    }
    w.field('Versión / tipo', '1 / 1', [0x11])
    w.field('Código', disc ? `${disc[2]} (${hex2(disc[1], 2)})` : 'sesión (0x00)', [disc ? disc[1] : 0])
    w.field('ID de sesión', hex2(sid), u16(sid))
    w.field('Longitud', `${payload.length}`, u16(payload.length))
    w.field(disc ? 'Etiquetas' : 'Trama PPP', desc, payload)
  } else if (p.proto === 'STP') {
    const rootMac = /aa/.test(p.info) ? macOf('switch') : macOf('switch2')
    const tc = /TC/.test(p.info)
    const cost = Number(p.info.match(/coste=(\d+)/)?.[1] ?? 0)
    w.field('Protocolo / versión', 'STP (0) / RSTP (2)', [0, 0, 2])
    w.field('Tipo de BPDU', 'RST (0x02)', [2])
    w.field('Flags', tc ? 'Topology Change' : /acuerdo/.test(p.info) ? 'Agreement, Forwarding' : 'Proposal', [tc ? 0x01 : /acuerdo/.test(p.info) ? 0x78 : 0x0e])
    w.field('ID de raíz', `32768 / ${fmtMac(rootMac)}`, [0x80, 0, ...rootMac])
    w.field('Coste hasta la raíz', `${cost}`, u32(cost))
    w.field('ID de puente', `32768 / ${fmtMac(macOf(p.from))}`, [0x80, 0, ...macOf(p.from)])
    w.field('ID de puerto', '0x8001', [0x80, 1])
    w.field('Edades y temporizadores', 'max 20 s, hello 2 s, retardo 15 s', [0, 0, 20, 0, 2, 0, 15, 0])
    w.field('Longitud v1', '0', [0])
  }
  w.end()
}

// ── IPv6 helpers ──────────────────────────────────────────────────────────
function ip6Bytes(addr: string) {
  const [head, tail = ''] = addr.split('::')
  const h = head ? head.split(':') : []
  const t = addr.includes('::') && tail ? tail.split(':') : []
  const groups = addr.includes('::') ? [...h, ...Array(8 - h.length - t.length).fill('0'), ...t] : h
  return groups.flatMap((g) => u16(parseInt(g || '0', 16)))
}

function icmp6Body(p: Packet, srcMac: number[]): { type: number; name: string; body: number[]; desc: string } {
  const seed = p.info + p.t
  if (/Router Solicitation/.test(p.info)) return { type: 133, name: 'Router Solicitation (133)', body: [0, 0, 0, 0, 1, 1, ...srcMac], desc: 'opción: mi MAC' }
  if (/Router Advertisement/.test(p.info))
    return {
      type: 134,
      name: 'Router Advertisement (134)',
      body: [64, 0, ...u16(1800), 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 64, 0xc0, ...u32(2592000), ...u32(604800), 0, 0, 0, 0, ...ip6Bytes('2001:db8:1::')],
      desc: 'hop limit 64, vida 1800 s, prefijo 2001:db8:1::/64 (SLAAC)',
    }
  if (/Neighbor Solicitation/.test(p.info)) return { type: 135, name: 'Neighbor Solicitation (135)', body: [0, 0, 0, 0, ...ip6Bytes('fe80::1'), 1, 1, ...srcMac], desc: 'objetivo fe80::1, opción: mi MAC' }
  if (/Neighbor Advertisement/.test(p.info)) return { type: 136, name: 'Neighbor Advertisement (136)', body: [0xe0, 0, 0, 0, ...ip6Bytes('fe80::1'), 2, 1, ...srcMac], desc: 'router, solicitado; MAC del router' }
  const reply = /Reply/.test(p.info)
  return { type: reply ? 129 : 128, name: reply ? 'Echo Reply (129)' : 'Echo Request (128)', body: [0, 1, 0, 1, ...noise(seed, 56)], desc: 'id 1, seq 1, 56 bytes de datos' }
}

// ── frame builder ─────────────────────────────────────────────────────────
const isSwitch = (n: NodeId) => n === 'switch' || n === 'switch2'

export function decodePacket(p: Packet): Frame {
  const w = new Writer()
  const tr = TRANSPORT[p.proto] ?? TRANSPORT.HTTP

  if (tr.kind === 'l2') {
    l2Frame(w, p)
    return finish(w, w.bytes.length)
  }

  // Frames relayed by switches keep the end hosts' addresses
  const relay = p.proto === 'Ethernet' || p.proto === '802.1Q'
  const l3From: NodeId = relay && isSwitch(p.from) ? 'client' : p.from
  const l3To: NodeId = relay && isSwitch(p.to) ? (p.proto === '802.1Q' ? 'pc2' : 'printer') : p.to
  const fromServer = rank(l3From) > rank(l3To)
  const fromClient = !fromServer
  // next layer-3 hop: switches are transparent and the cloud is not a device
  const hop = route(l3From, l3To).slice(1).find((n) => !isSwitch(n) && n !== 'internet') ?? l3To
  const isDhcpBroadcast = p.proto === 'DHCP' && fromClient
  const isArpBroadcast = p.proto === 'ARP' && p.kind !== 'res'
  const v6 = tr.kind === 'icmp6'

  const srcIp = p.srcIp ?? (isDhcpBroadcast ? '0.0.0.0' : ipOf(l3From))
  const dstIp = p.dstIp ?? (isDhcpBroadcast ? '255.255.255.255' : ipOf(l3To))
  const mcast4 = !v6 && Number(dstIp.split('.')[0]) >= 224 && Number(dstIp.split('.')[0]) <= 239

  // Link layer (as seen on the first hop leaving the sender)
  let dstMac: number[]
  let dstMacTxt: string
  if (isDhcpBroadcast || isArpBroadcast) [dstMac, dstMacTxt] = [BROADCAST, 'ff:ff:ff:ff:ff:ff (difusión)']
  else if (v6 && dstIp.startsWith('ff')) {
    const b = ip6Bytes(dstIp)
    dstMac = [0x33, 0x33, ...b.slice(12)]
    dstMacTxt = `${fmtMac(dstMac)} (multicast IPv6)`
  } else if (mcast4) {
    const b = ipBytes(dstIp)
    dstMac = [0x01, 0x00, 0x5e, b[1] & 0x7f, b[2], b[3]]
    dstMacTxt = `${fmtMac(dstMac)} (multicast ${dstIp})`
  } else [dstMac, dstMacTxt] = [macOf(hop), `${fmtMac(macOf(hop))} (${NODES[hop].label})`]

  const srcNode = p.from === 'switch' && p.proto !== '802.1Q' ? 'client' : p.from
  const srcMacNode: NodeId = relay ? l3From : srcNode
  const tagged = p.proto === '802.1Q' && /etiquetada/.test(p.info)
  w.begin('eth', tagged ? 'Ethernet II + 802.1Q' : 'Ethernet II')
  w.field('MAC destino', dstMacTxt, dstMac)
  w.field('MAC origen', `${fmtMac(macOf(srcMacNode))} (${NODES[srcMacNode].label})`, macOf(srcMacNode))
  if (tagged) w.field('Etiqueta 802.1Q', 'TPID 0x8100, prioridad 0, VLAN 20', [0x81, 0x00, 0x00, 20])
  w.field('EtherType', tr.kind === 'arp' ? 'ARP (0x0806)' : v6 ? 'IPv6 (0x86dd)' : 'IPv4 (0x0800)', tr.kind === 'arp' ? [0x08, 0x06] : v6 ? [0x86, 0xdd] : [0x08, 0x00])
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
    return finish(w, w.bytes.length)
  }

  // ── IPv6 + ICMPv6 ──
  if (v6) {
    const ndp = !/Echo/.test(p.info)
    const msg = icmp6Body(p, macOf(p.from))
    const len = 4 + msg.body.length
    w.begin('ip', 'IPv6')
    w.field('Versión / clase / flujo', '6 / 0 / 0', [0x60, 0, 0, 0])
    w.field('Longitud de carga', `${len} bytes`, u16(len))
    w.field('Siguiente cabecera', 'ICMPv6 (58)', [58])
    w.field('Límite de saltos', ndp ? '255 (NDP exige 255)' : '64', [ndp ? 255 : 64])
    w.field('IP origen', srcIp, ip6Bytes(srcIp))
    w.field('IP destino', dstIp, ip6Bytes(dstIp))
    w.end()
    const pseudo = [...ip6Bytes(srcIp), ...ip6Bytes(dstIp), ...u32(len), 0, 0, 0, 58]
    const ck = checksum([...pseudo, msg.type, 0, 0, 0, ...msg.body])
    w.begin('icmp', 'ICMPv6')
    w.field('Tipo', msg.name, [msg.type])
    w.field('Código', '0', [0])
    w.field('Checksum', hex2(ck) + ' ✓', u16(ck))
    w.field('Mensaje', msg.desc, msg.body)
    w.end()
    return finish(w, w.layers[w.layers.length - 1].start)
  }

  // ── IPv4 — total length and checksum patched once the rest is known ──
  const frag = p.proto === 'IPv4' ? { mf: /MF/.test(p.info), off: Number(p.info.match(/off=(\d+)/)?.[1] ?? 0) } : null
  const fragmented = !!frag && (frag.mf || frag.off > 0)
  const ipStart = w.pos()
  const protoNum = tr.kind === 'tcp' ? 6 : tr.kind === 'udp' ? 17 : tr.kind === 'ip' ? tr.num : 1
  const protoTxt = tr.kind === 'tcp' ? 'TCP (6)' : tr.kind === 'udp' ? 'UDP (17)' : tr.kind === 'ip' ? tr.label : 'ICMP (1)'
  const ttl = tr.kind === 'ip' && p.proto !== 'ESP' ? 1 : 64
  w.begin('ip', 'IPv4')
  w.field('Versión / IHL', '4 / 20 bytes', [0x45])
  w.field('DSCP / ECN', p.proto === 'OSPF' ? 'CS6 (control de red)' : '0', [p.proto === 'OSPF' ? 0xc0 : 0])
  const lenAt = w.pos()
  w.field('Longitud total', '', [0, 0])
  const ipId = frag ? 0x1c46 : hash(p.info + p.t) & 0xffff
  w.field('Identificación', hex2(ipId), u16(ipId))
  if (fragmented) {
    const v = (frag!.mf ? 0x2000 : 0) | (frag!.off / 8)
    w.field('Flags / fragmento', `${frag!.mf ? 'MF (más fragmentos)' : 'último fragmento'}, desplazamiento ${frag!.off}`, u16(v))
  } else w.field('Flags / fragmento', 'DF (no fragmentar)', [0x40, 0])
  w.field('TTL', ttl === 1 ? '1 (solo el enlace local)' : '64', [ttl])
  w.field('Protocolo', protoTxt, [protoNum])
  const ipCkAt = w.pos()
  w.field('Checksum', '', [0, 0])
  w.field('IP origen', srcIp, ipBytes(srcIp))
  w.field('IP destino', dstIp, ipBytes(dstIp))
  w.end()
  const ipLayer = w.layers[w.layers.length - 1]

  // Second and later fragments carry only data: no transport header
  if (frag && frag.off > 0) {
    w.begin('app', 'Fragmento IPv4')
    w.field('Datos (continuación)', 'bytes 1480–1999 del datagrama', noise(p.info, 520))
    w.end()
    patchIp(w, ipStart, lenAt, ipCkAt, ipLayer)
    return finish(w, w.layers[w.layers.length - 1].start)
  }

  if (tr.kind === 'ip') {
    w.begin('app', p.proto)
    ipPayload(w, p)
    w.end()
    patchIp(w, ipStart, lenAt, ipCkAt, ipLayer)
    return finish(w, w.layers[w.layers.length - 1].start)
  }

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
    const appName: Record<string, string> = { Ethernet: 'Datos de impresión', TCP: 'Datos', '802.1Q': 'Datos', IPv4: 'Datos UDP', Multicast: 'Vídeo multicast', 'FTP-DATA': 'FTP (datos)', 'SNMP-Trap': 'SNMP' }
    w.begin('app', appName[p.proto] ?? p.proto)
    if (morePayload(w, p)) {
      /* handled */
    } else if (p.proto === 'DNS') dnsPayload(w, p, fromServer)
    else if (p.proto === 'DHCP') dhcpPayload(w, p, fromClient)
    else if (p.proto === 'NTP') ntpPayload(w, p, fromClient)
    else if (p.proto === 'BGP') bgpPayload(w, p)
    else if (p.proto === 'WebSocket' && !/GET|101/.test(p.info)) wsFrame(w, p, fromClient)
    else if (['TLS', 'QUIC', 'HTTP/3', 'WireGuard', 'UDP'].includes(p.proto) || (p.proto === 'SSH' && !/Versión/.test(p.info))) cryptoPayload(w, p)
    else if (p.proto === 'TCP') w.field('Datos', `${p.info.match(/Len=(\d+)/)?.[1]} bytes de la aplicación`, noise(p.info, Number(p.info.match(/Len=(\d+)/)?.[1] ?? 0)))
    else if (p.proto === 'IPv4') w.field('Datos', fragmented ? 'primeros 1472 bytes del datagrama' : 'respuesta de la aplicación', noise(p.info, fragmented ? 1472 : 114))
    else if (p.proto === 'Multicast') w.field('Flujo MPEG-TS', '7 paquetes de 188 bytes', noise(p.info, 1316))
    else if (p.proto === '802.1Q') w.field('Datos', 'segmento SMB entre los dos equipos', noise(p.info, 1400))
    else textPayload(w, p, fromClient)
    w.end()
  }

  patchIp(w, ipStart, lenAt, ipCkAt, ipLayer)

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
  ckField.value = hex2(ck) + (fragmented ? ' (calculado sobre el datagrama completo)' : ' ✓')

  return finish(w, w.layers.find((l) => l.id === 'app')?.start ?? w.pos())
}

function patchIp(w: Writer, ipStart: number, lenAt: number, ipCkAt: number, ipLayer: Layer) {
  const total = w.pos() - ipStart
  w.patch(lenAt, u16(total))
  ipLayer.fields[2].value = `${total} bytes`
  const ipCk = checksum(w.bytes.slice(ipStart, ipStart + 20))
  w.patch(ipCkAt, u16(ipCk))
  ipLayer.fields[7].value = hex2(ipCk) + ' ✓'
}

/** Keep the dump readable: show at most MAX_PAYLOAD bytes past `headerEnd`. */
function finish(w: Writer, headerEnd: number): Frame {
  const limit = headerEnd + MAX_PAYLOAD
  const truncated = Math.max(0, w.pos() - limit)
  const bytes = Uint8Array.from(w.bytes.slice(0, limit))
  for (const l of w.layers) {
    l.fields = l.fields.filter((f) => f.start < limit).map((f) => ({ ...f, len: Math.min(f.len, limit - f.start) }))
    l.len = Math.min(l.len, limit - l.start)
  }
  return { bytes, layers: w.layers, truncated }
}
