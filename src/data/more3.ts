import type { Protocol } from './protocols'

const MDNS = '224.0.0.251'
const SSDP = '239.255.255.250'

/** Fourth expansion: local discovery, gateway redundancy, routing, tunnels, logging and wake-up. */
export const MORE_PROTOCOLS_3: Protocol[] = [
  {
    id: 'mdns',
    name: 'mDNS',
    full: 'DNS multidifusión (Bonjour, Avahi)',
    layer: 7,
    description:
      'En casa no hay un servidor DNS que conozca «impresora.local». Con mDNS cada equipo pregunta a toda la red local por multidifusión y el dueño del nombre contesta él mismo. Junto con DNS-SD sirve también para descubrir servicios, como impresoras o altavoces, sin configurar nada.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '5353'],
      ['Transporte', 'UDP multidifusión'],
      ['Dirección', '224.0.0.251 (ff02::fb en IPv6)'],
      ['Dominio', '.local'],
      ['Especificación', 'RFC 6762, RFC 6763'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'printer', proto: 'mDNS', info: 'Consulta A impresora.local', size: '76 B', kind: 'req', note: 'El portátil pregunta a toda la red: ¿quién es impresora.local?', dstIp: MDNS },
      { t: 0.004, from: 'printer', to: 'client', proto: 'mDNS', info: 'Respuesta impresora.local A 192.168.1.50', size: '92 B', kind: 'res', note: 'La propia impresora contesta, también por multidifusión, para que todos lo apunten en su caché.', dstIp: MDNS },
      { t: 1, from: 'client', to: 'printer', proto: 'mDNS', info: 'Consulta PTR _ipp._tcp.local', size: '78 B', kind: 'req', note: 'Ahora busca servicios: ¿quién imprime por IPP en esta red?', dstIp: MDNS },
      { t: 1.005, from: 'printer', to: 'client', proto: 'mDNS', info: 'Respuesta PTR _ipp._tcp.local → impresora.local', size: '210 B', kind: 'res', note: 'La impresora anuncia su servicio; el sistema ya la muestra en la lista sin configurar nada.', dstIp: MDNS },
    ],
  },
  {
    id: 'ssdp',
    name: 'SSDP / UPnP',
    full: 'Descubrimiento de dispositivos multimedia',
    layer: 7,
    description:
      'SSDP es cómo el móvil encuentra la tele para enviarle un vídeo. Lanza un M-SEARCH por multidifusión; los dispositivos responden con la dirección de un documento XML que describe qué saben hacer. Los mensajes tienen formato HTTP pero viajan por UDP.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '1900'],
      ['Transporte', 'UDP multidifusión'],
      ['Dirección', '239.255.255.250'],
      ['Mensajes', 'M-SEARCH, NOTIFY, respuestas 200'],
      ['Base de', 'UPnP y DLNA'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'tv', proto: 'SSDP', info: 'M-SEARCH * HTTP/1.1 · ST: ssdp:all', size: '167 B', kind: 'req', note: 'El portátil pregunta a la red: ¿qué dispositivos UPnP hay aquí?', dstIp: SSDP },
      { t: 0.12, from: 'tv', to: 'client', proto: 'SSDP', info: 'HTTP/1.1 200 OK · LOCATION: http://192.168.1.30:49152/desc.xml', size: '310 B', kind: 'res', note: 'La tele responde directamente con la dirección de su descripción.' },
      { t: 0.2, from: 'client', to: 'tv', proto: 'HTTP', info: '52344 → 49152 GET /desc.xml HTTP/1.1', size: '180 B', kind: 'req', note: 'El portátil descarga la descripción para saber qué servicios ofrece.' },
      { t: 0.23, from: 'tv', to: 'client', proto: 'HTTP', info: '49152 → 52344 HTTP/1.1 200 OK (text/xml)', size: '2.4 KB', kind: 'res', note: 'XML con el modelo y sus servicios, por ejemplo reproducir contenido.' },
      { t: 30, from: 'tv', to: 'client', proto: 'SSDP', info: 'NOTIFY * HTTP/1.1 · NTS: ssdp:alive', size: '330 B', kind: 'ctrl', note: 'Cada cierto tiempo la tele anuncia por su cuenta que sigue disponible.', dstIp: SSDP },
    ],
  },
  {
    id: 'lldp',
    name: 'LLDP',
    full: 'Descubrimiento de vecinos en la capa de enlace',
    layer: 2,
    description:
      'LLDP permite a switches, teléfonos y puntos de acceso presentarse a sus vecinos directos: nombre, puerto, capacidades y dirección de gestión. Así un administrador puede dibujar el mapa de la red sin seguir cables con la mano.',
    facts: [
      ['Capa', 'Enlace de datos (capa 2)'],
      ['EtherType', '0x88cc'],
      ['Destino', '01:80:c2:00:00:0e'],
      ['Formato', 'TLV: tipo, longitud, valor'],
      ['Intervalo', '30 s, válido 120 s'],
      ['Especificación', 'IEEE 802.1AB'],
    ],
    packets: [
      { t: 0, from: 'switch', to: 'switch2', proto: 'LLDP', info: 'LLDPDU sistema=switch-1 puerto=Gi0/24', size: '120 B', kind: 'ctrl', note: 'El switch 1 se presenta: «soy switch-1 y te hablo desde mi puerto Gi0/24».' },
      { t: 0.4, from: 'switch2', to: 'switch', proto: 'LLDP', info: 'LLDPDU sistema=switch-2 puerto=Gi0/1', size: '118 B', kind: 'ctrl', note: 'El vecino hace lo mismo: ya saben quién está al otro lado del cable.' },
      { t: 30, from: 'switch', to: 'switch2', proto: 'LLDP', info: 'LLDPDU sistema=switch-1 puerto=Gi0/24', size: '120 B', kind: 'ctrl', note: 'Se repite cada 30 s; si deja de llegar, el vecino se borra a los 120 s.' },
    ],
  },
  {
    id: 'vrrp',
    name: 'VRRP',
    full: 'Redundancia de la puerta de enlace',
    layer: 3,
    description:
      'Si el router de la red se estropea, nadie sale a Internet. Con VRRP dos routers comparten una IP virtual: el de mayor prioridad la atiende y anuncia que sigue vivo. Si sus anuncios dejan de llegar, el de respaldo toma la IP en un segundo, sin que los equipos cambien nada.',
    facts: [
      ['Capa', 'Red (capa 3)'],
      ['Protocolo IP', '112'],
      ['Dirección', '224.0.0.18'],
      ['IP virtual', '192.168.1.254 (la puerta de enlace)'],
      ['Anuncios', 'Cada 1 s, TTL 255'],
      ['Especificación', 'RFC 9568'],
    ],
    packets: [
      { t: 0, from: 'router', to: 'router2', proto: 'VRRP', info: 'Anuncio VRID 1 prioridad 120 IP 192.168.1.254', size: '60 B', kind: 'ctrl', note: 'El router principal (prioridad 120) anuncia que atiende la IP virtual.', dstIp: '224.0.0.18' },
      { t: 1, from: 'router', to: 'router2', proto: 'VRRP', info: 'Anuncio VRID 1 prioridad 120 IP 192.168.1.254', size: '60 B', kind: 'ctrl', note: 'Un anuncio por segundo: el respaldo se queda escuchando.', dstIp: '224.0.0.18' },
      { t: 4.6, from: 'router2', to: 'client', proto: 'VRRP', info: 'Anuncio VRID 1 prioridad 100 IP 192.168.1.254 (nuevo maestro)', size: '60 B', kind: 'err', note: 'Tras unos 3,6 s sin anuncios, el router de respaldo se declara maestro y atiende la IP virtual.', dstIp: '224.0.0.18' },
      { t: 4.7, from: 'client', to: 'router2', proto: 'DNS', info: 'Consulta A www.ejemplo.com', size: '75 B', kind: 'req', note: 'El portátil sigue usando la misma puerta de enlace; ahora la atiende el router de respaldo.', dstIp: '8.8.8.8' },
    ],
  },
  {
    id: 'rip',
    name: 'RIP',
    full: 'Protocolo de información de enrutamiento',
    layer: 3,
    description:
      'RIP es el protocolo de enrutamiento más sencillo: cada router envía a sus vecinos su tabla entera cada 30 segundos y cuenta la distancia en saltos. Una ruta con 16 saltos significa «inalcanzable», lo que limita RIP a redes pequeñas.',
    facts: [
      ['Capa', 'Red (enrutamiento sobre UDP 520)'],
      ['Dirección', '224.0.0.9 (RIPv2)'],
      ['Métrica', 'Saltos, máximo 15'],
      ['Actualizaciones', 'Tabla completa cada 30 s'],
      ['Tipo', 'Vector de distancias'],
      ['Especificación', 'RFC 2453'],
    ],
    packets: [
      { t: 0, from: 'router', to: 'core', proto: 'RIP', info: 'Petición: tabla completa', size: '66 B', kind: 'req', note: 'Al arrancar, el router pide a sus vecinos toda su tabla.', dstIp: '224.0.0.9' },
      { t: 0.01, from: 'core', to: 'router', proto: 'RIP', info: 'Respuesta 10.0.0.0/8 métrica 1', size: '66 B', kind: 'res', note: 'El vecino anuncia que llega a 10.0.0.0/8 en 1 salto.', dstIp: '224.0.0.9' },
      { t: 0.02, from: 'router', to: 'core', proto: 'RIP', info: 'Respuesta 192.168.1.0/24 métrica 1', size: '66 B', kind: 'res', note: 'Y él anuncia su red local; cada uno suma 1 salto a lo que aprende.', dstIp: '224.0.0.9' },
      { t: 30, from: 'core', to: 'router', proto: 'RIP', info: 'Respuesta 10.0.0.0/8 métrica 1', size: '66 B', kind: 'ctrl', note: 'Cada 30 s se repite la tabla, aunque nada haya cambiado.', dstIp: '224.0.0.9' },
      { t: 47, from: 'core', to: 'router', proto: 'RIP', info: 'Respuesta 10.0.0.0/8 métrica 16', size: '66 B', kind: 'err', note: 'Métrica 16 = inalcanzable: la red se ha caído y se retira la ruta.', dstIp: '224.0.0.9' },
    ],
  },
  {
    id: 'gre',
    name: 'GRE',
    full: 'Encapsulado genérico de rutas (túneles)',
    layer: 3,
    description:
      'GRE mete un paquete IP completo dentro de otro para llevarlo por un túnel entre dos routers. No cifra nada: se usa para unir redes o transportar protocolos que de otro modo no cruzarían, y a menudo se combina con IPsec para protegerlo.',
    facts: [
      ['Capa', 'Red (capa 3)'],
      ['Protocolo IP', '47'],
      ['Cabecera', '4 bytes (más opciones)'],
      ['Cifrado', 'Ninguno'],
      ['Usos', 'Túneles entre sedes, PPTP, multidifusión por túnel'],
      ['Especificación', 'RFC 2784'],
    ],
    packets: [
      { t: 0, from: 'router', to: 'vpn', proto: 'GRE', info: 'GRE: IPv4 192.168.1.10 → 10.20.0.5 (ping)', size: '122 B', kind: 'req', note: 'El router mete el ping del portátil, tal cual, dentro de un paquete dirigido al otro extremo del túnel.' },
      { t: 0.021, from: 'vpn', to: 'router', proto: 'GRE', info: 'GRE: IPv4 10.20.0.5 → 192.168.1.10 (respuesta)', size: '122 B', kind: 'res', note: 'La respuesta vuelve encapsulada; al sacarla, la red remota parece estar al lado.' },
      { t: 10, from: 'router', to: 'vpn', proto: 'GRE', info: 'GRE keepalive', size: '62 B', kind: 'ctrl', note: 'Un keepalive comprueba que el túnel sigue funcionando.' },
    ],
  },
  {
    id: 'syslog',
    name: 'Syslog',
    full: 'Registro centralizado de eventos',
    layer: 7,
    description:
      'Routers, servidores y aplicaciones envían sus mensajes de registro a un servidor central con Syslog. Cada línea lleva una prioridad que combina de dónde viene (facility) y su gravedad, de 0 (emergencia) a 7 (depuración).',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '514 (6514 con TLS)'],
      ['Transporte', 'UDP (o TCP)'],
      ['Prioridad', 'facility × 8 + gravedad'],
      ['Gravedades', '0 emergencia … 7 depuración'],
      ['Especificación', 'RFC 5424'],
    ],
    packets: [
      { t: 0, from: 'router', to: 'logsrv', proto: 'Syslog', info: '<38>Nov 11 10:02:13 router sshd: acceso de admin desde 192.168.1.10', size: '110 B', kind: 'req', note: 'Prioridad 38 = facility 4 (auth) × 8 + gravedad 6 (informativo): alguien ha entrado.' },
      { t: 5, from: 'router', to: 'logsrv', proto: 'Syslog', info: '<28>Nov 11 10:02:18 router kernel: enlace eth1 caído', size: '96 B', kind: 'err', note: 'Prioridad 28 = facility 3 (daemon) × 8 + gravedad 4 (aviso): se ha caído un puerto.' },
      { t: 9, from: 'router', to: 'logsrv', proto: 'Syslog', info: '<30>Nov 11 10:02:22 router kernel: enlace eth1 activo', size: '94 B', kind: 'req', note: 'Gravedad 6 otra vez: el enlace ha vuelto. El servidor guarda todo con su hora.' },
    ],
  },
  {
    id: 'wol',
    name: 'Wake-on-LAN',
    full: 'Encender un equipo por la red',
    layer: 2,
    description:
      'Un equipo apagado no tiene IP, pero su tarjeta de red sigue escuchando. Wake-on-LAN envía por difusión un «paquete mágico»: seis bytes 0xFF seguidos de la MAC del equipo repetida 16 veces. Al reconocer su MAC, la tarjeta enciende el ordenador.',
    facts: [
      ['Capa', 'Enlace de datos (capa 2)'],
      ['Transporte', 'UDP a los puertos 7 o 9 (o Ethernet 0x0842)'],
      ['Destino', 'Difusión 255.255.255.255'],
      ['Contenido', '6 × 0xFF + 16 × MAC'],
      ['Requisito', 'Activado en la BIOS y la tarjeta'],
      ['Origen', 'AMD, 1995'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'filesrv', proto: 'Wake-on-LAN', info: 'Paquete mágico para el servidor de archivos', size: '144 B', kind: 'req', note: 'El portátil difunde el paquete mágico con la MAC del servidor, que está apagado.', dstIp: '255.255.255.255' },
      { t: 20, from: 'client', to: 'filesrv', proto: 'ICMP', info: 'Echo request id=1 seq=1 ttl=64', size: '98 B', kind: 'req', note: 'Unos segundos después, un ping para comprobar si ya ha arrancado.' },
      { t: 20.001, from: 'filesrv', to: 'client', proto: 'ICMP', info: 'Echo reply id=1 seq=1 ttl=64', size: '98 B', kind: 'res', note: 'Responde: el servidor está encendido y en la red.' },
    ],
  },
]
