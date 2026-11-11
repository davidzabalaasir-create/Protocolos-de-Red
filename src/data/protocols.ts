import { tcpHandshake } from './helpers'
import { MORE_PROTOCOLS } from './more'
import { MORE_PROTOCOLS_2 } from './more2'
import { MORE_PROTOCOLS_3 } from './more3'

export type NodeId =
  | 'client'
  | 'router'
  | 'switch'
  | 'printer'
  | 'internet'
  | 'dns'
  | 'root'
  | 'tld'
  | 'auth'
  | 'web'
  | 'mail'
  | 'ssh'
  | 'ntp'
  | 'vpn'
  | 'isp'
  | 'transit'
  | 'phone'
  | 'peer'
  | 'sipsrv'
  | 'stun'
  | 'camera'
  | 'plc'
  | 'filesrv'
  | 'dc'
  | 'ingest'
  | 'ap'
  | 'radius'
  | 'access'
  | 'proxy'
  | 'switch2'
  | 'pc2'
  | 'iot'
  | 'broker'
  | 'core'
  | 'ble'
  | 'rproxy'
  | 'app1'
  | 'tv'
  | 'router2'
  | 'logsrv'

export type NodeKind = 'laptop' | 'router' | 'switch' | 'printer' | 'cloud' | 'server' | 'phone' | 'camera' | 'wifi' | 'chip' | 'screen'

export interface NetNode {
  id: NodeId
  label: string
  addr: string
  kind: NodeKind
  x: number
  y: number
}

export const NODES: Record<NodeId, NetNode> = {
  printer: { id: 'printer', label: 'Impresora', addr: '192.168.1.50', kind: 'printer', x: 90, y: 110 },
  switch: { id: 'switch', label: 'Switch', addr: '8 puertos', kind: 'switch', x: 250, y: 110 },
  client: { id: 'client', label: 'Cliente', addr: '192.168.1.10', kind: 'laptop', x: 90, y: 330 },
  router: { id: 'router', label: 'Router', addr: '192.168.1.1', kind: 'router', x: 260, y: 330 },
  internet: { id: 'internet', label: 'Internet', addr: '', kind: 'cloud', x: 450, y: 230 },
  dns: { id: 'dns', label: 'Resolutor DNS', addr: '8.8.8.8', kind: 'server', x: 640, y: 80 },
  web: { id: 'web', label: 'Servidor web', addr: '203.0.113.10', kind: 'server', x: 650, y: 230 },
  mail: { id: 'mail', label: 'Servidor de correo', addr: '198.51.100.25', kind: 'server', x: 650, y: 380 },
  ssh: { id: 'ssh', label: 'Servidor SSH', addr: '198.51.100.40', kind: 'server', x: 450, y: 410 },
  root: { id: 'root', label: 'Servidor raíz', addr: '198.41.0.4', kind: 'server', x: 830, y: 40 },
  tld: { id: 'tld', label: 'TLD .com', addr: '192.5.6.30', kind: 'server', x: 830, y: 150 },
  auth: { id: 'auth', label: 'Autoritativo', addr: '198.51.100.53', kind: 'server', x: 830, y: 260 },
  ntp: { id: 'ntp', label: 'Servidor NTP', addr: '192.0.2.123', kind: 'server', x: 450, y: 60 },
  vpn: { id: 'vpn', label: 'Servidor VPN', addr: '198.51.100.77', kind: 'server', x: 650, y: 520 },
  isp: { id: 'isp', label: 'Router del ISP', addr: '192.0.2.1 · AS 64500', kind: 'router', x: 200, y: 560 },
  transit: { id: 'transit', label: 'Router de tránsito', addr: '192.0.2.2 · AS 64510', kind: 'router', x: 480, y: 560 },
  phone: { id: 'phone', label: 'Teléfono IP', addr: '192.168.1.40', kind: 'phone', x: 90, y: 470 },
  peer: { id: 'peer', label: 'Equipo remoto', addr: '198.51.100.200', kind: 'laptop', x: 830, y: 330 },
  sipsrv: { id: 'sipsrv', label: 'Servidor SIP', addr: '198.51.100.60', kind: 'server', x: 650, y: 110 },
  stun: { id: 'stun', label: 'Servidor STUN', addr: '192.0.2.19', kind: 'server', x: 650, y: 110 },
  camera: { id: 'camera', label: 'Cámara IP', addr: '192.168.1.64', kind: 'camera', x: 420, y: 50 },
  plc: { id: 'plc', label: 'PLC industrial', addr: '192.168.1.80', kind: 'chip', x: 420, y: 130 },
  filesrv: { id: 'filesrv', label: 'Servidor de archivos', addr: '192.168.1.20', kind: 'server', x: 420, y: 210 },
  dc: { id: 'dc', label: 'Controlador de dominio', addr: '192.168.1.15', kind: 'server', x: 420, y: 290 },
  ingest: { id: 'ingest', label: 'Servidor de streaming', addr: '203.0.113.50', kind: 'server', x: 650, y: 310 },
  ap: { id: 'ap', label: 'Punto de acceso', addr: '192.168.1.2', kind: 'wifi', x: 250, y: 470 },
  radius: { id: 'radius', label: 'Servidor RADIUS', addr: '192.168.1.5', kind: 'server', x: 450, y: 470 },
  access: { id: 'access', label: 'Servidor de acceso', addr: '198.51.100.1', kind: 'router', x: 450, y: 330 },
  proxy: { id: 'proxy', label: 'Proxy', addr: '192.0.2.80', kind: 'server', x: 380, y: 420 },
  switch2: { id: 'switch2', label: 'Switch 2', addr: 'troncal 802.1Q', kind: 'switch', x: 560, y: 110 },
  pc2: { id: 'pc2', label: 'Equipo VLAN 20', addr: '192.168.20.30', kind: 'laptop', x: 720, y: 110 },
  iot: { id: 'iot', label: 'Sensor IoT', addr: '192.168.1.70', kind: 'chip', x: 90, y: 560 },
  broker: { id: 'broker', label: 'Broker MQTT', addr: '198.51.100.90', kind: 'server', x: 650, y: 450 },
  core: { id: 'core', label: 'Router núcleo', addr: '10.0.0.2', kind: 'router', x: 480, y: 420 },
  rproxy: { id: 'rproxy', label: 'Proxy inverso', addr: '203.0.113.80', kind: 'server', x: 650, y: 230 },
  app1: { id: 'app1', label: 'Servidor de aplicaciones', addr: '10.0.0.20', kind: 'server', x: 840, y: 230 },
  tv: { id: 'tv', label: 'Smart TV', addr: '192.168.1.30', kind: 'screen', x: 430, y: 110 },
  router2: { id: 'router2', label: 'Router de respaldo', addr: '192.168.1.3', kind: 'router', x: 260, y: 480 },
  logsrv: { id: 'logsrv', label: 'Servidor de logs', addr: '192.168.1.25', kind: 'server', x: 460, y: 440 },
  ble: { id: 'ble', label: 'Pulsera BLE', addr: 'c4:7f:51:0a:2e:91', kind: 'chip', x: 280, y: 560 },
}

/** Physical links of the diagram; packets travel along the shortest path. */
export const LINKS: [NodeId, NodeId][] = [
  ['client', 'router'],
  ['client', 'switch'],
  ['switch', 'printer'],
  ['router', 'internet'],
  ['internet', 'dns'],
  ['internet', 'web'],
  ['internet', 'mail'],
  ['internet', 'ssh'],
  ['dns', 'root'],
  ['dns', 'tld'],
  ['dns', 'auth'],
  ['internet', 'ntp'],
  ['internet', 'vpn'],
  ['isp', 'transit'],
  ['phone', 'router'],
  ['internet', 'sipsrv'],
  ['internet', 'peer'],
  ['internet', 'stun'],
  ['switch', 'camera'],
  ['switch', 'plc'],
  ['switch', 'filesrv'],
  ['switch', 'dc'],
  ['internet', 'ingest'],
  ['client', 'ap'],
  ['ap', 'radius'],
  ['router', 'access'],
  ['router', 'proxy'],
  ['proxy', 'internet'],
  ['switch', 'switch2'],
  ['switch2', 'pc2'],
  ['iot', 'router'],
  ['internet', 'broker'],
  ['router', 'core'],
  ['phone', 'ble'],
  ['internet', 'rproxy'],
  ['rproxy', 'app1'],
  ['switch', 'tv'],
  ['router', 'router2'],
  ['router2', 'client'],
  ['router', 'logsrv'],
]

export type PacketKind = 'dns' | 'tcp' | 'udp' | 'tls' | 'req' | 'res' | 'ctrl' | 'err'

export const KIND_META: Record<PacketKind, { label: string; color: string }> = {
  dns: { label: 'DNS', color: '#3b82f6' },
  tcp: { label: 'TCP', color: '#22c55e' },
  udp: { label: 'UDP', color: '#06b6d4' },
  tls: { label: 'TLS', color: '#f97316' },
  req: { label: 'Petición', color: '#eab308' },
  res: { label: 'Respuesta', color: '#a855f7' },
  ctrl: { label: 'Control', color: '#94a3b8' },
  err: { label: 'Pérdida', color: '#ef4444' },
}

/** Theme-aware colour of a packet kind (darker in light theme for contrast). */
export const kindColor = (k: PacketKind) => `var(--k-${k})`

export interface Packet {
  t: number
  from: NodeId
  to: NodeId
  proto: string
  info: string
  size: string
  kind: PacketKind
  note: string
  /** Overrides for addresses that aren't the node's own (multicast, IPv6, link-local…) */
  srcIp?: string
  dstIp?: string
  /** Translated text for the Info column (decoders always read `info`) */
  display?: string
  /** IPv4 TTL override (traceroute probes) */
  ttl?: number
}

export interface Protocol {
  id: string
  name: string
  full: string
  layer: number
  description: string
  facts: [string, string][]
  packets: Packet[]
}

export const OSI_LAYERS: Record<number, string> = {
  1: 'Física',
  2: 'Enlace de datos',
  3: 'Red',
  4: 'Transporte',
  5: 'Sesión',
  6: 'Presentación',
  7: 'Aplicación',
}


const BASE_PROTOCOLS: Protocol[] = [
  {
    id: 'http',
    name: 'HTTP',
    full: 'Protocolo de transferencia de hipertexto',
    layer: 7,
    description:
      'HTTP es el idioma de la web. El navegador envía una petición (método, ruta y cabeceras) y el servidor contesta con un código de estado, sus cabeceras y, normalmente, un cuerpo como una página HTML. En HTTP/1.1 todo viaja como texto legible.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '80 (HTTPS: 443)'],
      ['Transporte', 'TCP'],
      ['Formato', 'Texto: cabeceras + cuerpo opcional'],
      ['Métodos', 'GET, POST, PUT, DELETE, HEAD'],
      ['Especificación', 'RFC 9110, RFC 9112'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'dns', proto: 'DNS', info: 'Consulta A www.ejemplo.com', size: '75 B', kind: 'dns', note: 'Antes de conectar, el navegador necesita la IP del dominio y pregunta al resolutor DNS.' },
      { t: 0.012, from: 'dns', to: 'client', proto: 'DNS', info: 'Respuesta A 203.0.113.10', size: '91 B', kind: 'dns', note: 'El resolutor devuelve la dirección IP del servidor web.' },
      ...tcpHandshake('web', 80, 0.024),
      { t: 0.058, from: 'client', to: 'web', proto: 'HTTP', info: 'GET / HTTP/1.1', size: '484 B', kind: 'req', note: 'El navegador pide la página raíz con cabeceras como Host, User-Agent y Accept.' },
      { t: 0.076, from: 'web', to: 'client', proto: 'HTTP', info: 'HTTP/1.1 200 OK (text/html)', size: '12.8 KB', kind: 'res', note: 'El servidor responde 200 OK y envía el HTML, repartido en varios segmentos TCP.' },
      { t: 0.081, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [ACK] Seq=419 Ack=12801', size: '60 B', kind: 'tcp', note: 'El cliente confirma la recepción de todos los bytes.' },
    ],
  },
  {
    id: 'https',
    name: 'HTTPS',
    full: 'HTTP sobre TLS',
    layer: 7,
    description:
      'HTTPS es HTTP dentro de un túnel TLS. Tras abrir la conexión TCP, cliente y servidor negocian claves con un saludo TLS; a partir de ahí, peticiones y respuestas viajan cifradas y nadie en el camino puede leerlas ni modificarlas.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '443'],
      ['Transporte', 'TCP (o QUIC en HTTP/3)'],
      ['Cifrado', 'TLS 1.3 / 1.2'],
      ['Autenticación', 'Certificado X.509 del servidor'],
      ['Especificación', 'RFC 9110, RFC 8446'],
    ],
    packets: [
      ...tcpHandshake('web', 443, 0),
      { t: 0.036, from: 'client', to: 'web', proto: 'TLS', info: 'Client Hello (SNI=www.ejemplo.com)', size: '517 B', kind: 'tls', note: 'El cliente propone versiones, cifrados y envía su parte del intercambio de claves.' },
      { t: 0.054, from: 'web', to: 'client', proto: 'TLS', info: 'Server Hello, Certificate, Finished', size: '4.1 KB', kind: 'tls', note: 'El servidor elige el cifrado, presenta su certificado y prueba que posee la clave privada.' },
      { t: 0.058, from: 'client', to: 'web', proto: 'TLS', info: 'Finished', size: '80 B', kind: 'tls', note: 'El cliente verifica el certificado y cierra el saludo: el canal ya está cifrado.' },
      { t: 0.06, from: 'client', to: 'web', proto: 'TLS', info: 'Application Data (GET /)', size: '512 B', kind: 'req', note: 'La petición HTTP viaja cifrada; un observador solo ve bytes aleatorios.' },
      { t: 0.079, from: 'web', to: 'client', proto: 'TLS', info: 'Application Data (200 OK)', size: '12.9 KB', kind: 'res', note: 'La respuesta también llega cifrada y el navegador la descifra.' },
    ],
  },
  {
    id: 'dns',
    name: 'DNS',
    full: 'Sistema de nombres de dominio',
    layer: 7,
    description:
      'DNS traduce nombres como www.ejemplo.com en direcciones IP. Tu equipo pregunta a un resolutor, que recorre la jerarquía: servidor raíz, servidor del dominio de nivel superior (.com) y, por último, el servidor autoritativo del dominio.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '53'],
      ['Transporte', 'UDP (TCP para respuestas grandes)'],
      ['Registros', 'A, AAAA, CNAME, MX, TXT, NS'],
      ['Caché', 'Según el TTL de cada registro'],
      ['Especificación', 'RFC 1034, RFC 1035'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'dns', proto: 'DNS', info: 'Consulta A www.ejemplo.com', size: '75 B', kind: 'req', note: 'El cliente pide al resolutor que averigüe la IP por él (consulta recursiva).' },
      { t: 0.008, from: 'dns', to: 'root', proto: 'DNS', info: 'Consulta A www.ejemplo.com', size: '75 B', kind: 'req', note: 'El resolutor no lo tiene en caché y empieza por un servidor raíz.' },
      { t: 0.021, from: 'root', to: 'dns', proto: 'DNS', info: 'Referencia: NS de .com', size: '1.1 KB', kind: 'res', note: 'La raíz no conoce la respuesta, pero sabe quién gestiona .com.' },
      { t: 0.03, from: 'dns', to: 'tld', proto: 'DNS', info: 'Consulta A www.ejemplo.com', size: '75 B', kind: 'req', note: 'El resolutor pregunta al servidor del TLD .com.' },
      { t: 0.044, from: 'tld', to: 'dns', proto: 'DNS', info: 'Referencia: NS de ejemplo.com', size: '640 B', kind: 'res', note: 'El TLD indica qué servidores son autoritativos para ejemplo.com.' },
      { t: 0.052, from: 'dns', to: 'auth', proto: 'DNS', info: 'Consulta A www.ejemplo.com', size: '75 B', kind: 'req', note: 'Último salto: el servidor autoritativo del dominio.' },
      { t: 0.066, from: 'auth', to: 'dns', proto: 'DNS', info: 'Respuesta A 203.0.113.10 TTL=3600', size: '91 B', kind: 'res', note: 'El autoritativo da la respuesta definitiva y cuánto tiempo puede guardarse.' },
      { t: 0.07, from: 'dns', to: 'client', proto: 'DNS', info: 'Respuesta A 203.0.113.10', size: '91 B', kind: 'res', note: 'El resolutor la guarda en caché y se la entrega al cliente.' },
    ],
  },
  {
    id: 'dhcp',
    name: 'DHCP',
    full: 'Configuración dinámica de host',
    layer: 7,
    description:
      'Cuando un dispositivo se conecta a la red no tiene dirección IP. DHCP se la asigna automáticamente en cuatro pasos (DORA): Discover, Offer, Request y Acknowledge, junto con la puerta de enlace y los servidores DNS.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puertos', '67 (servidor), 68 (cliente)'],
      ['Transporte', 'UDP, por difusión'],
      ['Entrega', 'IP, máscara, gateway, DNS'],
      ['Concesión', 'Temporal, se renueva'],
      ['Especificación', 'RFC 2131'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'router', proto: 'DHCP', info: 'Discover 0.0.0.0 → 255.255.255.255', size: '342 B', kind: 'req', note: 'Sin IP todavía, el cliente grita a toda la red: ¿hay algún servidor DHCP?' },
      { t: 0.004, from: 'router', to: 'client', proto: 'DHCP', info: 'Offer 192.168.1.10', size: '342 B', kind: 'res', note: 'El router (servidor DHCP) ofrece una dirección libre.' },
      { t: 0.006, from: 'client', to: 'router', proto: 'DHCP', info: 'Request 192.168.1.10', size: '342 B', kind: 'req', note: 'El cliente acepta formalmente esa oferta.' },
      { t: 0.009, from: 'router', to: 'client', proto: 'DHCP', info: 'ACK lease=86400 s, gw=192.168.1.1', size: '342 B', kind: 'res', note: 'Confirmado: el cliente ya puede usar la IP durante 24 horas.' },
    ],
  },
  {
    id: 'tcp',
    name: 'TCP',
    full: 'Protocolo de control de transmisión',
    layer: 4,
    description:
      'TCP ofrece un flujo de bytes fiable y ordenado sobre una red que puede perder o desordenar paquetes. Numera cada byte, exige confirmaciones (ACK), retransmite lo perdido y regula la velocidad para no saturar la red.',
    facts: [
      ['Capa', 'Transporte (capa 4)'],
      ['Conexión', 'Sí: saludo de tres vías'],
      ['Fiabilidad', 'ACK + retransmisión'],
      ['Orden', 'Garantizado por números de secuencia'],
      ['Control', 'De flujo y de congestión'],
      ['Especificación', 'RFC 9293'],
    ],
    packets: [
      ...tcpHandshake('web', 80, 0),
      { t: 0.04, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [PSH, ACK] Len=120', size: '180 B', kind: 'req', note: 'El cliente envía 120 bytes de datos de la aplicación.' },
      { t: 0.057, from: 'web', to: 'client', proto: 'TCP', info: '80 → 52344 [ACK] Ack=121', size: '60 B', kind: 'tcp', note: 'El servidor confirma que recibió hasta el byte 120.' },
      { t: 0.06, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [FIN, ACK]', size: '60 B', kind: 'ctrl', note: 'El cliente no tiene más que enviar y cierra su lado.' },
      { t: 0.077, from: 'web', to: 'client', proto: 'TCP', info: '80 → 52344 [FIN, ACK]', size: '60 B', kind: 'ctrl', note: 'El servidor confirma y cierra también el suyo.' },
      { t: 0.079, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [ACK]', size: '60 B', kind: 'tcp', note: 'Último ACK: la conexión queda cerrada.' },
    ],
  },
  {
    id: 'udp',
    name: 'UDP',
    full: 'Protocolo de datagramas de usuario',
    layer: 4,
    description:
      'UDP envía datagramas sueltos sin conexión, sin confirmaciones y sin reintentos. Es mínimo y rápido, ideal para voz, vídeo en directo o juegos, donde llegar tarde es peor que no llegar.',
    facts: [
      ['Capa', 'Transporte (capa 4)'],
      ['Conexión', 'No'],
      ['Fiabilidad', 'Ninguna: puede perder datos'],
      ['Cabecera', '8 bytes'],
      ['Usos', 'DNS, VoIP, streaming, juegos, QUIC'],
      ['Especificación', 'RFC 768'],
    ],
    packets: [
      { t: 0, from: 'web', to: 'client', proto: 'UDP', info: '5004 → 49170 Len=1200 (vídeo #1)', size: '1.2 KB', kind: 'udp', note: 'El servidor de vídeo envía el primer fragmento sin establecer conexión.' },
      { t: 0.02, from: 'web', to: 'client', proto: 'UDP', info: '5004 → 49170 Len=1200 (vídeo #2)', size: '1.2 KB', kind: 'udp', note: 'Siguiente datagrama, independiente del anterior.' },
      { t: 0.04, from: 'web', to: 'client', proto: 'UDP', info: '5004 → 49170 Len=1200 (vídeo #3) PERDIDO', size: '1.2 KB', kind: 'err', note: 'Este datagrama se pierde en la red. UDP no lo reenvía: el reproductor lo disimula.' },
      { t: 0.06, from: 'web', to: 'client', proto: 'UDP', info: '5004 → 49170 Len=1200 (vídeo #4)', size: '1.2 KB', kind: 'udp', note: 'El flujo continúa sin esperar a nadie.' },
    ],
  },
  {
    id: 'icmp',
    name: 'ICMP',
    full: 'Protocolo de mensajes de control de Internet',
    layer: 3,
    description:
      'ICMP es el canal de avisos de la capa de red: informa de destinos inalcanzables o de paquetes que agotaron su TTL. La herramienta ping lo usa para comprobar si un equipo responde y cuánto tarda.',
    facts: [
      ['Capa', 'Red (capa 3)'],
      ['Puerto', 'No usa puertos'],
      ['Transporte', 'Directamente sobre IP'],
      ['Tipos comunes', 'Echo (8), Echo Reply (0), Time Exceeded (11)'],
      ['Herramientas', 'ping, traceroute'],
      ['Especificación', 'RFC 792'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'dns', proto: 'ICMP', info: 'Echo request id=1 seq=1 ttl=64', size: '98 B', kind: 'req', note: 'ping envía una solicitud de eco a 8.8.8.8.' },
      { t: 0.014, from: 'dns', to: 'client', proto: 'ICMP', info: 'Echo reply id=1 seq=1 ttl=117', size: '98 B', kind: 'res', note: 'Respuesta en 14 ms: el equipo está vivo y alcanzable.' },
      { t: 1, from: 'client', to: 'dns', proto: 'ICMP', info: 'Echo request id=1 seq=2 ttl=64', size: '98 B', kind: 'req', note: 'Un segundo después, ping repite la prueba.' },
      { t: 1.013, from: 'dns', to: 'client', proto: 'ICMP', info: 'Echo reply id=1 seq=2 ttl=117', size: '98 B', kind: 'res', note: 'Segunda respuesta: 13 ms de ida y vuelta.' },
    ],
  },
  {
    id: 'arp',
    name: 'ARP',
    full: 'Protocolo de resolución de direcciones',
    layer: 2,
    description:
      'En una red local, las tramas Ethernet se entregan por dirección MAC, no por IP. ARP pregunta por difusión “¿quién tiene esta IP?” y el dueño contesta con su MAC; el switch aprende en qué puerto está cada equipo.',
    facts: [
      ['Capa', 'Enlace de datos (capa 2)'],
      ['Alcance', 'Solo la red local'],
      ['Destino', 'Difusión ff:ff:ff:ff:ff:ff'],
      ['Caché', 'Tabla ARP del sistema'],
      ['Equivalente IPv6', 'NDP'],
      ['Especificación', 'RFC 826'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'switch', proto: 'ARP', info: '¿Quién tiene 192.168.1.50? Responde a .10', size: '42 B', kind: 'req', note: 'El cliente quiere imprimir pero solo conoce la IP; difunde una pregunta ARP.' },
      { t: 0.001, from: 'switch', to: 'printer', proto: 'ARP', info: '(difusión reenviada por todos los puertos)', size: '42 B', kind: 'ctrl', note: 'El switch reenvía la difusión a todos sus puertos.' },
      { t: 0.003, from: 'printer', to: 'client', proto: 'ARP', info: '192.168.1.50 está en 3c:22:fb:10:4e:01', size: '42 B', kind: 'res', note: 'La impresora responde directamente con su dirección MAC.' },
      { t: 0.004, from: 'client', to: 'printer', proto: 'Ethernet', info: 'Trama IPv4 → 3c:22:fb:10:4e:01', size: '1.5 KB', kind: 'udp', note: 'Ya con la MAC, el cliente envía tramas que el switch entrega solo a ese puerto.' },
    ],
  },
  {
    id: 'ssh',
    name: 'SSH',
    full: 'Intérprete de órdenes seguro',
    layer: 7,
    description:
      'SSH abre una sesión remota cifrada para administrar servidores. Tras el saludo TCP, ambos lados intercambian versiones y algoritmos, acuerdan claves con Diffie-Hellman, el servidor demuestra su identidad y el usuario se autentica con clave pública o contraseña.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '22'],
      ['Transporte', 'TCP'],
      ['Intercambio de claves', 'Curve25519 / ECDH'],
      ['Autenticación', 'Clave pública o contraseña'],
      ['Especificación', 'RFC 4251–4254'],
    ],
    packets: [
      ...tcpHandshake('ssh', 22, 0),
      { t: 0.036, from: 'ssh', to: 'client', proto: 'SSH', info: 'Versión: SSH-2.0-OpenSSH_9.6', size: '87 B', kind: 'ctrl', note: 'Ambos lados anuncian su versión de protocolo y software.' },
      { t: 0.038, from: 'client', to: 'ssh', proto: 'SSH', info: 'KEXINIT + ECDH init', size: '1.6 KB', kind: 'tls', note: 'El cliente lista algoritmos soportados y envía su clave efímera.' },
      { t: 0.055, from: 'ssh', to: 'client', proto: 'SSH', info: 'ECDH reply + firma de host, NEWKEYS', size: '1.1 KB', kind: 'tls', note: 'El servidor responde y firma con su clave de host; el cliente la compara con known_hosts.' },
      { t: 0.057, from: 'client', to: 'ssh', proto: 'SSH', info: 'Paquete cifrado (userauth publickey)', size: '640 B', kind: 'req', note: 'Ya cifrado, el usuario se autentica con su clave pública.' },
      { t: 0.074, from: 'ssh', to: 'client', proto: 'SSH', info: 'Paquete cifrado (userauth success)', size: '60 B', kind: 'res', note: 'Autenticación correcta: se abre un canal con la shell remota.' },
    ],
  },
  {
    id: 'smtp',
    name: 'SMTP',
    full: 'Protocolo simple de transferencia de correo',
    layer: 7,
    description:
      'SMTP entrega el correo electrónico. El cliente mantiene un diálogo de texto con el servidor: se presenta, indica remitente y destinatarios, envía el mensaje tras DATA y lo termina con un punto en una línea aparte.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puertos', '25 (servidores), 587 (envío)'],
      ['Transporte', 'TCP, con STARTTLS'],
      ['Formato', 'Comandos de texto y códigos 3 dígitos'],
      ['Lectura', 'Se complementa con IMAP o POP3'],
      ['Especificación', 'RFC 5321'],
    ],
    packets: [
      ...tcpHandshake('mail', 587, 0),
      { t: 0.04, from: 'mail', to: 'client', proto: 'SMTP', info: '220 mail.ejemplo.com ESMTP listo', size: '96 B', kind: 'res', note: 'El servidor saluda primero con el código 220.' },
      { t: 0.042, from: 'client', to: 'mail', proto: 'SMTP', info: 'EHLO portatil.local', size: '80 B', kind: 'req', note: 'El cliente se presenta y pide la lista de extensiones.' },
      { t: 0.06, from: 'client', to: 'mail', proto: 'SMTP', info: 'MAIL FROM:<david@ejemplo.com>', size: '92 B', kind: 'req', note: 'Indica el remitente del sobre.' },
      { t: 0.078, from: 'client', to: 'mail', proto: 'SMTP', info: 'RCPT TO:<ana@ejemplo.org>', size: '88 B', kind: 'req', note: 'Indica el destinatario; puede repetirse para varios.' },
      { t: 0.096, from: 'client', to: 'mail', proto: 'SMTP', info: 'DATA … mensaje … .', size: '3.4 KB', kind: 'req', note: 'Envía cabeceras y cuerpo, terminando con una línea que solo contiene un punto.' },
      { t: 0.115, from: 'mail', to: 'client', proto: 'SMTP', info: '250 OK: en cola como 4F2A9', size: '84 B', kind: 'res', note: 'El servidor acepta el mensaje y lo pone en cola para entregarlo.' },
    ],
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    full: 'Canal bidireccional sobre HTTP',
    layer: 7,
    description:
      'WebSocket convierte una conexión HTTP en un canal permanente en ambos sentidos. El navegador pide una «actualización» (Upgrade) y, tras el 101, cliente y servidor se envían marcos pequeños en cualquier momento: ideal para chats, juegos y paneles en tiempo real.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '80 (ws) / 443 (wss)'],
      ['Transporte', 'TCP'],
      ['Arranque', 'GET con Upgrade: websocket'],
      ['Unidad', 'Marcos (texto, binario, ping, close)'],
      ['Especificación', 'RFC 6455'],
    ],
    packets: [
      ...tcpHandshake('web', 80, 0),
      { t: 0.036, from: 'client', to: 'web', proto: 'WebSocket', info: 'GET /chat HTTP/1.1 Upgrade: websocket', size: '412 B', kind: 'req', note: 'El navegador pide cambiar de protocolo e incluye una clave aleatoria (Sec-WebSocket-Key).' },
      { t: 0.053, from: 'web', to: 'client', proto: 'WebSocket', info: 'HTTP/1.1 101 Switching Protocols', size: '183 B', kind: 'res', note: 'El servidor acepta y devuelve un hash de esa clave: desde aquí ya no se habla HTTP.' },
      { t: 0.31, from: 'client', to: 'web', proto: 'WebSocket', info: 'Marco de texto (enmascarado): "hola"', size: '70 B', kind: 'req', note: 'Los marcos del cliente van enmascarados con 4 bytes aleatorios.' },
      { t: 0.33, from: 'web', to: 'client', proto: 'WebSocket', info: 'Marco de texto: "¡bienvenido!"', size: '79 B', kind: 'res', note: 'El servidor puede escribir cuando quiera, sin esperar una petición.' },
      { t: 30.0, from: 'web', to: 'client', proto: 'WebSocket', info: 'Marco Ping', size: '62 B', kind: 'ctrl', note: 'Un ping periódico comprueba que la conexión sigue viva.' },
      { t: 30.017, from: 'client', to: 'web', proto: 'WebSocket', info: 'Marco Pong', size: '66 B', kind: 'ctrl', note: 'El cliente contesta con un pong idéntico.' },
    ],
  },
  {
    id: 'http3',
    name: 'HTTP/3',
    full: 'HTTP sobre QUIC',
    layer: 7,
    description:
      'HTTP/3 viaja sobre QUIC, un transporte cifrado construido encima de UDP. QUIC fusiona el saludo de transporte y el de TLS 1.3 en un solo viaje de ida y vuelta, y multiplexa flujos independientes: perder un paquete no bloquea a los demás.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '443/UDP'],
      ['Transporte', 'QUIC sobre UDP'],
      ['Cifrado', 'TLS 1.3 integrado'],
      ['Ventaja', '1-RTT, sin bloqueo de cabeza de línea'],
      ['Especificación', 'RFC 9000, RFC 9114'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'web', proto: 'QUIC', info: 'Initial: CRYPTO (Client Hello)', size: '1.25 KB', kind: 'tls', note: 'El primer paquete ya lleva el Client Hello de TLS, relleno hasta 1200 bytes para evitar amplificación.' },
      { t: 0.018, from: 'web', to: 'client', proto: 'QUIC', info: 'Initial + Handshake: Server Hello, Certificate', size: '1.25 KB', kind: 'tls', note: 'El servidor responde con su parte del saludo y el certificado, todo en un solo vuelo.' },
      { t: 0.02, from: 'client', to: 'web', proto: 'QUIC', info: 'Handshake: Finished', size: '90 B', kind: 'tls', note: 'Un único viaje de ida y vuelta y la conexión está lista y cifrada.' },
      { t: 0.021, from: 'client', to: 'web', proto: 'HTTP/3', info: '1-RTT STREAM 0: HEADERS GET /', size: '96 B', kind: 'req', note: 'La petición va en el flujo 0, con cabeceras comprimidas mediante QPACK.' },
      { t: 0.04, from: 'web', to: 'client', proto: 'HTTP/3', info: '1-RTT STREAM 0: HEADERS 200, DATA', size: '12.9 KB', kind: 'res', note: 'La respuesta llega en el mismo flujo; otros flujos avanzan en paralelo.' },
      { t: 0.042, from: 'client', to: 'web', proto: 'QUIC', info: '1-RTT ACK', size: '45 B', kind: 'udp', note: 'QUIC hace sus propias confirmaciones, ya que UDP no las tiene.' },
    ],
  },
  {
    id: 'ntp',
    name: 'NTP',
    full: 'Protocolo de tiempo de red',
    layer: 7,
    description:
      'NTP sincroniza los relojes de los equipos. El cliente anota cuándo envía la petición y cuándo llega la respuesta; el servidor anota cuándo la recibe y cuándo contesta. Con esas cuatro marcas calcula el retardo y el desfase de su reloj.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '123'],
      ['Transporte', 'UDP'],
      ['Mensaje', '48 bytes, 4 marcas de tiempo'],
      ['Precisión', 'Milisegundos en Internet'],
      ['Especificación', 'RFC 5905'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'ntp', proto: 'NTP', info: 'Petición v4, modo cliente (T1)', size: '90 B', kind: 'req', note: 'El cliente envía la hora de salida T1.' },
      { t: 0.024, from: 'ntp', to: 'client', proto: 'NTP', info: 'Respuesta v4, modo servidor, estrato 2 (T2, T3)', size: '90 B', kind: 'res', note: 'El servidor añade T2 (llegada) y T3 (salida). El cliente anota T4 y calcula el desfase.' },
      { t: 64, from: 'client', to: 'ntp', proto: 'NTP', info: 'Petición v4, modo cliente (T1)', size: '90 B', kind: 'req', note: 'Cada 64 s (o más) repite la consulta para corregir la deriva del reloj.' },
      { t: 64.023, from: 'ntp', to: 'client', proto: 'NTP', info: 'Respuesta v4, modo servidor, estrato 2 (T2, T3)', size: '90 B', kind: 'res', note: 'Nuevas marcas: el reloj se ajusta suavemente, sin saltos.' },
    ],
  },
  {
    id: 'imap',
    name: 'IMAP',
    full: 'Protocolo de acceso a mensajes de Internet',
    layer: 7,
    description:
      'IMAP permite leer el correo que se queda guardado en el servidor, sincronizado entre todos tus dispositivos. Cada orden del cliente lleva una etiqueta (a1, a2…) y el servidor responde con líneas de datos y un resultado OK, NO o BAD con la misma etiqueta.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '143 (993 con TLS)'],
      ['Transporte', 'TCP'],
      ['Formato', 'Órdenes de texto con etiqueta'],
      ['Frente a POP3', 'El correo se queda en el servidor'],
      ['Especificación', 'RFC 9051'],
    ],
    packets: [
      ...tcpHandshake('mail', 143, 0),
      { t: 0.04, from: 'mail', to: 'client', proto: 'IMAP', info: '* OK IMAP4rev2 listo', size: '84 B', kind: 'res', note: 'Saludo inicial sin etiqueta (*).' },
      { t: 0.042, from: 'client', to: 'mail', proto: 'IMAP', info: 'a1 LOGIN david ********', size: '86 B', kind: 'req', note: 'El cliente se autentica (en la práctica, siempre dentro de TLS).' },
      { t: 0.06, from: 'mail', to: 'client', proto: 'IMAP', info: 'a1 OK LOGIN completado', size: '78 B', kind: 'res', note: 'La etiqueta a1 indica a qué orden responde.' },
      { t: 0.062, from: 'client', to: 'mail', proto: 'IMAP', info: 'a2 SELECT INBOX', size: '72 B', kind: 'req', note: 'Abre la bandeja de entrada.' },
      { t: 0.08, from: 'mail', to: 'client', proto: 'IMAP', info: '* 12 EXISTS · a2 OK [READ-WRITE]', size: '210 B', kind: 'res', note: 'Hay 12 mensajes; el buzón se abre en modo lectura y escritura.' },
      { t: 0.082, from: 'client', to: 'mail', proto: 'IMAP', info: 'a3 FETCH 12 BODY[]', size: '74 B', kind: 'req', note: 'Pide el mensaje número 12 completo.' },
      { t: 0.101, from: 'mail', to: 'client', proto: 'IMAP', info: '* 12 FETCH (BODY[] {3412}) · a3 OK', size: '3.5 KB', kind: 'res', note: 'Llega el mensaje con su tamaño exacto entre llaves.' },
    ],
  },
  {
    id: 'bgp',
    name: 'BGP',
    full: 'Protocolo de pasarela de frontera',
    layer: 7,
    description:
      'BGP es el sistema postal entre redes: cada sistema autónomo (AS) anuncia a sus vecinos qué bloques de direcciones puede alcanzar y por qué camino. Así se construye el mapa de rutas de todo Internet.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '179'],
      ['Transporte', 'TCP'],
      ['Mensajes', 'OPEN, UPDATE, KEEPALIVE, NOTIFICATION'],
      ['Decisión', 'Por políticas y AS_PATH'],
      ['Especificación', 'RFC 4271'],
    ],
    packets: [
      ...tcpHandshake('transit', 179, 0, 'isp', 40112),
      { t: 0.04, from: 'isp', to: 'transit', proto: 'BGP', info: 'OPEN AS 64500, Hold 90 s', size: '119 B', kind: 'req', note: 'Cada router se presenta con su número de AS y el tiempo de espera.' },
      { t: 0.041, from: 'transit', to: 'isp', proto: 'BGP', info: 'OPEN AS 64510, Hold 90 s', size: '119 B', kind: 'res', note: 'El vecino hace lo mismo.' },
      { t: 0.058, from: 'isp', to: 'transit', proto: 'BGP', info: 'KEEPALIVE', size: '73 B', kind: 'ctrl', note: 'Un KEEPALIVE confirma el OPEN: la sesión pasa a Established.' },
      { t: 0.06, from: 'isp', to: 'transit', proto: 'BGP', info: 'UPDATE 203.0.113.0/24 AS_PATH 64500', size: '102 B', kind: 'req', note: 'El ISP anuncia que puede alcanzar la red 203.0.113.0/24.' },
      { t: 0.08, from: 'transit', to: 'isp', proto: 'BGP', info: 'UPDATE 0.0.0.0/0 AS_PATH 64510', size: '98 B', kind: 'res', note: 'El tránsito ofrece una ruta por defecto hacia el resto de Internet.' },
      { t: 30.0, from: 'transit', to: 'isp', proto: 'BGP', info: 'KEEPALIVE', size: '73 B', kind: 'ctrl', note: 'Cada 30 s se envía un KEEPALIVE; si faltan 90 s, la sesión cae.' },
    ],
  },
  {
    id: 'wireguard',
    name: 'WireGuard',
    full: 'Túnel VPN moderno',
    layer: 3,
    description:
      'WireGuard crea un túnel cifrado entre dos equipos. Un saludo de solo dos mensajes acuerda claves con Curve25519; después, cada paquete IP original viaja cifrado dentro de un datagrama UDP. Si no hay tráfico, no envía nada.',
    facts: [
      ['Capa', 'Red (túnel de capa 3)'],
      ['Puerto', '51820/UDP (configurable)'],
      ['Transporte', 'UDP'],
      ['Criptografía', 'Curve25519, ChaCha20-Poly1305'],
      ['Saludo', '1 viaje de ida y vuelta'],
      ['Código', '~4 000 líneas en el kernel'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'vpn', proto: 'WireGuard', info: 'Handshake Initiation, sender=0x5a1c', size: '190 B', kind: 'tls', note: 'El cliente envía su clave efímera y su identidad cifrada.' },
      { t: 0.021, from: 'vpn', to: 'client', proto: 'WireGuard', info: 'Handshake Response, receiver=0x5a1c', size: '134 B', kind: 'tls', note: 'El servidor responde; ambos derivan las mismas claves de sesión.' },
      { t: 0.022, from: 'client', to: 'vpn', proto: 'WireGuard', info: 'Transport Data, counter=0', size: '138 B', kind: 'req', note: 'Un paquete IP del cliente viaja cifrado dentro del túnel.' },
      { t: 0.043, from: 'vpn', to: 'client', proto: 'WireGuard', info: 'Transport Data, counter=0', size: '1.4 KB', kind: 'res', note: 'La respuesta vuelve por el túnel; el contador impide repeticiones.' },
      { t: 25.0, from: 'client', to: 'vpn', proto: 'WireGuard', info: 'Keepalive (vacío)', size: '74 B', kind: 'ctrl', note: 'Un keepalive opcional mantiene abierta la ruta a través del NAT.' },
    ],
  },
]

export const PROTOCOLS: Protocol[] = [...BASE_PROTOCOLS, ...MORE_PROTOCOLS, ...MORE_PROTOCOLS_2, ...MORE_PROTOCOLS_3]

const routeCache = new Map<string, NodeId[]>()

/** Shortest path between two nodes over LINKS (BFS), cached: the topology never changes. */
export function route(from: NodeId, to: NodeId): NodeId[] {
  const key = `${from}>${to}`
  let hit = routeCache.get(key)
  if (!hit) routeCache.set(key, (hit = bfs(from, to)))
  return hit
}

function bfs(from: NodeId, to: NodeId): NodeId[] {
  const prev = new Map<NodeId, NodeId | null>([[from, null]])
  const queue: NodeId[] = [from]
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === to) break
    for (const [a, b] of LINKS) {
      const next = a === cur ? b : b === cur ? a : null
      if (next && !prev.has(next)) {
        prev.set(next, cur)
        queue.push(next)
      }
    }
  }
  const path: NodeId[] = []
  for (let n: NodeId | null | undefined = to; n; n = prev.get(n)) path.unshift(n)
  return path
}

const nodesCache = new WeakMap<Protocol, Set<NodeId>>()

/** Every node any packet of the protocol passes through (cached per protocol). */
export function nodesFor(p: Protocol): Set<NodeId> {
  let hit = nodesCache.get(p)
  if (!hit) {
    hit = new Set<NodeId>()
    for (const pk of p.packets) for (const n of route(pk.from, pk.to)) hit.add(n)
    nodesCache.set(p, hit)
  }
  return hit
}

export function addrOf(id: NodeId): string {
  if (NODES[id].kind === 'switch') return 'Difusión'
  return NODES[id].addr || NODES[id].label
}
