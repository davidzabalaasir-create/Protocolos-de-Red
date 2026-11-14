import type { Lang } from '../i18n'
import { macOf } from './decode'

// A small Cisco-IOS-style command engine over the same network the lessons use
// (client 192.168.1.10, router 192.168.1.1, switch, printer 192.168.1.50, web 203.0.113.10…).
// Command OUTPUT is English on purpose, like real network gear; help texts are bilingual.

export type Mode = 'user' | 'exec' | 'config' | 'config-if' | 'config-vlan'

export interface Iface {
  name: string
  short: string
  ip?: string
  mask?: string
  mac: string
  /** no shutdown? */
  admin: boolean
  /** something plugged in at the other end */
  connected: boolean
  desc?: string
  /** access VLAN (switch ports) */
  vlan?: number
}

export interface Vlan {
  id: number
  name: string
}

export interface Dev {
  id: 'r1' | 'sw1'
  kind: 'router' | 'switch'
  hostname: string
  mode: Mode
  /** interface being configured (config-if) or VLAN (config-vlan) */
  sel?: string
  ifaces: Iface[]
  vlans: Vlan[]
  saved: boolean
}

const colon = (id: Parameters<typeof macOf>[0]) => macOf(id).map((b) => b.toString(16).padStart(2, '0')).join(':')
/** 02:42:4c:1b:57:04 → 0242.4c1b.5704 (how IOS prints MACs) */
export const dotted = (mac: string) => {
  const hex = mac.replaceAll(':', '')
  return `${hex.slice(0, 4)}.${hex.slice(4, 8)}.${hex.slice(8)}`
}

const MAC = { r1: colon('router'), sw1: colon('switch'), client: colon('client'), printer: colon('printer'), isp: '02:42:15:9f:a0:01' }

export function makeRouter(): Dev {
  return {
    id: 'r1',
    kind: 'router',
    hostname: 'R1',
    mode: 'user',
    saved: true,
    vlans: [],
    ifaces: [
      { name: 'GigabitEthernet0/0', short: 'Gi0/0', ip: '192.168.1.1', mask: '255.255.255.0', mac: MAC.r1, admin: true, connected: true, desc: 'LAN (hacia SW1)' },
      { name: 'GigabitEthernet0/1', short: 'Gi0/1', ip: '198.51.100.37', mask: '255.255.255.0', mac: MAC.r1, admin: true, connected: true, desc: 'WAN (hacia el ISP)' },
      { name: 'GigabitEthernet0/2', short: 'Gi0/2', mac: MAC.r1, admin: false, connected: false },
    ],
  }
}

export function makeSwitch(): Dev {
  return {
    id: 'sw1',
    kind: 'switch',
    hostname: 'SW1',
    mode: 'user',
    saved: true,
    vlans: [
      { id: 1, name: 'default' },
      { id: 20, name: 'Impresoras' },
    ],
    ifaces: [
      { name: 'Vlan1', short: 'Vl1', ip: '192.168.1.2', mask: '255.255.255.0', mac: MAC.sw1, admin: true, connected: true, desc: 'Gestion' },
      { name: 'GigabitEthernet0/1', short: 'Gi0/1', mac: MAC.sw1, admin: true, connected: true, vlan: 1, desc: 'Hacia R1' },
      { name: 'GigabitEthernet0/2', short: 'Gi0/2', mac: MAC.sw1, admin: true, connected: true, vlan: 1, desc: 'Hacia el Cliente' },
      { name: 'GigabitEthernet0/3', short: 'Gi0/3', mac: MAC.sw1, admin: true, connected: true, vlan: 20, desc: 'Hacia la Impresora' },
      { name: 'GigabitEthernet0/4', short: 'Gi0/4', mac: MAC.sw1, admin: true, connected: false, vlan: 1 },
    ],
  }
}

const up = (i: Iface) => i.admin && i.connected
const pad = (s: string, n: number) => (s.length >= n ? s + ' ' : s.padEnd(n))
const isIp = (s: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && s.split('.').every((o) => Number(o) <= 255)

/** what answers a ping, given the state of this device's interfaces */
function reachable(d: Dev, target: string): boolean {
  const lanUp = d.ifaces.some((i) => up(i) && i.ip?.startsWith('192.168.1.'))
  const wanUp = d.kind === 'router' ? d.ifaces.some((i) => up(i) && i.ip?.startsWith('198.51.100.')) : lanUp
  const self = d.ifaces.some((i) => up(i) && i.ip === target)
  const lan = ['192.168.1.1', '192.168.1.2', '192.168.1.10', '192.168.1.50']
  const wan = ['198.51.100.1', '198.51.100.37']
  const inet = ['8.8.8.8', '203.0.113.10', '198.41.0.4']
  if (self) return true
  if (lan.includes(target)) return lanUp
  if (wan.includes(target)) return d.kind === 'router' ? wanUp : lanUp
  if (inet.includes(target)) return wanUp && (d.kind === 'switch' ? lanUp : true)
  return false
}

// ── commands ─────────────────────────────────────────────────────────
interface Cmd {
  path: string[]
  /** shown in help after the path, e.g. '<ip>' */
  args?: string
  modes: Mode[]
  kinds?: Dev['kind'][]
  es: string
  en: string
  run: (d: Dev, args: string[]) => { d?: Dev; out: string }
}

const banner = (lines: string[]) => lines.join('\n')

function ipIntBrief(d: Dev) {
  const rows = d.ifaces.map(
    (i) =>
      pad(i.name, 23) +
      pad(i.ip ?? 'unassigned', 16) +
      pad('YES ' + (i.ip ? 'manual' : 'unset'), 11) +
      pad(i.admin ? 'up' : 'administratively down', 22) +
      (up(i) ? 'up' : 'down'),
  )
  return banner(['Interface              IP-Address      OK? Method Status                Protocol', ...rows])
}

function showInterfaces(d: Dev, which?: Iface) {
  const list = which ? [which] : d.ifaces
  return list
    .map((i) =>
      banner([
        `${i.name} is ${i.admin ? (up(i) ? 'up' : 'down') : 'administratively down'}, line protocol is ${up(i) ? 'up' : 'down'}`,
        `  Hardware is Gigabit Ethernet, address is ${dotted(i.mac)} (bia ${dotted(i.mac)})`,
        ...(i.desc ? [`  Description: ${i.desc}`] : []),
        ...(i.ip ? [`  Internet address is ${i.ip}/${maskBits(i.mask!)}`] : []),
        '  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec',
      ]),
    )
    .join('\n')
}

const maskBits = (mask: string) => mask.split('.').reduce((n, o) => n + ((Number(o) >>> 0).toString(2).match(/1/g)?.length ?? 0), 0)

function ipRoute(d: Dev) {
  if (d.kind === 'switch') return 'Default gateway is 192.168.1.1\n\nHost               Gateway           Last Use    Total Uses  Interface\nICMP redirect cache is empty'
  const wan = d.ifaces.find((i) => up(i) && i.ip?.startsWith('198.51.100.'))
  const lines = [
    'Codes: L - local, C - connected, S - static, O - OSPF, * - candidate default',
    '',
    wan ? 'Gateway of last resort is 198.51.100.1 to network 0.0.0.0' : 'Gateway of last resort is not set',
    '',
    ...(wan ? ['S*    0.0.0.0/0 [1/0] via 198.51.100.1'] : []),
  ]
  for (const i of d.ifaces) {
    if (!up(i) || !i.ip) continue
    const bits = maskBits(i.mask!)
    const net = i.ip
      .split('.')
      .map((o, k) => Number(o) & (Number(i.mask!.split('.')[k]) >>> 0))
      .join('.')
    lines.push(`C        ${net}/${bits} is directly connected, ${i.name}`, `L        ${i.ip}/32 is directly connected, ${i.name}`)
  }
  return banner(lines)
}

function showArp(d: Dev) {
  const head = 'Protocol  Address          Age (min)  Hardware Addr   Type   Interface'
  const gi0 = d.ifaces.find((i) => i.ip?.startsWith('192.168.1.'))
  if (!gi0 || !up(gi0)) return head
  const row = (ip: string, age: string, mac: string, iface: string) => `Internet  ${pad(ip, 17)}${pad(age, 11)}${pad(dotted(mac), 16)}ARPA   ${iface}`
  const out = [head, row(gi0.ip!, '-', d.id === 'r1' ? MAC.r1 : MAC.sw1, gi0.name)]
  if (d.id === 'r1') {
    out.push(row('192.168.1.2', '12', MAC.sw1, gi0.name), row('192.168.1.10', '3', MAC.client, gi0.name), row('192.168.1.50', '41', MAC.printer, gi0.name))
    const wan = d.ifaces.find((i) => up(i) && i.ip?.startsWith('198.51.100.'))
    if (wan) out.push(row('198.51.100.1', '8', MAC.isp, wan.name), row(wan.ip!, '-', MAC.r1, wan.name))
  } else {
    out.push(row('192.168.1.1', '5', MAC.r1, 'Vlan1'))
  }
  return banner(out)
}

const macTable = () =>
  banner([
    '          Mac Address Table',
    '-------------------------------------------',
    '',
    'Vlan    Mac Address       Type        Ports',
    '----    -----------       --------    -----',
    `   1    ${dotted(MAC.r1)}    DYNAMIC     Gi0/1`,
    `   1    ${dotted(MAC.client)}    DYNAMIC     Gi0/2`,
    `  20    ${dotted(MAC.printer)}    DYNAMIC     Gi0/3`,
    'Total Mac Addresses for this criterion: 3',
  ])

function vlanBrief(d: Dev) {
  const ports = (v: number) =>
    d.ifaces
      .filter((i) => i.vlan === v)
      .map((i) => i.short)
      .join(', ')
  const rows = [...d.vlans]
    .sort((a, b) => a.id - b.id)
    .map((v) => pad(String(v.id).padStart(4), 5) + pad(v.name, 29) + pad('active', 10) + ports(v.id))
  return banner(['VLAN Name                             Status    Ports', '---- -------------------------------- --------- -------------------------------', ...rows])
}

function runningConfig(d: Dev) {
  const lines = ['Building configuration...', '', '!', `hostname ${d.hostname}`, '!']
  for (const v of d.vlans.filter((x) => x.id !== 1)) lines.push(`vlan ${v.id}`, ` name ${v.name}`, '!')
  for (const i of d.ifaces) {
    lines.push(`interface ${i.name}`)
    if (i.desc) lines.push(` description ${i.desc}`)
    if (i.vlan && i.vlan !== 1) lines.push(' switchport mode access', ` switchport access vlan ${i.vlan}`)
    if (i.ip) lines.push(` ip address ${i.ip} ${i.mask}`)
    lines.push(i.admin ? ' no shutdown' : ' shutdown', '!')
  }
  if (d.kind === 'router') lines.push('ip route 0.0.0.0 0.0.0.0 198.51.100.1', '!')
  if (d.kind === 'switch') lines.push('ip default-gateway 192.168.1.1', '!')
  lines.push('end')
  return banner(lines)
}

const showVersion = (d: Dev) =>
  banner([
    'PR-OS Software (educational), Version 15.9(3), RELEASE SOFTWARE',
    'Protocolos de Red virtual lab — not a real device',
    '',
    `${d.hostname} uptime is 3 hours, 14 minutes`,
    'System image file is "flash:pr-os.bin"',
    '',
    d.kind === 'router' ? '3 Gigabit Ethernet interfaces, 512MB RAM' : '4 Gigabit Ethernet interfaces, 1 SVI, 256MB RAM',
    'Configuration register is 0x2102',
  ])

const neighbors = (d: Dev) =>
  banner([
    'Capability Codes: R - Router, S - Switch, H - Host',
    '',
    'Device ID        Local Intrfce     Holdtme    Capability  Platform   Port ID',
    ...(d.id === 'r1'
      ? ['SW1              Gig 0/0           154              S     PR-Switch  Gig 0/1']
      : ['R1               Gig 0/1           147              R     PR-Router  Gig 0/0', 'Impresora        Gig 0/3           98               H     PR-Print   eth0']),
  ])

const spanningTree = () =>
  banner([
    'VLAN0001',
    '  Spanning tree enabled protocol rstp',
    '  Root ID    Priority    32769',
    `             Address     ${dotted(MAC.sw1)}`,
    '             This bridge is the root',
    '  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)',
    '',
    'Interface           Role Sts Cost      Prio.Nbr Type',
    'Gi0/1               Desg FWD 4         128.1    P2p',
    'Gi0/2               Desg FWD 4         128.2    P2p',
    'Gi0/3               Desg FWD 4         128.3    P2p',
  ])

const dhcpBinding = () =>
  banner([
    'Bindings from all pools not associated with VRF:',
    'IP address      Client-ID/Hardware address   Lease expiration        Type',
    `192.168.1.10    ${dotted(MAC.client)}               Nov 13 2026 10:02 AM    Automatic`,
  ])

function ping(d: Dev, target: string) {
  const ok = reachable(d, target)
  return banner([
    'Type escape sequence to abort.',
    `Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`,
    ok ? '!!!!!' : '.....',
    ok ? 'Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms' : 'Success rate is 0 percent (0/5)',
  ])
}

function trace(d: Dev, target: string) {
  const out = ['Type escape sequence to abort.', `Tracing the route to ${target}`]
  if (!reachable(d, target)) return banner([...out, '  1  *  *  *', '  2  *  *  *'])
  const hops: string[] = []
  const inet = ['8.8.8.8', '203.0.113.10', '198.41.0.4'].includes(target)
  if (d.kind === 'switch' && target !== '192.168.1.1') hops.push('192.168.1.1')
  if (inet) hops.push('198.51.100.1')
  hops.push(target)
  return banner([...out, ...hops.map((h, i) => `  ${i + 1}  ${h}  ${i + 1} msec  ${i + 1} msec  ${i + 2} msec`)])
}

/** 'g0/0', 'gi 0/0', 'gigabitEthernet0/0', 'vlan 1' → the matching interface */
export function findIface(d: Dev, args: string[]): Iface | undefined {
  const m = args.join('').toLowerCase().match(/^([a-z]+)([\d/.]+)$/)
  if (!m) return undefined
  return d.ifaces.find((i) => {
    const im = i.name.toLowerCase().match(/^([a-z]+)([\d/.]+)$/)
    return im && im[1].startsWith(m[1]) && im[2] === m[2]
  })
}

const CMDS: Cmd[] = [
  { path: ['enable'], modes: ['user'], es: 'Entrar en modo privilegiado', en: 'Enter privileged mode', run: (d) => ({ d: { ...d, mode: 'exec' }, out: '' }) },
  { path: ['disable'], modes: ['exec'], es: 'Volver al modo usuario', en: 'Back to user mode', run: (d) => ({ d: { ...d, mode: 'user' }, out: '' }) },
  {
    path: ['exit'],
    modes: ['user', 'exec', 'config', 'config-if', 'config-vlan'],
    es: 'Salir del modo actual',
    en: 'Leave the current mode',
    run: (d) => {
      const back: Record<Mode, Mode> = { user: 'user', exec: 'user', config: 'exec', 'config-if': 'config', 'config-vlan': 'config' }
      return { d: { ...d, mode: back[d.mode], sel: undefined }, out: '' }
    },
  },
  { path: ['end'], modes: ['config', 'config-if', 'config-vlan'], es: 'Volver al modo privilegiado', en: 'Back to privileged mode', run: (d) => ({ d: { ...d, mode: 'exec', sel: undefined }, out: '' }) },
  { path: ['configure', 'terminal'], modes: ['exec'], es: 'Entrar en configuración global', en: 'Enter global configuration', run: (d) => ({ d: { ...d, mode: 'config' }, out: 'Enter configuration commands, one per line.  End with end.' }) },
  {
    path: ['hostname'],
    args: '<nombre>',
    modes: ['config'],
    es: 'Cambiar el nombre del equipo',
    en: 'Change the device name',
    run: (d, a) => (a[0] && /^[A-Za-z][\w-]*$/.test(a[0]) ? { d: { ...d, hostname: a[0], saved: false }, out: '' } : { out: '% Invalid hostname' }),
  },
  {
    path: ['interface'],
    args: '<interfaz>',
    modes: ['config'],
    es: 'Configurar una interfaz (p. ej. g0/0)',
    en: 'Configure an interface (e.g. g0/0)',
    run: (d, a) => {
      const i = findIface(d, a)
      return i ? { d: { ...d, mode: 'config-if', sel: i.name }, out: '' } : { out: '% Invalid interface' }
    },
  },
  {
    path: ['ip', 'address'],
    args: '<ip> <máscara>',
    modes: ['config-if'],
    es: 'Poner dirección IP a la interfaz',
    en: 'Set the interface IP address',
    run: (d, a) => {
      if (!isIp(a[0] ?? '') || !isIp(a[1] ?? '')) return { out: '% Incomplete command.' }
      return { d: { ...d, saved: false, ifaces: d.ifaces.map((i) => (i.name === d.sel ? { ...i, ip: a[0], mask: a[1] } : i)) }, out: '' }
    },
  },
  {
    path: ['shutdown'],
    modes: ['config-if'],
    es: 'Apagar la interfaz',
    en: 'Shut the interface down',
    run: (d) => ({
      d: { ...d, saved: false, ifaces: d.ifaces.map((i) => (i.name === d.sel ? { ...i, admin: false } : i)) },
      out: `%LINK-5-CHANGED: Interface ${d.sel}, changed state to administratively down`,
    }),
  },
  {
    path: ['no', 'shutdown'],
    modes: ['config-if'],
    es: 'Encender la interfaz',
    en: 'Bring the interface up',
    run: (d) => ({
      d: { ...d, saved: false, ifaces: d.ifaces.map((i) => (i.name === d.sel ? { ...i, admin: true } : i)) },
      out: `%LINK-3-UPDOWN: Interface ${d.sel}, changed state to up`,
    }),
  },
  {
    path: ['switchport', 'mode', 'access'],
    modes: ['config-if'],
    kinds: ['switch'],
    es: 'Poner el puerto en modo acceso',
    en: 'Put the port in access mode',
    run: (d) => (d.sel === 'Vlan1' ? { out: '% Invalid input detected.' } : { out: '' }),
  },
  {
    path: ['switchport', 'access', 'vlan'],
    args: '<nº>',
    modes: ['config-if'],
    kinds: ['switch'],
    es: 'Asignar el puerto a una VLAN',
    en: 'Assign the port to a VLAN',
    run: (d, a) => {
      const n = Number(a[0])
      if (!Number.isInteger(n) || n < 1 || n > 4094) return { out: '% Invalid VLAN' }
      if (d.sel === 'Vlan1') return { out: '% Invalid input detected.' }
      const created = d.vlans.some((v) => v.id === n) ? d.vlans : [...d.vlans, { id: n, name: `VLAN${String(n).padStart(4, '0')}` }]
      return {
        d: { ...d, saved: false, vlans: created, ifaces: d.ifaces.map((i) => (i.name === d.sel ? { ...i, vlan: n } : i)) },
        out: created === d.vlans ? '' : `% Access VLAN does not exist. Creating vlan ${n}`,
      }
    },
  },
  {
    path: ['vlan'],
    args: '<nº>',
    modes: ['config'],
    kinds: ['switch'],
    es: 'Crear o editar una VLAN',
    en: 'Create or edit a VLAN',
    run: (d, a) => {
      const n = Number(a[0])
      if (!Number.isInteger(n) || n < 1 || n > 4094) return { out: '% Invalid VLAN' }
      const vlans = d.vlans.some((v) => v.id === n) ? d.vlans : [...d.vlans, { id: n, name: `VLAN${String(n).padStart(4, '0')}` }]
      return { d: { ...d, saved: false, mode: 'config-vlan', sel: String(n), vlans }, out: '' }
    },
  },
  {
    path: ['name'],
    args: '<nombre>',
    modes: ['config-vlan'],
    kinds: ['switch'],
    es: 'Nombrar la VLAN',
    en: 'Name the VLAN',
    run: (d, a) => (a[0] ? { d: { ...d, saved: false, vlans: d.vlans.map((v) => (String(v.id) === d.sel ? { ...v, name: a.join(' ') } : v)) }, out: '' } : { out: '% Incomplete command.' }),
  },
  {
    path: ['copy', 'running-config', 'startup-config'],
    modes: ['exec'],
    es: 'Guardar la configuración',
    en: 'Save the configuration',
    run: (d) => ({ d: { ...d, saved: true }, out: 'Destination filename [startup-config]?\nBuilding configuration...\n[OK]' }),
  },
  { path: ['ping'], args: '<ip>', modes: ['user', 'exec'], es: 'Comprobar si una IP responde', en: 'Check whether an IP answers', run: (d, a) => (isIp(a[0] ?? '') ? { out: ping(d, a[0]) } : { out: '% Incomplete command.' }) },
  { path: ['traceroute'], args: '<ip>', modes: ['user', 'exec'], es: 'Ver los saltos hasta una IP', en: 'See the hops to an IP', run: (d, a) => (isIp(a[0] ?? '') ? { out: trace(d, a[0]) } : { out: '% Incomplete command.' }) },
  { path: ['show', 'version'], modes: ['user', 'exec'], es: 'Versión y datos del equipo', en: 'Device version and facts', run: (d) => ({ out: showVersion(d) }) },
  { path: ['show', 'ip', 'interface', 'brief'], modes: ['user', 'exec'], es: 'Resumen de interfaces e IPs', en: 'Interface and IP summary', run: (d) => ({ out: ipIntBrief(d) }) },
  {
    path: ['show', 'interfaces'],
    args: '[interfaz]',
    modes: ['user', 'exec'],
    es: 'Detalle de las interfaces',
    en: 'Interface details',
    run: (d, a) => {
      if (!a.length) return { out: showInterfaces(d) }
      const i = findIface(d, a)
      return i ? { out: showInterfaces(d, i) } : { out: '% Invalid interface' }
    },
  },
  { path: ['show', 'ip', 'route'], modes: ['user', 'exec'], es: 'Tabla de enrutamiento', en: 'Routing table', run: (d) => ({ out: ipRoute(d) }) },
  { path: ['show', 'arp'], modes: ['user', 'exec'], es: 'Tabla ARP (IP ↔ MAC)', en: 'ARP table (IP ↔ MAC)', run: (d) => ({ out: showArp(d) }) },
  { path: ['show', 'mac', 'address-table'], modes: ['user', 'exec'], kinds: ['switch'], es: 'Tabla de MACs aprendidas', en: 'Learned MAC table', run: () => ({ out: macTable() }) },
  { path: ['show', 'vlan', 'brief'], modes: ['user', 'exec'], kinds: ['switch'], es: 'VLANs y sus puertos', en: 'VLANs and their ports', run: (d) => ({ out: vlanBrief(d) }) },
  { path: ['show', 'spanning-tree'], modes: ['user', 'exec'], kinds: ['switch'], es: 'Estado de STP', en: 'STP state', run: () => ({ out: spanningTree() }) },
  { path: ['show', 'cdp', 'neighbors'], modes: ['user', 'exec'], es: 'Vecinos descubiertos (CDP)', en: 'Discovered neighbours (CDP)', run: (d) => ({ out: neighbors(d) }) },
  { path: ['show', 'lldp', 'neighbors'], modes: ['user', 'exec'], es: 'Vecinos descubiertos (LLDP)', en: 'Discovered neighbours (LLDP)', run: (d) => ({ out: neighbors(d) }) },
  { path: ['show', 'ip', 'dhcp', 'binding'], modes: ['user', 'exec'], kinds: ['router'], es: 'Direcciones entregadas por DHCP', en: 'Leases handed out by DHCP', run: () => ({ out: dhcpBinding() }) },
  { path: ['show', 'running-config'], modes: ['exec'], es: 'Configuración en uso (requiere enable)', en: 'Live configuration (needs enable)', run: (d) => ({ out: runningConfig(d) }) },
]

const usable = (d: Dev) => CMDS.filter((c) => c.modes.includes(d.mode) && (!c.kinds || c.kinds.includes(d.kind)))

export const prompt = (d: Dev) => d.hostname + { user: '>', exec: '#', config: '(config)#', 'config-if': '(config-if)#', 'config-vlan': '(config-vlan)#' }[d.mode]

export interface RunResult {
  d: Dev
  out: string
  /** joined path of the matched command, for the challenges */
  cmd: string | null
  args: string[]
}

export function run(d: Dev, input: string): RunResult {
  const tokens = input.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return { d, out: '', cmd: null, args: [] }
  const lower = tokens.map((t) => t.toLowerCase())
  const cmds = usable(d)
  const matchesAt = (c: Cmd, n: number) => c.path.slice(0, n).every((w, i) => w.startsWith(lower[i]))
  const full = cmds.filter((c) => tokens.length >= c.path.length && matchesAt(c, c.path.length) && (tokens.length === c.path.length || c.args))
  if (full.length === 1) {
    const r = full[0].run(d, tokens.slice(full[0].path.length))
    return { d: r.d ?? d, out: r.out, cmd: full[0].path.join(' '), args: tokens.slice(full[0].path.length) }
  }
  if (full.length > 1) return { d, out: `% Ambiguous command:  "${input.trim()}"`, cmd: null, args: [] }
  const partial = cmds.some((c) => tokens.length < c.path.length && matchesAt(c, tokens.length))
  return { d, out: partial ? '% Incomplete command.' : "% Invalid input detected. Escribe ? para ver la ayuda. / Type ? for help.", cmd: null, args: [] }
}

/** contextual help for `?`: the usable commands that extend what is typed */
export function help(d: Dev, buffer: string, lang: Lang): string {
  const tokens = buffer.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const list = usable(d).filter((c) => tokens.every((tk, i) => c.path[i]?.startsWith(tk)))
  if (!list.length) return '% No match'
  return list.map((c) => '  ' + pad(c.path.join(' ') + (c.args ? ' ' + c.args : ''), 36) + (lang === 'en' ? c.en : c.es)).join('\n')
}

/** Tab: complete the last word when only one command fits */
export function complete(d: Dev, buffer: string): string | null {
  const endsSpace = /\s$/.test(buffer)
  const tokens = buffer.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length || endsSpace) return null
  const idx = tokens.length - 1
  const words = new Set(
    usable(d)
      .filter((c) => tokens.every((tk, i) => c.path[i]?.startsWith(tk)) && c.path.length > idx)
      .map((c) => c.path[idx]),
  )
  if (words.size !== 1) return null
  const word = [...words][0]
  return [...tokens.slice(0, idx), word].join(' ') + ' '
}

// ── challenges ───────────────────────────────────────────────────────
export interface Reto {
  id: string
  es: string
  en: string
  check: (e: { dev: Dev; cmd: string | null; args: string[]; out: string }) => boolean
}

export const RETOS: Reto[] = [
  { id: 'enable', es: 'Entra en modo privilegiado (verás el símbolo #)', en: 'Enter privileged mode (you will see the # sign)', check: (e) => e.cmd === 'enable' },
  { id: 'brief', es: 'Mira las interfaces del router con sus IPs', en: "See the router's interfaces and IPs", check: (e) => e.dev.id === 'r1' && e.cmd === 'show ip interface brief' },
  { id: 'route', es: 'Consulta la tabla de enrutamiento del router', en: "Look at the router's routing table", check: (e) => e.dev.id === 'r1' && e.cmd === 'show ip route' },
  { id: 'arp', es: 'Averigua la MAC del Cliente (192.168.1.10) en el router', en: "Find the client's MAC (192.168.1.10) on the router", check: (e) => e.dev.id === 'r1' && e.cmd === 'show arp' },
  { id: 'mact', es: 'En el switch, mira qué MAC se aprendió en cada puerto', en: 'On the switch, see which MAC was learned on each port', check: (e) => e.dev.id === 'sw1' && e.cmd === 'show mac address-table' },
  { id: 'vlanb', es: 'Lista las VLANs del switch y sus puertos', en: "List the switch's VLANs and their ports", check: (e) => e.dev.id === 'sw1' && e.cmd === 'show vlan brief' },
  { id: 'ping', es: 'Haz ping desde el router a 8.8.8.8', en: 'Ping 8.8.8.8 from the router', check: (e) => e.dev.id === 'r1' && e.cmd === 'ping' && e.args[0] === '8.8.8.8' && e.out.includes('100 percent') },
  {
    id: 'vlan30',
    es: 'Crea en el switch la VLAN 30 con el nombre Invitados',
    en: 'Create VLAN 30 on the switch, named Invitados',
    check: (e) => e.dev.id === 'sw1' && e.dev.vlans.some((v) => v.id === 30 && v.name.toLowerCase() === 'invitados'),
  },
]
