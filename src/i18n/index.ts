import { useCallback, useSyncExternalStore } from 'react'
import { NODES, type NodeId, type Packet, type Protocol } from '../data/protocols'
import { LESSONS_EN_1 } from './en-lessons-1'
import { LESSONS_EN_2 } from './en-lessons-2'
import { LESSONS_EN_3 } from './en-lessons-3'
import type { Lang, LessonText } from './types'
import { UI_EN } from './ui-en'

export type { Lang } from './types'

export const LESSONS_EN: Record<string, LessonText> = { ...LESSONS_EN_1, ...LESSONS_EN_2, ...LESSONS_EN_3 }

// ── language store (persisted, shared by every component) ─────────────────
const KEY = 'protocolos:lang'
const listeners = new Set<() => void>()

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'es' || saved === 'en') return saved
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

let current: Lang = typeof window === 'undefined' ? 'es' : initial()

export function setLang(l: Lang) {
  current = l
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* private mode */
  }
  document.documentElement.lang = l
  listeners.forEach((f) => f())
}

const subscribe = (f: () => void) => {
  listeners.add(f)
  return () => listeners.delete(f)
}

export const useLang = () => useSyncExternalStore(subscribe, () => current, () => 'es' as Lang)

/** Translate a Spanish UI string; `{name}` placeholders are filled from `vars`. */
export function translate(lang: Lang, es: string, vars?: Record<string, string | number>) {
  let s = lang === 'en' ? (UI_EN[es] ?? es) : es
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

export function useT() {
  const lang = useLang()
  return useCallback((es: string, vars?: Record<string, string | number>) => translate(lang, es, vars), [lang])
}

// ── names that appear in diagrams and decodes ─────────────────────────────
export const NODE_EN: Partial<Record<NodeId, string>> = {
  printer: 'Printer',
  client: 'Client',
  dns: 'DNS resolver',
  web: 'Web server',
  mail: 'Mail server',
  ssh: 'SSH server',
  root: 'Root server',
  tld: '.com TLD',
  auth: 'Authoritative',
  ntp: 'NTP server',
  vpn: 'VPN server',
  isp: 'ISP router',
  transit: 'Transit router',
  phone: 'IP phone',
  peer: 'Remote device',
  sipsrv: 'SIP server',
  stun: 'STUN server',
  camera: 'IP camera',
  plc: 'Industrial PLC',
  filesrv: 'File server',
  dc: 'Domain controller',
  ingest: 'Streaming server',
  ap: 'Access point',
  radius: 'RADIUS server',
  access: 'Access server',
  switch2: 'Switch 2',
  pc2: 'VLAN 20 device',
  iot: 'IoT sensor',
  broker: 'MQTT broker',
  core: 'Core router',
  ble: 'BLE wristband',
}

export const nodeLabel = (lang: Lang, id: NodeId, es: string) => (lang === 'en' ? (NODE_EN[id] ?? es) : es)

/** Literal phrase swaps for the packet "Info" column (the decoder keeps reading the Spanish original). */
const INFO_EN: [string, string][] = [
  ['¿Quién tiene 192.168.1.50? Responde a .10', 'Who has 192.168.1.50? Tell .10'],
  ['(difusión reenviada por todos los puertos)', '(broadcast forwarded out of every port)'],
  ['Trama → MAC de la impresora (desconocida)', 'Frame → printer MAC (unknown)'],
  ['Inundación por todos los puertos', 'Flooded out of every port'],
  ['Trama de respuesta → cliente', 'Reply frame → client'],
  ['Trama → impresora (entrega directa)', 'Frame → printer (direct delivery)'],
  ['Trama sin etiqueta (puerto de acceso VLAN 20)', 'Untagged frame (VLAN 20 access port)'],
  ['Trama etiquetada VLAN 20 (troncal)', 'Tagged frame VLAN 20 (trunk)'],
  ['Respuesta UDP (sin fragmentar)', 'UDP response (not fragmented)'],
  ['Saludo: métodos [sin autenticación]', 'Greeting: methods [no authentication]'],
  ['Método elegido: sin autenticación', 'Chosen method: no authentication'],
  ['Respuesta: éxito', 'Reply: succeeded'],
  ['Respuesta v4, modo servidor, estrato 2', 'Response v4, server mode, stratum 2'],
  ['Petición v4, modo cliente', 'Request v4, client mode'],
  ['Marco de texto (enmascarado)', 'Text frame (masked)'],
  ['Marco de texto', 'Text frame'],
  ['Marco Ping', 'Ping frame'],
  ['Marco Pong', 'Pong frame'],
  ['"oferta SDP"', '"SDP offer"'],
  ['"respuesta SDP"', '"SDP answer"'],
  ['(comprobación ICE)', '(ICE check)'],
  ['(SDP de respuesta)', '(answer SDP)'],
  ['Referencia: NS de', 'Referral: NS for'],
  ['(consulta A', '(query A'],
  ['Consulta', 'Query'],
  ['Respuesta', 'Response'],
  ['Leer registros', 'Read registers'],
  ['Escribir registro', 'Write register'],
  ['(TTL expirado en tránsito)', '(TTL expired in transit)'],
  ['Sonda UDP', 'UDP probe'],
  ['Prefacio', 'Preface'],
  ['(ticket de servicio)', '(service ticket)'],
  ['(AP-REQ de Kerberos)', '(Kerberos AP-REQ)'],
  ['AS-REQ con', 'AS-REQ with'],
  ['Trama IPv4', 'IPv4 frame'],
  ['Fragmento', 'Fragment'],
  ['Paquete cifrado', 'Encrypted packet'],
  ['firma de host', 'host signature'],
  ['Versión:', 'Version:'],
  ['Servidor FTP listo', 'FTP server ready'],
  ['Sesión iniciada', 'Logged in'],
  ['Modo pasivo', 'Entering Passive Mode'],
  ['Transferencia completa', 'Transfer complete'],
  ['completado', 'completed'],
  ['en cola como', 'queued as'],
  [' listo', ' ready'],
  ['mensajes', 'messages'],
  ['octetos', 'octets'],
  ['(aceptado)', '(accepted)'],
  ['grupos: ventas', 'groups: ventas'],
  ['(formulario)', '(form)'],
  ['prefijo', 'prefix'],
  [' para ', ' for '],
  ['grupo', 'group'],
  ['vídeo', 'video'],
  ['PERDIDO', 'LOST'],
  ['está en', 'is at'],
  ['(yo)', '(me)'],
  ['coste=', 'cost='],
  ['(acuerdo)', '(agreement)'],
  ['(cambio de topología)', '(topology change)'],
  ['raíz=', 'root='],
  ['(difusión)', '(broadcast)'],
  ['mensaje', 'message'],
  [' de 4', ' of 4'],
  ['cifrada', 'encrypted'],
  ['(sistema abierto)', '(open system)'],
  ['(éxito)', '(success)'],
  ['fotograma clave', 'keyframe'],
  ['bloque', 'block'],
  ['Texto:', 'Text:'],
  ['intervalo', 'interval'],
  ['(muñeca)', '(wrist)'],
  [' lpm', ' bpm'],
  ['(vacío)', '(empty)'],
  ['servicio', 'service'],
  ['dir=', 'addr='],
  ['cant=', 'qty='],
  ['valor=', 'value='],
]

export function infoText(lang: Lang, info: string) {
  if (lang !== 'en') return info
  let s = info
  for (const [a, b] of INFO_EN) s = s.replaceAll(a, b)
  return s
}

// ── lesson content ────────────────────────────────────────────────────────
const cache = new WeakMap<Protocol, Protocol>()

/** English view of a lesson; packets keep their Spanish `info` for the decoder and gain `display`. */
export function localize(p: Protocol, lang: Lang): Protocol {
  if (lang === 'es') return p
  const hit = cache.get(p)
  if (hit) return hit
  const en = LESSONS_EN[p.id]
  const out: Protocol = {
    ...p,
    name: displayName('en', p),
    full: en?.full ?? p.full,
    description: en?.description ?? p.description,
    facts: en?.facts ?? p.facts,
    packets: p.packets.map((pk: Packet, i) => ({ ...pk, note: en?.notes[i] ?? pk.note, display: infoText('en', pk.info) })),
  }
  cache.set(p, out)
  return out
}

const NAME_EN: Record<string, string> = { ethernet: 'Ethernet & switches', captive: 'Captive portal', proxy: 'HTTP proxy' }

/** Lesson name (most are acronyms and stay the same in English). */
export const displayName = (lang: Lang, p: { id: string; name: string }) => (lang === 'en' ? (NAME_EN[p.id] ?? p.name) : p.name)

export const fullName = (lang: Lang, p: Protocol) => (lang === 'en' ? (LESSONS_EN[p.id]?.full ?? p.full) : p.full)

// ── inspector: common header fields (rarer protocol-specific fields stay in Spanish) ──
const FIELD_EN: Record<string, string> = {
  'MAC destino': 'Destination MAC',
  'MAC origen': 'Source MAC',
  'Versión / IHL': 'Version / IHL',
  'Longitud total': 'Total length',
  Identificación: 'Identification',
  'Flags / fragmento': 'Flags / fragment',
  Protocolo: 'Protocol',
  'IP origen': 'Source IP',
  'IP destino': 'Destination IP',
  'Puerto origen': 'Source port',
  'Puerto destino': 'Destination port',
  'Número de secuencia': 'Sequence number',
  'Número de ACK': 'Acknowledgment number',
  'Longitud de cabecera': 'Header length',
  Ventana: 'Window',
  'Puntero urgente': 'Urgent pointer',
  Longitud: 'Length',
  Tipo: 'Type',
  Código: 'Code',
  Identificador: 'Identifier',
  Secuencia: 'Sequence',
  Datos: 'Data',
  Texto: 'Text',
  Mensaje: 'Message',
  'Versión / clase / flujo': 'Version / class / flow',
  'Longitud de carga': 'Payload length',
  'Siguiente cabecera': 'Next header',
  'Límite de saltos': 'Hop limit',
  'Sin usar': 'Unused',
  'Cabecera IP original': 'Original IP header',
  '8 bytes de la sonda': 'First 8 bytes of the probe',
  'Etiqueta 802.1Q': '802.1Q tag',
  'Datos de impresión': 'Print data',
  'Datos UDP': 'UDP data',
  'Fragmento IPv4': 'IPv4 fragment',
  'Datos (continuación)': 'Data (continued)',
  'DF (no fragmentar)': "DF (don't fragment)",
  '1 (solo el enlace local)': '1 (local link only)',
  '56 bytes de relleno': '56 bytes of padding',
  'Echo Request (8)': 'Echo Request (8)',
  'Time Exceeded (11)': 'Time Exceeded (11)',
  'TTL agotado en tránsito (0)': 'TTL expired in transit (0)',
  'puerto inalcanzable (3)': 'port unreachable (3)',
}

const FIELD_PHRASES: [string, string][] = [
  ['(difusión)', '(broadcast)'],
  ['(relativo)', '(relative)'],
  ['(multicast IPv6)', '(IPv6 multicast)'],
  [' bytes de la aplicación', ' bytes of application data'],
  ['(sonda de traceroute)', '(traceroute probe)'],
  ['(calculado sobre el datagrama completo)', '(computed over the whole datagram)'],
  ['MF (más fragmentos)', 'MF (more fragments)'],
  ['último fragmento', 'last fragment'],
  ['desplazamiento', 'offset'],
]

/** Best-effort English for decoder field names and values. */
export function fieldText(lang: Lang, s: string) {
  if (lang !== 'en') return s
  if (FIELD_EN[s]) return FIELD_EN[s]
  let out = s
  for (const [a, b] of FIELD_PHRASES) out = out.replaceAll(a, b)
  for (const [id, en] of Object.entries(NODE_EN)) {
    const es = NODE_ES[id as NodeId]
    if (es) out = out.replaceAll(`(${es})`, `(${en})`)
  }
  return out
}

// Spanish node labels, for swapping "(Router)"-style suffixes in decoded values
const NODE_ES: Partial<Record<NodeId, string>> = Object.fromEntries(Object.values(NODES).map((n) => [n.id, n.label]))
