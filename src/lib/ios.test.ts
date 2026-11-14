import { describe, expect, it } from 'vitest'
import { complete, type Dev, dotted, findIface, help, makeRouter, makeSwitch, prompt, RETOS, run } from './ios'

/** run a whole session, returning the final state and the last output */
function session(d: Dev, ...inputs: string[]) {
  let out = ''
  for (const input of inputs) {
    const r = run(d, input)
    d = r.d
    out = r.out
  }
  return { d, out }
}

describe('IOS console', () => {
  it('formats MACs the IOS way', () => {
    expect(dotted('02:42:4c:1b:57:04')).toBe('0242.4c1b.5704')
  })

  it('understands abbreviations, ambiguity and unknown commands', () => {
    const r1 = makeRouter()
    expect(run(r1, 'sh ip int br').out).toContain('192.168.1.1')
    expect(run(r1, 'show').out).toBe('% Incomplete command.')
    expect(run(r1, 'xyzzy').out).toContain('% Invalid input')
    const { d } = session(makeRouter(), 'enable')
    expect(run(d, 'c t').out).toContain('configuration commands') // configure terminal
  })

  it('walks the modes with the right prompts', () => {
    let d = makeRouter()
    expect(prompt(d)).toBe('R1>')
    d = session(d, 'enable').d
    expect(prompt(d)).toBe('R1#')
    d = session(d, 'conf t', 'interface g0/0').d
    expect(prompt(d)).toBe('R1(config-if)#')
    d = session(d, 'end').d
    expect(prompt(d)).toBe('R1#')
    d = session(d, 'disable').d
    expect(prompt(d)).toBe('R1>')
  })

  it('needs enable for the running config', () => {
    expect(run(makeRouter(), 'show running-config').out).toContain('% Invalid input')
    const { out } = session(makeRouter(), 'enable', 'show run')
    expect(out).toContain('hostname R1')
    expect(out).toContain('ip address 192.168.1.1 255.255.255.0')
  })

  it('configures hostname, IP and shutdown, and the state shows it', () => {
    const { d } = session(makeRouter(), 'enable', 'conf t', 'hostname R2', 'interface g0/2', 'ip address 10.0.0.1 255.255.255.0', 'no shutdown', 'end')
    expect(d.hostname).toBe('R2')
    const brief = run(d, 'show ip interface brief').out
    expect(brief).toContain('10.0.0.1')
    const shut = session(d, 'conf t', 'int g0/0', 'shutdown', 'end')
    expect(shut.d.ifaces[0].admin).toBe(false)
    expect(run(shut.d, 'show ip route').out).not.toContain('192.168.1.0/24')
    expect(run(shut.d, 'ping 192.168.1.10').out).toContain('0 percent')
  })

  it('finds interfaces by any usual spelling', () => {
    const r1 = makeRouter()
    for (const name of [['g0/0'], ['gi0/0'], ['gigabitethernet0/0'], ['GigabitEthernet', '0/0']]) {
      expect(findIface(r1, name)?.name).toBe('GigabitEthernet0/0')
    }
    expect(findIface(makeSwitch(), ['vlan1'])?.name).toBe('Vlan1')
    expect(findIface(r1, ['g0/9'])).toBeUndefined()
  })

  it('switch: VLANs, MAC table and access ports', () => {
    const sw = makeSwitch()
    expect(run(sw, 'show mac address-table').out).toContain('DYNAMIC')
    expect(run(sw, 'show vlan brief').out).toContain('Impresoras')
    const { d } = session(sw, 'enable', 'conf t', 'vlan 30', 'name Invitados', 'exit', 'interface g0/4', 'switchport mode access', 'switchport access vlan 30', 'end')
    expect(d.vlans.find((v) => v.id === 30)?.name).toBe('Invitados')
    expect(run(d, 'show vlan brief').out).toMatch(/30\s+Invitados.*Gi0\/4/)
    expect(run(session(sw, 'enable', 'conf t', 'interface g0/4').d, 'switchport mode access').out).toBe('')
    expect(run(session(sw, 'enable', 'conf t', 'interface vlan1').d, 'switchport mode access').out).toContain('% Invalid input')
  })

  it('switch: trunk ports', () => {
    const sw = makeSwitch()
    expect(run(sw, 'show interfaces trunk').out).toBe('')
    const { d } = session(sw, 'enable', 'conf t', 'interface g0/1', 'switchport mode trunk', 'end')
    expect(run(d, 'show interfaces trunk').out).toMatch(/Gi0\/1\s+on\s+802\.1q\s+trunking\s+1/)
    expect(run(d, 'show vlan brief').out).not.toMatch(/Gi0\/1/)
    expect(run(d, 'show running-config').out).toContain(' switchport mode trunk')
    // 'show interfaces <iface>' still works next to 'show interfaces trunk'
    expect(run(d, 'show interfaces g0/1').out).toContain('GigabitEthernet0/1')
    // back to access mode
    const back = session(d, 'conf t', 'interface g0/1', 'switchport mode access', 'end').d
    expect(run(back, 'show vlan brief').out).toMatch(/Gi0\/1/)
    expect(run(back, 'show interfaces trunk').out).toBe('')
    expect(run(session(sw, 'enable', 'conf t', 'interface vlan1').d, 'switchport mode trunk').out).toContain('% Invalid input')
    // router has no VLAN commands
    expect(run(session(makeRouter(), 'enable', 'conf t').d, 'vlan 30').out).toContain('% Invalid input')
  })

  it('ping and traceroute follow the topology', () => {
    const r1 = makeRouter()
    expect(run(r1, 'ping 8.8.8.8').out).toContain('100 percent')
    expect(run(r1, 'ping 10.99.99.99').out).toContain('0 percent')
    expect(run(r1, 'traceroute 203.0.113.10').out).toContain('198.51.100.1')
    const sw = makeSwitch()
    expect(run(sw, 'traceroute 8.8.8.8').out).toContain('192.168.1.1')
  })

  it('help and completion follow the mode', () => {
    const r1 = makeRouter()
    expect(help(r1, '', 'es')).toContain('ping')
    expect(help(r1, '', 'es')).not.toContain('configure')
    expect(help(session(makeRouter(), 'enable').d, 'show ip', 'en')).toContain('Routing table')
    expect(complete(r1, 'pi')).toBe('ping ')
    expect(complete(r1, 'show ip ro')).toBe('show ip route ')
    expect(complete(r1, 's')).toBe('show ') // only s-command in user mode
    expect(complete(session(makeRouter(), 'enable').d, 'c')).toBeNull() // configure / copy: ambiguous
  })

  it('challenges detect their commands', () => {
    const r1 = session(makeRouter(), 'enable').d
    const ping = run(r1, 'ping 8.8.8.8')
    expect(RETOS.find((x) => x.id === 'ping')!.check({ dev: r1, cmd: ping.cmd, args: ping.args, out: ping.out })).toBe(true)
    const sw = session(makeSwitch(), 'enable', 'conf t', 'vlan 30', 'name Invitados').d
    expect(RETOS.find((x) => x.id === 'vlan30')!.check({ dev: sw, cmd: 'name', args: ['Invitados'], out: '' })).toBe(true)
  })
})
