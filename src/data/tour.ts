/** Guided path from the cable up to the modern web: each lesson builds on the previous one. */
export const TOUR: { id: string; why: string }[] = [
  { id: 'ethernet', why: 'Todo empieza en el cable: tramas y direcciones MAC.' },
  { id: 'arp', why: 'Cómo se pasa de una IP a una MAC en tu red.' },
  { id: 'dhcp', why: 'Cómo consigue tu equipo su IP al conectarse.' },
  { id: 'ipv4', why: 'El paquete IP: direcciones, TTL y fragmentos.' },
  { id: 'icmp', why: 'Mensajes de control y ping.' },
  { id: 'traceroute', why: 'El TTL en acción: descubre el camino salto a salto.' },
  { id: 'nat', why: 'Cómo salen a Internet muchos equipos con una sola IP.' },
  { id: 'udp', why: 'El transporte más simple: sin conexión.' },
  { id: 'tcp', why: 'El transporte fiable: saludo, ACK y cierre.' },
  { id: 'dns', why: 'Traducir nombres en direcciones.' },
  { id: 'http', why: 'La web: peticiones y respuestas.' },
  { id: 'tls', why: 'Cifrar y autenticar la conexión.' },
  { id: 'https', why: 'HTTP dentro de TLS.' },
  { id: 'http2', why: 'Varias peticiones a la vez en una conexión.' },
  { id: 'http3', why: 'La web moderna sobre QUIC y UDP.' },
]
