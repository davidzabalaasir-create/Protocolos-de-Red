// CCNA cheat sheet: the tables worth memorising, and the flashcards built from them.
// Cell text is mostly language-neutral; Spanish strings are translated through t()
// (reference.test.ts checks every Spanish string has an English entry).

export interface RefRow {
  c: string[]
  /** lesson id: the first cell links to that lesson */
  lesson?: string
}

export interface RefTable {
  id: string
  title: string
  cols: string[]
  rows: RefRow[]
  note?: string
}

export interface RefCard {
  id: string
  /** table the card belongs to (for the topic filter) */
  topic: string
  /** Spanish question template for t() */
  q: string
  v?: Record<string, string | number>
  /** answer; also run through t() for the few Spanish ones */
  a: string
}

export const REF_TABLES: RefTable[] = [
  {
    id: 'puertos',
    title: 'Puertos conocidos',
    cols: ['Protocolo', 'Puerto', 'Transporte'],
    rows: [
      { c: ['FTP (control / datos)', '21 / 20', 'TCP'], lesson: 'ftp' },
      { c: ['SSH', '22', 'TCP'], lesson: 'ssh' },
      { c: ['Telnet', '23', 'TCP'], lesson: 'telnet' },
      { c: ['SMTP', '25', 'TCP'], lesson: 'smtp' },
      { c: ['DNS', '53', 'UDP y TCP'], lesson: 'dns' },
      { c: ['DHCP (servidor / cliente)', '67 / 68', 'UDP'], lesson: 'dhcp' },
      { c: ['TFTP', '69', 'UDP'], lesson: 'tftp' },
      { c: ['HTTP', '80', 'TCP'], lesson: 'http' },
      { c: ['POP3', '110', 'TCP'], lesson: 'pop3' },
      { c: ['NTP', '123', 'UDP'], lesson: 'ntp' },
      { c: ['IMAP', '143', 'TCP'], lesson: 'imap' },
      { c: ['SNMP (agente / traps)', '161 / 162', 'UDP'], lesson: 'snmp' },
      { c: ['HTTPS', '443', 'TCP'], lesson: 'https' },
      { c: ['Syslog', '514', 'UDP'], lesson: 'syslog' },
      { c: ['RADIUS (autenticación / cuentas)', '1812 / 1813', 'UDP'], lesson: 'dot1x' },
      { c: ['RDP', '3389', 'TCP'] },
    ],
  },
  {
    id: 'ad',
    title: 'Distancias administrativas',
    cols: ['Origen de la ruta', 'Distancia'],
    rows: [
      { c: ['Conectada', '0'] },
      { c: ['Estática', '1'] },
      { c: ['eBGP', '20'], lesson: 'bgp' },
      { c: ['EIGRP (interna)', '90'] },
      { c: ['OSPF', '110'], lesson: 'ospf' },
      { c: ['IS-IS', '115'] },
      { c: ['RIPv2', '120'], lesson: 'rip' },
      { c: ['EIGRP (externa)', '170'] },
      { c: ['iBGP', '200'] },
      { c: ['Desconocida (no se instala)', '255'] },
    ],
    note: 'Gana la ruta más específica (prefijo más largo); a igual prefijo, la de menor distancia administrativa; a igual distancia, la de menor métrica.',
  },
  {
    id: 'rangos',
    title: 'Rangos IPv4 especiales',
    cols: ['Rango', 'Uso'],
    rows: [
      { c: ['10.0.0.0/8', 'Privada (RFC 1918)'], lesson: 'nat' },
      { c: ['172.16.0.0/12', 'Privada (RFC 1918)'] },
      { c: ['192.168.0.0/16', 'Privada (RFC 1918)'] },
      { c: ['169.254.0.0/16', 'Enlace local (APIPA)'] },
      { c: ['127.0.0.0/8', 'Loopback'] },
      { c: ['100.64.0.0/10', 'CGNAT (RFC 6598)'] },
      { c: ['192.0.2.0/24 · 198.51.100.0/24 · 203.0.113.0/24', 'Documentación (RFC 5737)'] },
      { c: ['224.0.0.0/4', 'Multicast (clase D)'], lesson: 'igmp' },
      { c: ['240.0.0.0/4', 'Experimental (clase E)'] },
      { c: ['255.255.255.255', 'Difusión limitada'] },
    ],
    note: 'Clases: A 1–126 (/8, 255.0.0.0) · B 128–191 (/16, 255.255.0.0) · C 192–223 (/24, 255.255.255.0).',
  },
  {
    id: 'ipv6',
    title: 'Direcciones IPv6',
    cols: ['Prefijo o dirección', 'Uso'],
    rows: [
      { c: ['2000::/3', 'Unicast global'], lesson: 'ipv6' },
      { c: ['FE80::/10', 'Enlace local (link-local)'] },
      { c: ['FC00::/7', 'Única local (ULA)'] },
      { c: ['FF00::/8', 'Multicast'] },
      { c: ['::1/128', 'Loopback'] },
      { c: ['::', 'Sin especificar'] },
      { c: ['2001:db8::/32', 'Documentación (RFC 3849)'] },
      { c: ['FF02::1', 'Todos los nodos'] },
      { c: ['FF02::2', 'Todos los routers'] },
      { c: ['FF02::5 y FF02::6', 'OSPFv3 (todos / DR y BDR)'] },
      { c: ['FF02::1:FF00:0/104', 'Nodo solicitado (NDP)'] },
    ],
  },
  {
    id: 'cabeceras',
    title: 'Cabeceras y tamaños',
    cols: ['Cabecera', 'Tamaño'],
    rows: [
      { c: ['Ethernet II', '14 B (+ 4 B de FCS)'], lesson: 'ethernet' },
      { c: ['Etiqueta 802.1Q', '+ 4 B'], lesson: 'vlan' },
      { c: ['IPv4', '20 B (sin opciones)'], lesson: 'ipv4' },
      { c: ['IPv6', '40 B (fija)'], lesson: 'ipv6' },
      { c: ['TCP', '20 B (sin opciones)'], lesson: 'tcp' },
      { c: ['UDP', '8 B'], lesson: 'udp' },
      { c: ['ICMP', '8 B'], lesson: 'icmp' },
    ],
    note: 'MTU de Ethernet: 1500 B. Trama máxima: 1518 B (1522 B con 802.1Q). MSS típico de TCP: 1460 B.',
  },
  {
    id: 'numeros',
    title: 'EtherTypes y números de protocolo',
    cols: ['Valor', 'Protocolo', 'Dónde'],
    rows: [
      { c: ['0x0800', 'IPv4', 'EtherType'], lesson: 'ipv4' },
      { c: ['0x0806', 'ARP', 'EtherType'], lesson: 'arp' },
      { c: ['0x86DD', 'IPv6', 'EtherType'], lesson: 'ipv6' },
      { c: ['0x8100', '802.1Q', 'EtherType'], lesson: 'vlan' },
      { c: ['0x88CC', 'LLDP', 'EtherType'], lesson: 'lldp' },
      { c: ['0x888E', 'EAPOL (802.1X)', 'EtherType'], lesson: 'dot1x' },
      { c: ['1', 'ICMP', 'Protocolo IP'], lesson: 'icmp' },
      { c: ['2', 'IGMP', 'Protocolo IP'], lesson: 'igmp' },
      { c: ['6', 'TCP', 'Protocolo IP'], lesson: 'tcp' },
      { c: ['17', 'UDP', 'Protocolo IP'], lesson: 'udp' },
      { c: ['47', 'GRE', 'Protocolo IP'], lesson: 'gre' },
      { c: ['50', 'ESP (IPsec)', 'Protocolo IP'], lesson: 'ipsec' },
      { c: ['51', 'AH (IPsec)', 'Protocolo IP'] },
      { c: ['58', 'ICMPv6', 'Protocolo IP'] },
      { c: ['88', 'EIGRP', 'Protocolo IP'] },
      { c: ['89', 'OSPF', 'Protocolo IP'], lesson: 'ospf' },
      { c: ['112', 'VRRP', 'Protocolo IP'], lesson: 'vrrp' },
    ],
  },
  {
    id: 'temporizadores',
    title: 'Temporizadores y valores por defecto',
    cols: ['Protocolo', 'Valores por defecto'],
    rows: [
      { c: ['STP', 'hello 2 s · forward delay 15 s · max age 20 s'], lesson: 'stp' },
      { c: ['STP (prioridad de puente)', '32768, en pasos de 4096'] },
      { c: ['STP (coste clásico)', '10 M = 100 · 100 M = 19 · 1 G = 4 · 10 G = 2'] },
      { c: ['OSPF', 'hello 10 s · dead 40 s (redes broadcast)'], lesson: 'ospf' },
      { c: ['OSPF (coste)', '100 Mb/s de referencia ÷ ancho de banda'] },
      { c: ['EIGRP', 'hello 5 s · hold 15 s'] },
      { c: ['HSRP', 'hello 3 s · hold 10 s · prioridad 100'] },
      { c: ['VRRP', 'anuncio 1 s · prioridad 100'], lesson: 'vrrp' },
      { c: ['RIPv2', 'actualización 30 s · invalid 180 s'], lesson: 'rip' },
    ],
  },
  {
    id: 'multicast',
    title: 'Direcciones multicast IPv4',
    cols: ['Dirección', 'Quién escucha'],
    rows: [
      { c: ['224.0.0.1', 'Todos los equipos'] },
      { c: ['224.0.0.2', 'Todos los routers'] },
      { c: ['224.0.0.5', 'OSPF (todos)'], lesson: 'ospf' },
      { c: ['224.0.0.6', 'OSPF (DR y BDR)'] },
      { c: ['224.0.0.9', 'RIPv2'], lesson: 'rip' },
      { c: ['224.0.0.10', 'EIGRP'] },
      { c: ['224.0.0.13', 'PIM'] },
      { c: ['224.0.0.18', 'VRRP'], lesson: 'vrrp' },
      { c: ['224.0.0.251', 'mDNS'], lesson: 'mdns' },
      { c: ['239.255.255.250', 'SSDP / UPnP'], lesson: 'ssdp' },
    ],
  },
  {
    id: 'icmp',
    title: 'Tipos ICMP e ICMPv6',
    cols: ['Tipo', 'Significado'],
    rows: [
      { c: ['0', 'Respuesta de eco (echo reply)'], lesson: 'icmp' },
      { c: ['3', 'Destino inalcanzable (código 3: puerto)'], lesson: 'icmp' },
      { c: ['5', 'Redirección'] },
      { c: ['8', 'Petición de eco (echo request)'], lesson: 'icmp' },
      { c: ['11', 'Tiempo agotado (TTL)'], lesson: 'traceroute' },
      { c: ['128 / 129', 'ICMPv6: eco (petición / respuesta)'], lesson: 'ipv6' },
      { c: ['133 / 134', 'ICMPv6, NDP: RS / RA (routers)'], lesson: 'ipv6' },
      { c: ['135 / 136', 'ICMPv6, NDP: NS / NA (vecinos)'], lesson: 'ipv6' },
    ],
  },
  {
    id: 'mascaras',
    title: 'Máscaras y hosts',
    cols: ['Prefijo', 'Máscara', 'Hosts útiles', 'Salto'],
    rows: [
      { c: ['/22', '255.255.252.0', '1022', '4'] },
      { c: ['/23', '255.255.254.0', '510', '2'] },
      { c: ['/24', '255.255.255.0', '254', '1'] },
      { c: ['/25', '255.255.255.128', '126', '128'] },
      { c: ['/26', '255.255.255.192', '62', '64'] },
      { c: ['/27', '255.255.255.224', '30', '32'] },
      { c: ['/28', '255.255.255.240', '14', '16'] },
      { c: ['/29', '255.255.255.248', '6', '8'] },
      { c: ['/30', '255.255.255.252', '2', '4'] },
      { c: ['/31', '255.255.255.254', '2 (punto a punto)', '2'] },
      { c: ['/32', '255.255.255.255', '1 (un host)', '1'] },
    ],
    note: 'El salto es el tamaño de bloque en el octeto interesante (256 − el octeto de la máscara). Practica en la sección de Subneteo.',
  },
  {
    id: 'osi',
    title: 'Modelo OSI y PDU',
    cols: ['Capa', 'Nombre', 'PDU', 'Equipo típico'],
    rows: [
      { c: ['7', 'Aplicación', 'Datos', '—'] },
      { c: ['6', 'Presentación', 'Datos', '—'] },
      { c: ['5', 'Sesión', 'Datos', '—'] },
      { c: ['4', 'Transporte', 'Segmento (TCP) / datagrama (UDP)', '—'] },
      { c: ['3', 'Red', 'Paquete', 'Router'] },
      { c: ['2', 'Enlace de datos', 'Trama', 'Switch'] },
      { c: ['1', 'Física', 'Bits', 'Hub, cables'] },
    ],
  },
  {
    id: 'wifi',
    title: 'Wi-Fi: estándares y canales',
    cols: ['Estándar', 'Banda', 'Nombre comercial'],
    rows: [
      { c: ['802.11b', '2,4 GHz', '—'], lesson: 'wifi' },
      { c: ['802.11g', '2,4 GHz', '—'] },
      { c: ['802.11a', '5 GHz', '—'] },
      { c: ['802.11n', '2,4 y 5 GHz', 'Wi-Fi 4'] },
      { c: ['802.11ac', '5 GHz', 'Wi-Fi 5'] },
      { c: ['802.11ax', '2,4, 5 y 6 GHz', 'Wi-Fi 6 / 6E'] },
    ],
    note: 'Canales sin solape en 2,4 GHz: 1, 6 y 11.',
  },
]

// ── flashcards ───────────────────────────────────────────────────────
const CARDS: RefCard[] = []
const add = (id: string, topic: string, q: string, v: Record<string, string | number> | undefined, a: string) => CARDS.push({ id, topic, q, v, a })

// ports: one per protocol, plus the reverse for the single-number ones
for (const r of REF_TABLES[0].rows) {
  const [name, port, transport] = r.c
  const key = (r.lesson ?? name.toLowerCase()).replace(/[^a-z0-9]/g, '')
  add(`puertos:${key}`, 'puertos', '¿Qué puerto usa {p}?', { p: name }, `${port} (${transport})`)
  if (/^\d+$/.test(port)) add(`puertos:n${port}`, 'puertos', '¿Qué protocolo escucha en el puerto {n}?', { n: port }, `${name} (${transport})`)
}

for (const r of REF_TABLES[1].rows) add(`ad:${r.c[1]}`, 'ad', '¿Qué distancia administrativa tiene una ruta de tipo «{p}»?', { p: r.c[0] }, r.c[1])

for (const r of REF_TABLES[2].rows) add(`rangos:${r.c[0].split(' ')[0]}`, 'rangos', '¿Para qué se usa el rango {r}?', { r: r.c[0] }, r.c[1])
add('rangos:rfc1918', 'rangos', '¿Cuáles son los tres rangos privados (RFC 1918)?', undefined, '10.0.0.0/8 · 172.16.0.0/12 · 192.168.0.0/16')
add('rangos:claseA', 'rangos', '¿Qué máscara por defecto tiene una dirección de clase A?', undefined, '255.0.0.0 (/8)')
add('rangos:claseB', 'rangos', '¿Qué máscara por defecto tiene una dirección de clase B?', undefined, '255.255.0.0 (/16)')
add('rangos:claseC', 'rangos', '¿Qué máscara por defecto tiene una dirección de clase C?', undefined, '255.255.255.0 (/24)')

for (const r of REF_TABLES[3].rows) add(`ipv6:${r.c[0].replace(/[^a-z0-9]/gi, '')}`, 'ipv6', '¿Qué es {r} en IPv6?', { r: r.c[0] }, r.c[1])

for (const r of REF_TABLES[4].rows) add(`cabeceras:${r.c[0].replace(/[^a-z0-9]/gi, '')}`, 'cabeceras', '¿Cuánto mide la cabecera de {h}?', { h: r.c[0] }, r.c[1])
add('cabeceras:mtu', 'cabeceras', '¿Cuál es la MTU de Ethernet?', undefined, '1500 B')
add('cabeceras:mss', 'cabeceras', 'Con MTU 1500, ¿qué MSS típico queda para TCP?', undefined, '1460 B (1500 − 20 de IPv4 − 20 de TCP)')

for (const r of REF_TABLES[5].rows)
  add(`numeros:${r.c[0]}`, 'numeros', r.c[2] === 'EtherType' ? '¿Qué EtherType identifica {p}?' : '¿Qué número de protocolo IP usa {p}?', { p: r.c[1] }, r.c[0])

for (const r of REF_TABLES[6].rows) add(`temporizadores:${r.c[0].replace(/[^a-z0-9]/gi, '')}`, 'temporizadores', '¿Qué valores por defecto usa {p}?', { p: r.c[0] }, r.c[1])

for (const r of REF_TABLES[7].rows) {
  add(`multicast:${r.c[0]}`, 'multicast', '¿Quién escucha en {ip}?', { ip: r.c[0] }, r.c[1])
  add(`multicast:r${r.c[0]}`, 'multicast', '¿Qué dirección multicast usa «{p}»?', { p: r.c[1] }, r.c[0])
}

for (const r of REF_TABLES[8].rows) add(`icmp:${r.c[0].replace(/[^0-9]/g, '-')}`, 'icmp', '¿Qué significa el tipo ICMP {n}?', { n: r.c[0] }, r.c[1])

for (const r of REF_TABLES[9].rows) {
  add(`mascaras:m${r.c[0]}`, 'mascaras', '¿Qué máscara corresponde a {p}?', { p: r.c[0] }, r.c[1])
  add(`mascaras:h${r.c[0]}`, 'mascaras', '¿Cuántos hosts útiles tiene una red {p}?', { p: r.c[0] }, r.c[2])
}

for (const r of REF_TABLES[10].rows.filter((x) => Number(x.c[0]) <= 4)) add(`osi:${r.c[0]}`, 'osi', '¿Cómo se llama la PDU de la capa {n} ({name})?', { n: r.c[0], name: r.c[1] }, r.c[2])
add('osi:router', 'osi', '¿En qué capa OSI trabaja un router?', undefined, 'Capa 3 (red): decide por IP')
add('osi:switch', 'osi', '¿En qué capa OSI trabaja un switch?', undefined, 'Capa 2 (enlace): decide por MAC')

for (const r of REF_TABLES[11].rows) add(`wifi:${r.c[0].replace(/[^a-z0-9]/gi, '')}`, 'wifi', '¿Qué banda usa {s}?', { s: r.c[0] }, r.c[1])
add('wifi:canales', 'wifi', '¿Qué canales de 2,4 GHz no se solapan?', undefined, '1, 6 y 11')
add('wifi:wifi6', 'wifi', '¿Qué estándar es «Wi-Fi 6»?', undefined, '802.11ax')

export const REF_CARDS: RefCard[] = CARDS
