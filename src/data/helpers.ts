import type { NodeId, Packet } from './protocols'

/** TCP three-way handshake between `from` and `to`. */
export const tcpHandshake = (to: NodeId, port: number, t0: number, from: NodeId = 'client', cport = 52344): Packet[] => [
  { t: t0, from, to, proto: 'TCP', info: `${cport} → ${port} [SYN] Seq=0`, size: '66 B', kind: 'tcp', note: 'El cliente pide abrir una conexión y propone su número de secuencia inicial.' },
  { t: t0 + 0.017, from: to, to: from, proto: 'TCP', info: `${port} → ${cport} [SYN, ACK] Seq=0 Ack=1`, size: '66 B', kind: 'tcp', note: 'El servidor acepta, confirma la secuencia del cliente y envía la suya.' },
  { t: t0 + 0.034, from, to, proto: 'TCP', info: `${cport} → ${port} [ACK] Seq=1 Ack=1`, size: '60 B', kind: 'tcp', note: 'El cliente confirma: la conexión queda establecida (saludo de tres vías).' },
]
