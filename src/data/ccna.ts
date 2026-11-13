import { tcpHandshake } from './helpers'
import type { Protocol } from './protocols'

/** Lessons added for the CCNA syllabus: first-hop redundancy, EtherChannel, inter-VLAN routing, port security and ACLs. */
export const CCNA_PROTOCOLS: Protocol[] = [
  {
    id: 'hsrp',
    name: 'HSRP',
    full: 'Puerta de enlace redundante (Cisco)',
    layer: 3,
    description:
      'HSRP resuelve el mismo problema que VRRP, pero a la manera de Cisco: dos routers comparten una IP virtual con la MAC 0000.0c07.acXX. El activo envía un hello cada 3 segundos por UDP 1985; si el de respaldo pasa 10 segundos sin oírlo, asume el papel de activo y la red ni se entera.',
    facts: [
      ['Capa', 'Red (capa 3), sobre UDP 1985'],
      ['Dirección', '224.0.0.2 (v1)'],
      ['MAC virtual', '0000.0c07.ac01 (grupo 1)'],
      ['Temporizadores', 'hello 3 s · hold 10 s'],
      ['Prioridad', '100 por defecto; gana la mayor (con preempt)'],
      ['Frente a VRRP', 'HSRP es de Cisco; VRRP es el estándar'],
    ],
    packets: [
      { t: 0, from: 'router', to: 'router2', proto: 'HSRP', info: 'Hello estado activo grupo 1 prioridad 110 IP 192.168.1.254', size: '62 B', kind: 'ctrl', note: 'El router activo (prioridad 110) anuncia cada 3 s que atiende la IP virtual.', dstIp: '224.0.0.2' },
      { t: 3, from: 'router', to: 'router2', proto: 'HSRP', info: 'Hello estado activo grupo 1 prioridad 110 IP 192.168.1.254', size: '62 B', kind: 'ctrl', note: 'El de respaldo (standby) escucha en 224.0.0.2 y rearma su temporizador hold de 10 s.', dstIp: '224.0.0.2' },
      { t: 6, from: 'router2', to: 'router', proto: 'HSRP', info: 'Hello estado standby grupo 1 prioridad 100 IP 192.168.1.254', size: '62 B', kind: 'ctrl', note: 'El standby también se anuncia: así el activo sabe que hay relevo preparado.', dstIp: '224.0.0.2' },
      { t: 13.1, from: 'router2', to: 'client', proto: 'HSRP', info: 'Hello estado activo grupo 1 prioridad 100 IP 192.168.1.254 (nuevo activo)', size: '62 B', kind: 'err', note: 'El activo se avería y sus hellos dejan de llegar. Pasados 10 s (hold), el standby se declara activo y adopta la MAC virtual 0000.0c07.ac01.', dstIp: '224.0.0.2' },
      { t: 13.3, from: 'client', to: 'router2', proto: 'DNS', info: 'Consulta A www.ejemplo.com', size: '75 B', kind: 'req', note: 'El portátil sigue enviando a 192.168.1.254 con la misma MAC virtual: no nota el cambio de router.', dstIp: '8.8.8.8' },
    ],
  },
  {
    id: 'etherchannel',
    name: 'EtherChannel',
    full: 'Varios cables, un solo enlace lógico',
    layer: 2,
    description:
      'EtherChannel agrupa varios cables entre dos switches en un único enlace lógico: se suma el ancho de banda y STP no bloquea ninguno, porque para él es un solo puerto. Con LACP cada extremo envía LACPDUs para negociar qué puertos entran en el grupo; cada trama viaja entera por uno de los enlaces, elegido por un hash de sus direcciones.',
    facts: [
      ['Capa', 'Enlace de datos (capa 2)'],
      ['Negociación', 'LACP (802.3ad): modos active / passive'],
      ['Alternativas', 'PAgP (Cisco) o «on» (sin negociar)'],
      ['Destino', '01:80:c2:00:00:02, EtherType 0x8809'],
      ['Reparto', 'Hash por MAC o IP origen-destino'],
      ['Requisito', 'Puertos idénticos: velocidad, dúplex y VLANs'],
    ],
    packets: [
      { t: 0, from: 'switch', to: 'switch2', proto: 'LACP', info: 'LACPDU por Gi0/1: clave 1, activo', size: '124 B', kind: 'ctrl', note: 'SW1 propone agrupar Gi0/1 bajo la clave 1 (Port-channel 1). Modo LACP active.' },
      { t: 0.4, from: 'switch2', to: 'switch', proto: 'LACP', info: 'LACPDU por Gi0/1: clave 1, activo (sincronizado)', size: '124 B', kind: 'ctrl', note: 'SW2 contesta con sus datos y marca al vecino como partner: el enlace 1 queda dentro del grupo.' },
      { t: 0.8, from: 'switch', to: 'switch2', proto: 'LACP', info: 'LACPDU por Gi0/2: clave 1, activo (segundo enlace del grupo)', size: '124 B', kind: 'ctrl', note: 'El segundo cable se une con la misma clave: ya hay 2 Gb/s y sin bucles, porque STP ve un solo puerto.' },
      { t: 1.2, from: 'client', to: 'pc2', proto: 'Ethernet', info: 'Trama de datos: el hash elige el enlace 1', size: '1.5 KB', kind: 'req', note: 'Cada conversación viaja siempre por el mismo enlace del grupo (hash de MAC/IP): así las tramas no llegan desordenadas.' },
    ],
  },
  {
    id: 'intervlan',
    name: 'Inter-VLAN',
    full: 'Enrutamiento entre VLANs (router-on-a-stick)',
    layer: 3,
    description:
      'Dos VLANs son dos redes distintas: para pasar de una a otra hace falta un router. Con «router-on-a-stick», un solo cable troncal lleva todas las VLANs al router, que tiene una subinterfaz con IP en cada una (G0/0.10, G0/0.20) y reenvía los paquetes cambiando la etiqueta y las MAC, nunca las IP.',
    facts: [
      ['Capa', 'Red (capa 3) sobre 802.1Q'],
      ['Subinterfaces', 'G0/0.10 → 192.168.10.1 · G0/0.20 → 192.168.20.1'],
      ['Clave', 'encapsulation dot1Q <vlan> en cada subinterfaz'],
      ['Qué cambia', 'La etiqueta VLAN y las MAC; las IP no'],
      ['Alternativa', 'Switch de capa 3 con SVI (interface vlan 10)'],
      ['Pista en el examen', 'Hosts con puerta de enlace en su propia VLAN'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'router', proto: 'ICMP', info: 'Echo request seq=1 hacia otra VLAN', size: '98 B', kind: 'req', note: 'Destino 192.168.20.30: otra red. El equipo de la VLAN 10 se lo envía a su puerta de enlace (192.168.10.1).', srcIp: '192.168.10.10', dstIp: '192.168.20.30' },
      { t: 0.001, from: 'switch', to: 'router', proto: 'ICMP', info: 'Echo request seq=1 (troncal, etiquetada VLAN 10)', size: '102 B', kind: 'ctrl', note: 'Por el troncal hacia el router, el switch añade la etiqueta 802.1Q con la VLAN 10.', srcIp: '192.168.10.10', dstIp: '192.168.20.30', vlan: 10 },
      { t: 0.002, from: 'router', to: 'pc2', proto: 'ICMP', info: 'Echo request seq=1 (reetiquetada VLAN 20)', size: '102 B', kind: 'ctrl', note: 'La subinterfaz G0/0.10 lo recibe y G0/0.20 lo reenvía etiquetado como VLAN 20. Cambian las MAC; las IP, no.', srcIp: '192.168.10.10', dstIp: '192.168.20.30', vlan: 20 },
      { t: 0.02, from: 'pc2', to: 'router', proto: 'ICMP', info: 'Echo reply seq=1 hacia otra VLAN', size: '98 B', kind: 'res', note: 'La respuesta hace el camino inverso: el equipo de la VLAN 20 también envía a su puerta de enlace (192.168.20.1).', srcIp: '192.168.20.30', dstIp: '192.168.10.10' },
      { t: 0.021, from: 'router', to: 'client', proto: 'ICMP', info: 'Echo reply seq=1 (entregada en la VLAN 10)', size: '98 B', kind: 'res', note: 'El router la devuelve a la VLAN 10 y el switch la entrega sin etiqueta por el puerto de acceso.', srcIp: '192.168.20.30', dstIp: '192.168.10.10' },
    ],
  },
  {
    id: 'portsec',
    name: 'Port security',
    full: 'El switch solo acepta MACs conocidas',
    layer: 2,
    description:
      'Port security limita qué MACs pueden hablar por cada puerto del switch: una cantidad máxima, direcciones fijas o aprendidas al vuelo (sticky). Si aparece una MAC no autorizada hay tres reacciones posibles; la más dura, shutdown, deja el puerto en err-disabled hasta que alguien lo rearme.',
    facts: [
      ['Capa', 'Enlace de datos (capa 2)'],
      ['Activación', 'switchport port-security (en puertos de acceso)'],
      ['Violaciones', 'protect · restrict · shutdown (por defecto)'],
      ['Sticky', 'Aprende la MAC y la escribe en la configuración'],
      ['Recuperación', 'shutdown + no shutdown, o errdisable recovery'],
      ['Verificación', 'show port-security interface g0/3'],
    ],
    packets: [
      { t: 0, from: 'iot', to: 'switch', proto: 'Ethernet', info: 'Trama con MAC origen desconocida en Gi0/3', size: '90 B', kind: 'err', note: 'Alguien desenchufa la impresora y conecta otro aparato. Su MAC no es la aprendida en Gi0/3: violación.' },
      { t: 0.05, from: 'switch', to: 'logsrv', proto: 'Syslog', info: '<188>Nov 13 10:04:11 SW1 %PM-4-ERR_DISABLE: psecure-violation detectada en Gi0/3, puerto a err-disabled', size: '160 B', kind: 'err', note: 'Modo shutdown: el puerto se apaga (err-disabled) y el switch lo cuenta por syslog y SNMP.', srcIp: '192.168.1.250' },
      { t: 300, from: 'switch', to: 'logsrv', proto: 'Syslog', info: '<189>Nov 13 10:09:11 SW1 %PM-4-ERR_RECOVER: recuperando Gi0/3 de err-disabled', size: '150 B', kind: 'ctrl', note: 'Con errdisable recovery, el switch reintenta a los 300 s; si no, un técnico hace shutdown + no shutdown.', srcIp: '192.168.1.250' },
      { t: 300.2, from: 'printer', to: 'client', proto: 'Ethernet', info: 'Trama de impresión con la MAC autorizada', size: '1.2 KB', kind: 'res', note: 'Con la impresora de vuelta, su MAC coincide con la aprendida y el puerto vuelve a pasar tráfico.' },
    ],
  },
  {
    id: 'acl',
    name: 'ACL',
    full: 'Listas de control de acceso',
    layer: 3,
    description:
      'Una ACL es una lista de reglas permit/deny que el router evalúa en orden sobre cada paquete; la primera que encaja decide y al final hay un deny implícito que descarta todo lo demás. Las estándar (1–99) miran solo la IP de origen; las extendidas (100–199) miran origen, destino, protocolo y puertos.',
    facts: [
      ['Capa', 'Red (capa 3), en las interfaces del router'],
      ['Estándar', '1–99: solo IP de origen (cerca del destino)'],
      ['Extendida', '100–199: IPs, protocolo y puertos (cerca del origen)'],
      ['Orden', 'Primera coincidencia gana; deny implícito al final'],
      ['Wildcard', '0.0.0.255 = «el último octeto no importa»'],
      ['Verificación', 'show access-lists · show ip interface g0/1'],
    ],
    packets: [
      { t: 0, from: 'pc2', to: 'web', proto: 'TCP', info: '51023 → 23 [SYN] Seq=0', size: '66 B', kind: 'req', note: 'El equipo de la VLAN 20 intenta abrir Telnet hacia fuera. En G0/1 del router hay una ACL extendida: deny tcp 192.168.20.0 0.0.0.255 any eq 23.' },
      { t: 0.003, from: 'router', to: 'pc2', proto: 'ICMP', info: 'Destination Unreachable (comunicación prohibida por filtro)', size: '70 B', kind: 'err', note: 'La regla deny encaja y el router descarta el SYN avisando con ICMP tipo 3 código 13. Con «no ip unreachables» ni siquiera avisaría.' },
      ...tcpHandshake('web', 443, 0.05),
    ],
  },
]
