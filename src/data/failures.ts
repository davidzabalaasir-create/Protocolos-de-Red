import { tcpHandshake } from './helpers'
import type { Protocol } from './protocols'

/** What happens when things go wrong: each lesson points at the normal one it breaks. */
export const FAILURE_PROTOCOLS: Protocol[] = [
  {
    id: 'tcp-loss',
    failureOf: 'tcp',
    name: 'TCP: pérdida y retransmisión',
    full: 'Cuando un segmento no llega',
    layer: 4,
    description:
      'Internet pierde paquetes a menudo. TCP lo detecta porque el receptor sigue pidiendo el byte que le falta: tres ACK duplicados seguidos hacen que el emisor reenvíe ese segmento sin esperar a que caduque el temporizador (retransmisión rápida).',
    facts: [
      ['Capa', 'Transporte (capa 4)'],
      ['Señal de pérdida', '3 ACK duplicados o fin del temporizador (RTO)'],
      ['Reacción', 'Retransmisión rápida'],
      ['Además', 'Reduce la ventana de congestión'],
      ['Mejora', 'SACK: indica qué bloques sí llegaron'],
      ['Especificación', 'RFC 5681, RFC 2018'],
    ],
    packets: [
      ...tcpHandshake('web', 80, 0),
      { t: 0.04, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [PSH, ACK] Seq=1 Ack=1 Len=1460', size: '1.5 KB', kind: 'req', note: 'Primer segmento con 1460 bytes: llega bien.' },
      { t: 0.041, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [PSH, ACK] Seq=1461 Ack=1 Len=1460 PERDIDO', size: '1.5 KB', kind: 'err', note: 'El segundo segmento se pierde por el camino.' },
      { t: 0.042, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [PSH, ACK] Seq=2921 Ack=1 Len=1460', size: '1.5 KB', kind: 'req', note: 'El tercero sí llega, pero fuera de orden: falta el hueco anterior.' },
      { t: 0.058, from: 'web', to: 'client', proto: 'TCP', info: '80 → 52344 [ACK] Seq=1 Ack=1461', size: '60 B', kind: 'tcp', note: 'El servidor confirma solo hasta el byte 1460: sigue esperando el 1461.' },
      { t: 0.059, from: 'web', to: 'client', proto: 'TCP', info: '80 → 52344 [ACK] Seq=1 Ack=1461 (duplicado)', size: '60 B', kind: 'ctrl', note: 'Al recibir más datos sin el hueco, repite el mismo ACK: un duplicado.' },
      { t: 0.06, from: 'web', to: 'client', proto: 'TCP', info: '80 → 52344 [ACK] Seq=1 Ack=1461 (duplicado)', size: '60 B', kind: 'ctrl', note: 'Tercer ACK igual: para el emisor es la señal de que algo se perdió.' },
      { t: 0.062, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 80 [PSH, ACK] Seq=1461 Ack=1 Len=1460 (retransmisión)', size: '1.5 KB', kind: 'req', note: 'Retransmisión rápida: el cliente reenvía el segmento perdido sin esperar al temporizador.' },
      { t: 0.079, from: 'web', to: 'client', proto: 'TCP', info: '80 → 52344 [ACK] Seq=1 Ack=4381', size: '60 B', kind: 'tcp', note: 'Con el hueco cubierto, el servidor confirma todo de golpe hasta el byte 4380.' },
    ],
  },
  {
    id: 'dns-nxdomain',
    failureOf: 'dns',
    name: 'DNS: dominio inexistente',
    full: 'Cuando el nombre no existe',
    layer: 7,
    description:
      'Si escribes mal un dominio, la consulta recorre la jerarquía igual que siempre, pero el servidor responsable contesta NXDOMAIN: «ese nombre no existe». El resolutor guarda también esa respuesta negativa durante un tiempo para no repetir la búsqueda.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Código de respuesta', 'NXDOMAIN (RCODE 3)'],
      ['Caché negativa', 'Según el registro SOA de la zona'],
      ['En el navegador', '«No se puede encontrar la dirección»'],
      ['Distinto de', 'SERVFAIL (fallo del servidor)'],
      ['Especificación', 'RFC 1035, RFC 2308'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'dns', proto: 'DNS', info: 'Consulta A www.ejemplo-inexistente.com', size: '84 B', kind: 'req', note: 'El navegador pregunta por un dominio mal escrito.' },
      { t: 0.008, from: 'dns', to: 'tld', proto: 'DNS', info: 'Consulta A www.ejemplo-inexistente.com', size: '84 B', kind: 'req', note: 'El resolutor ya conoce los servidores de .com y les pregunta directamente.' },
      { t: 0.021, from: 'tld', to: 'dns', proto: 'DNS', info: 'Respuesta NXDOMAIN www.ejemplo-inexistente.com', size: '140 B', kind: 'err', note: 'El TLD no tiene ese dominio registrado: responde NXDOMAIN con el SOA de .com.' },
      { t: 0.023, from: 'dns', to: 'client', proto: 'DNS', info: 'Respuesta NXDOMAIN www.ejemplo-inexistente.com', size: '140 B', kind: 'err', note: 'El resolutor lo guarda en caché negativa y avisa al navegador, que muestra el error.' },
    ],
  },
  {
    id: 'tls-expired',
    failureOf: 'https',
    name: 'TLS: certificado caducado',
    full: 'Cuando el servidor no puede demostrar quién es',
    layer: 6,
    description:
      'Los certificados tienen fecha de caducidad. Si el servidor presenta uno caducado, el navegador no puede confiar en que hable con la web real: corta el saludo con una alerta TLS y muestra un aviso de seguridad en lugar de la página.',
    facts: [
      ['Capa', 'Presentación (capa 6)'],
      ['Alerta', 'Fatal, certificate_expired (45)'],
      ['Comprobación', 'Fecha, nombre y cadena de confianza'],
      ['Validez máxima', 'Unos meses (cada vez menos)'],
      ['Solución', 'Renovación automática (ACME)'],
      ['Especificación', 'RFC 8446 §6, RFC 5280'],
    ],
    packets: [
      ...tcpHandshake('web', 443, 0),
      { t: 0.03, from: 'client', to: 'web', proto: 'TLS', info: 'Client Hello (SNI=www.ejemplo.com)', size: '517 B', kind: 'tls', note: 'El navegador empieza el saludo con normalidad.' },
      { t: 0.048, from: 'web', to: 'client', proto: 'TLS', info: 'Server Hello, Certificate (caducado), Finished', size: '4.1 KB', kind: 'tls', note: 'El servidor presenta un certificado cuya fecha de validez ya ha pasado.' },
      { t: 0.05, from: 'client', to: 'web', proto: 'TLS', info: 'Alert (Fatal, Certificate Expired)', size: '31 B', kind: 'err', note: 'El navegador lo comprueba, lo rechaza y envía una alerta fatal: el saludo se corta.' },
      { t: 0.051, from: 'client', to: 'web', proto: 'TCP', info: '52344 → 443 [FIN, ACK]', size: '60 B', kind: 'ctrl', note: 'Cierra la conexión sin enviar ni un byte de la petición HTTP.' },
    ],
  },
  {
    id: 'dhcp-full',
    failureOf: 'dhcp',
    name: 'DHCP: sin direcciones libres',
    full: 'Cuando el servidor no puede dar una IP',
    layer: 7,
    description:
      'Si el rango de direcciones del router se agota, el servidor DHCP rechaza las peticiones o no responde. El equipo lo reintenta y, al final, se pone a sí mismo una dirección 169.254.x.x (APIPA): puede hablar con su red local, pero no sale a Internet.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Rechazo', 'DHCPNAK'],
      ['Reintentos', '4 s, 8 s, 16 s…'],
      ['Plan B', 'APIPA 169.254.0.0/16'],
      ['Síntoma', '«Sin Internet» con Wi-Fi conectado'],
      ['Especificación', 'RFC 2131, RFC 3927'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'router', proto: 'DHCP', info: 'Request 192.168.1.10 (renovar)', size: '342 B', kind: 'req', note: 'Al reconectarse, el equipo pide volver a usar la IP que tenía.' },
      { t: 0.004, from: 'router', to: 'client', proto: 'DHCP', info: 'NAK (dirección ya asignada, rango lleno)', size: '342 B', kind: 'err', note: 'El servidor la rechaza: esa IP ya es de otro y no le quedan libres.' },
      { t: 0.01, from: 'client', to: 'router', proto: 'DHCP', info: 'Discover 0.0.0.0 → 255.255.255.255', size: '342 B', kind: 'req', note: 'Empieza de cero pidiendo cualquier dirección…' },
      { t: 4.01, from: 'client', to: 'router', proto: 'DHCP', info: 'Discover 0.0.0.0 → 255.255.255.255 (reintento)', size: '342 B', kind: 'err', note: '…pero no hay oferta. Tras varios reintentos se asigna 169.254.37.12 (APIPA) y se queda sin Internet.' },
    ],
  },
]
