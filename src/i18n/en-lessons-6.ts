import type { LessonText } from './types'

/** English for the CCNA lessons (HSRP, EtherChannel, inter-VLAN, port security, ACLs). */
export const LESSONS_EN_6: Record<string, LessonText> = {
  hsrp: {
    full: 'A redundant default gateway (Cisco)',
    description:
      "HSRP solves the same problem as VRRP, the Cisco way: two routers share a virtual IP with the MAC 0000.0c07.acXX. The active one sends a hello every 3 seconds over UDP 1985; if the standby goes 10 seconds without hearing it, it takes over as active and the network never notices.",
    facts: [
      ['Layer', 'Network (layer 3), over UDP 1985'],
      ['Address', '224.0.0.2 (v1)'],
      ['Virtual MAC', '0000.0c07.ac01 (group 1)'],
      ['Timers', 'hello 3 s · hold 10 s'],
      ['Priority', '100 by default; highest wins (with preempt)'],
      ['Versus VRRP', 'HSRP is Cisco-proprietary; VRRP is the standard'],
    ],
    notes: [
      'The active router (priority 110) announces every 3 s that it serves the virtual IP.',
      'The standby listens on 224.0.0.2 and re-arms its 10 s hold timer.',
      'The standby announces itself too, so the active knows a backup is ready.',
      'The active dies and its hellos stop. After the 10 s hold, the standby declares itself active and adopts the virtual MAC 0000.0c07.ac01.',
      'The laptop keeps sending to 192.168.1.254 with the same virtual MAC: it never notices the router swap.',
    ],
    quiz: [
      {
        q: 'What happens when the HSRP active router stops sending hellos?',
        options: ['Hosts get a new gateway over DHCP', 'The standby waits out the hold (10 s) and becomes active with the same virtual IP and MAC', 'The network loses its uplink until someone fixes it'],
        answer: 1,
        why: "That is HSRP's whole point: the virtual IP and MAC never change, so hosts notice nothing.",
      },
      {
        q: 'How does HSRP differ from VRRP?',
        options: ['HSRP is Cisco-proprietary; VRRP is the open standard', 'HSRP uses multicast and VRRP does not', 'VRRP needs DHCP'],
        answer: 0,
        why: 'They do the same job; HSRP is Cisco (UDP 1985, 224.0.0.2) while VRRP is the standard (IP protocol 112, 224.0.0.18).',
      },
    ],
  },
  etherchannel: {
    full: 'Several cables, one logical link',
    description:
      'EtherChannel bundles several cables between two switches into one logical link: the bandwidth adds up and STP blocks none of them, because to STP the bundle is a single port. With LACP each end sends LACPDUs to negotiate which ports join the group; every frame travels whole down one of the links, picked by a hash of its addresses.',
    facts: [
      ['Layer', 'Data link (layer 2)'],
      ['Negotiation', 'LACP (802.3ad): active / passive modes'],
      ['Alternatives', 'PAgP (Cisco) or «on» (no negotiation)'],
      ['Destination', '01:80:c2:00:00:02, EtherType 0x8809'],
      ['Load sharing', 'Hash of source–destination MAC or IP'],
      ['Requirement', 'Identical ports: speed, duplex and VLANs'],
    ],
    notes: [
      'SW1 proposes bundling Gi0/1 under key 1 (Port-channel 1). LACP active mode.',
      'SW2 answers with its own details and records the neighbour as partner: link 1 joins the bundle.',
      'The second cable joins with the same key: 2 Gb/s and no loops, because STP sees a single port.',
      'Each conversation always travels down the same link of the bundle (MAC/IP hash), so frames never arrive out of order.',
    ],
    quiz: [
      {
        q: 'Why does STP not block the cables of an EtherChannel?',
        options: ['Because STP is disabled on those ports', 'Because it sees them as one logical link', 'Because LACP outranks STP'],
        answer: 1,
        why: 'The whole bundle is one logical port (the Port-channel): there is no loop to block.',
      },
      {
        q: 'How is traffic shared across the links of the bundle?',
        options: ['Frames alternate between cables (round-robin)', 'An address hash pins each conversation to one link', 'The fastest link takes everything'],
        answer: 1,
        why: 'The MAC/IP hash keeps each conversation on the same cable, avoiding out-of-order frames.',
      },
    ],
  },
  intervlan: {
    full: 'Routing between VLANs (router-on-a-stick)',
    description:
      'Two VLANs are two separate networks: getting from one to the other takes a router. With router-on-a-stick, a single trunk cable carries every VLAN to the router, which has a subinterface with an IP in each one (G0/0.10, G0/0.20) and forwards packets by swapping the tag and the MACs — never the IPs.',
    facts: [
      ['Layer', 'Network (layer 3) over 802.1Q'],
      ['Subinterfaces', 'G0/0.10 → 192.168.10.1 · G0/0.20 → 192.168.20.1'],
      ['The key command', 'encapsulation dot1Q <vlan> on each subinterface'],
      ['What changes', 'The VLAN tag and the MACs; the IPs do not'],
      ['Alternative', 'A layer-3 switch with SVIs (interface vlan 10)'],
      ['Exam hint', 'Each host’s gateway lives inside its own VLAN'],
    ],
    notes: [
      'Destination 192.168.20.30: another network. The VLAN 10 host sends it to its gateway (192.168.10.1).',
      'On the trunk towards the router, the switch adds the 802.1Q tag with VLAN 10.',
      'Subinterface G0/0.10 receives it and G0/0.20 forwards it tagged as VLAN 20. The MACs change; the IPs do not.',
      'The reply takes the reverse path: the VLAN 20 host also sends to its own gateway (192.168.20.1).',
      'The router returns it to VLAN 10 and the switch delivers it untagged through the access port.',
    ],
    quiz: [
      {
        q: 'In router-on-a-stick, what does each subinterface need?',
        options: ['encapsulation dot1Q with its VLAN, plus an IP in that network', 'One physical cable per VLAN', 'The same IP on every VLAN'],
        answer: 0,
        why: 'Each subinterface (G0/0.10, G0/0.20) carries its encapsulation dot1Q and acts as the gateway of its VLAN.',
      },
      {
        q: 'When routing between VLANs, what changes in the packet?',
        options: ['The source and destination IPs', 'The VLAN tag and the MACs; the IPs do not', 'Only the TTL'],
        answer: 1,
        why: 'The router rewrites the frame (MACs and tag) and decrements the TTL, but the IPs travel untouched.',
      },
    ],
  },
  portsec: {
    full: 'The switch only accepts known MACs',
    description:
      'Port security limits which MACs may talk on each switch port: a maximum count, fixed addresses, or ones learned on the fly (sticky). When an unauthorised MAC shows up there are three possible reactions; the harshest, shutdown, leaves the port err-disabled until someone brings it back.',
    facts: [
      ['Layer', 'Data link (layer 2)'],
      ['Enabling it', 'switchport port-security (on access ports)'],
      ['Violation modes', 'protect · restrict · shutdown (the default)'],
      ['Sticky', 'Learns the MAC and writes it into the configuration'],
      ['Recovery', 'shutdown + no shutdown, or errdisable recovery'],
      ['Checking', 'show port-security interface g0/3'],
    ],
    notes: [
      'Someone unplugs the printer and connects another device. Its MAC is not the one learned on Gi0/3: violation.',
      'Shutdown mode: the port goes down (err-disabled) and the switch reports it over syslog and SNMP.',
      'With errdisable recovery the switch retries after 300 s; otherwise a technician does shutdown + no shutdown.',
      'With the printer back, its MAC matches the learned one and the port carries traffic again.',
    ],
    quiz: [
      {
        q: 'With port security in shutdown mode, what happens on an unauthorised MAC?',
        options: ['Only that frame is dropped', 'The whole port goes err-disabled', 'The switch clears its MAC table'],
        answer: 1,
        why: 'shutdown (the default mode) turns the port off: it stays err-disabled until re-armed.',
      },
      {
        q: 'What does the sticky option do?',
        options: ['Pins the port to a VLAN', 'Learns the connected MAC and keeps it in the configuration', 'Blocks the port when the device powers off'],
        answer: 1,
        why: 'sticky turns the first learned MAC into part of the running-config (save it with copy run start).',
      },
    ],
  },
  acl: {
    full: 'Access control lists',
    description:
      'An ACL is a list of permit/deny rules the router evaluates in order on every packet; the first match decides, and an implicit deny at the end drops everything else. Standard ACLs (1–99) look only at the source IP; extended ones (100–199) look at source, destination, protocol and ports.',
    facts: [
      ['Layer', 'Network (layer 3), on router interfaces'],
      ['Standard', '1–99: source IP only (place near the destination)'],
      ['Extended', '100–199: IPs, protocol and ports (near the source)'],
      ['Order', 'First match wins; implicit deny at the end'],
      ['Wildcard', '0.0.0.255 = “the last octet doesn’t matter”'],
      ['Checking', 'show access-lists · show ip interface g0/1'],
    ],
    notes: [
      'The VLAN 20 host tries to open Telnet to the outside. On the router’s G0/1 there is an extended ACL: deny tcp 192.168.20.0 0.0.0.255 any eq 23.',
      'The deny rule matches, so the router drops the SYN and answers with ICMP type 3 code 13. With «no ip unreachables» it would not even warn.',
      'The client asks to open a connection and proposes its initial sequence number.',
      'The server accepts, confirms the client’s sequence and sends its own.',
      'The client confirms: the connection is established (three-way handshake) — HTTPS is allowed by the ACL.',
    ],
    quiz: [
      {
        q: 'What happens to a packet that matches no ACL rule?',
        options: ['It is permitted', 'The implicit deny at the end drops it', 'It is forwarded to the administrator'],
        answer: 1,
        why: 'Every ACL ends in an implicit deny any: whatever is not explicitly permitted gets dropped.',
      },
      {
        q: 'What does a standard ACL (1–99) check?',
        options: ['Only the source IP', 'IPs, protocol and ports', 'The source MAC'],
        answer: 0,
        why: 'Standard ACLs only look at the source IP, which is why they sit near the destination. Extended ones (100–199) look at much more.',
      },
    ],
  },
}
