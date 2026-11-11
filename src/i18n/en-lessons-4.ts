import type { LessonText } from './types'

const L7 = 'Application (layer 7)'

export const LESSONS_EN_4: Record<string, LessonText> = {
  mdns: {
    full: 'Multicast DNS (Bonjour, Avahi)',
    description:
      'At home there is no DNS server that knows "impresora.local". With mDNS every device asks the whole local network by multicast and the owner of the name answers itself. Together with DNS-SD it also discovers services, such as printers or speakers, with zero configuration.',
    facts: [['Layer', L7], ['Port', '5353'], ['Transport', 'UDP multicast'], ['Address', '224.0.0.251 (ff02::fb in IPv6)'], ['Domain', '.local'], ['Specification', 'RFC 6762, RFC 6763']],
    notes: [
      'The laptop asks the whole network: who is impresora.local?',
      'The printer itself answers, also by multicast, so everyone can store it in their cache.',
      'Now it looks for services: who prints over IPP on this network?',
      'The printer announces its service; the system lists it without any setup.',
    ],
    quiz: [
      { q: 'Who answers an mDNS query for "impresora.local"?', options: ['An Internet DNS server', 'The printer itself', 'The router'], answer: 1, why: 'In mDNS each device answers for its own names.' },
      { q: 'Where are mDNS queries sent?', options: ['224.0.0.251', '8.8.8.8', '255.255.255.255'], answer: 0, why: 'It is the mDNS multicast group in IPv4, port 5353.' },
    ],
  },
  ssdp: {
    full: 'Media device discovery',
    description:
      'SSDP is how a phone finds the TV to cast a video. It sends an M-SEARCH by multicast; devices answer with the address of an XML document describing what they can do. The messages look like HTTP but travel over UDP.',
    facts: [['Layer', L7], ['Port', '1900'], ['Transport', 'UDP multicast'], ['Address', '239.255.255.250'], ['Messages', 'M-SEARCH, NOTIFY, 200 responses'], ['Basis of', 'UPnP and DLNA']],
    notes: [
      'The laptop asks the network: which UPnP devices are here?',
      'The TV answers directly with the address of its description.',
      'The laptop downloads the description to learn which services it offers.',
      'XML with the model and its services, such as playing content.',
      'Every so often the TV announces on its own that it is still available.',
    ],
    quiz: [
      { q: 'Which message does a device send to look for others via SSDP?', options: ['M-SEARCH', 'GET', 'SYN'], answer: 0, why: 'M-SEARCH goes by multicast to 239.255.255.250:1900.' },
      { q: 'What does the LOCATION header of the response give?', options: ['Where the XML description lives', 'The device’s city', 'Its MAC'], answer: 0, why: 'The client downloads that XML to learn the services.' },
    ],
  },
  lldp: {
    full: 'Link-layer neighbour discovery',
    description:
      'LLDP lets switches, phones and access points introduce themselves to their direct neighbours: name, port, capabilities and management address. That way an administrator can map the network without tracing cables by hand.',
    facts: [['Layer', 'Data link (layer 2)'], ['EtherType', '0x88cc'], ['Destination', '01:80:c2:00:00:0e'], ['Format', 'TLV: type, length, value'], ['Interval', '30 s, valid for 120 s'], ['Specification', 'IEEE 802.1AB']],
    notes: [
      'Switch 1 introduces itself: "I am switch-1, talking to you from my port Gi0/24".',
      'The neighbour does the same: now each knows who is at the other end of the cable.',
      'It repeats every 30 s; if it stops arriving, the neighbour is forgotten after 120 s.',
    ],
    quiz: [
      { q: 'What is LLDP for?', options: ['Letting devices introduce themselves to direct neighbours', 'Assigning IPs', 'Encrypting frames'], answer: 0, why: 'Each device announces its name, port and capabilities to the other end of the cable.' },
      { q: 'Does LLDP cross routers?', options: ['Yes', 'No, it only reaches the direct neighbour', 'Only at night'], answer: 1, why: 'It goes to a reserved MAC that switches do not forward.' },
    ],
  },
  vrrp: {
    full: 'Gateway redundancy',
    description:
      'If the network’s router breaks, nobody reaches the Internet. With VRRP two routers share a virtual IP: the one with the higher priority serves it and announces it is alive. If its announcements stop, the backup takes over the IP within a second, with no change on the devices.',
    facts: [['Layer', 'Network (layer 3)'], ['IP protocol', '112'], ['Address', '224.0.0.18'], ['Virtual IP', '192.168.1.254 (the gateway)'], ['Advertisements', 'Every 1 s, TTL 255'], ['Specification', 'RFC 9568']],
    notes: [
      'The main router (priority 120) announces it serves the virtual IP.',
      'One advertisement per second: the backup keeps listening.',
      'After about 3.6 s without advertisements, the backup router declares itself master and serves the virtual IP.',
      'The laptop keeps using the same gateway; the backup router now handles it.',
    ],
    quiz: [
      { q: 'What do the routers share in VRRP?', options: ['A virtual gateway IP', 'The same physical MAC', 'The same cable'], answer: 0, why: 'Devices use the virtual IP; the master router serves it.' },
      { q: 'When does the backup router take over?', options: ['When the master’s advertisements stop', 'Every hour', 'When the user asks'], answer: 0, why: 'After about three missed intervals, the backup becomes master.' },
    ],
  },
  rip: {
    full: 'Routing Information Protocol',
    description:
      'RIP is the simplest routing protocol: every router sends its whole table to its neighbours every 30 seconds and measures distance in hops. A route with 16 hops means "unreachable", which limits RIP to small networks.',
    facts: [['Layer', 'Network (routing over UDP 520)'], ['Address', '224.0.0.9 (RIPv2)'], ['Metric', 'Hops, 15 at most'], ['Updates', 'Full table every 30 s'], ['Type', 'Distance vector'], ['Specification', 'RFC 2453']],
    notes: [
      'On start-up, the router asks its neighbours for their whole table.',
      'The neighbour announces it reaches 10.0.0.0/8 in 1 hop.',
      'And it announces its local network; each adds 1 hop to what it learns.',
      'Every 30 s the table is repeated, even if nothing changed.',
      'Metric 16 = unreachable: the network went down and the route is withdrawn.',
    ],
    quiz: [
      { q: 'What does the RIP metric measure?', options: ['Hops to the network', 'Bandwidth', 'Latency'], answer: 0, why: 'RIP counts routers crossed; 16 means unreachable.' },
      { q: 'How often does RIP send its table?', options: ['Every 30 s', 'Every hour', 'Only at start-up'], answer: 0, why: 'It sends the full table every 30 seconds.' },
    ],
  },
  gre: {
    full: 'Generic Routing Encapsulation (tunnels)',
    description:
      'GRE puts a whole IP packet inside another one to carry it through a tunnel between two routers. It encrypts nothing: it joins networks or carries protocols that would not otherwise get across, and is often combined with IPsec for protection.',
    facts: [['Layer', 'Network (layer 3)'], ['IP protocol', '47'], ['Header', '4 bytes (plus options)'], ['Encryption', 'None'], ['Uses', 'Site tunnels, PPTP, multicast over tunnels'], ['Specification', 'RFC 2784']],
    notes: [
      'The router puts the laptop’s ping, as is, inside a packet addressed to the far end of the tunnel.',
      'The reply comes back encapsulated; once unwrapped, the remote network seems next door.',
      'A keepalive checks the tunnel is still working.',
    ],
    quiz: [
      { q: 'What does GRE do with the original packet?', options: ['Puts it whole inside another IP packet', 'Encrypts it', 'Compresses it'], answer: 0, why: 'GRE encapsulates; for encryption it is combined with IPsec.' },
      { q: 'Which IP protocol number does GRE use?', options: ['47', '6', '17'], answer: 0, why: 'IP protocol 47; TCP is 6 and UDP 17.' },
    ],
  },
  syslog: {
    full: 'Centralised event logging',
    description:
      'Routers, servers and applications send their log messages to a central server with Syslog. Each line carries a priority that combines where it comes from (facility) and its severity, from 0 (emergency) to 7 (debug).',
    facts: [['Layer', L7], ['Port', '514 (6514 with TLS)'], ['Transport', 'UDP (or TCP)'], ['Priority', 'facility × 8 + severity'], ['Severities', '0 emergency … 7 debug'], ['Specification', 'RFC 5424']],
    notes: [
      'Priority 38 = facility 4 (auth) × 8 + severity 6 (informational): someone logged in.',
      'Priority 28 = facility 3 (daemon) × 8 + severity 4 (warning): a port went down.',
      'Severity 6 again: the link is back. The server keeps everything with its timestamp.',
    ],
    quiz: [
      { q: 'What does the number in < > at the start of a Syslog message mean?', options: ['The priority: facility and severity', 'The port', 'The message number'], answer: 0, why: 'Priority = facility × 8 + severity.' },
      { q: 'Which severity is the most urgent?', options: ['0', '4', '7'], answer: 0, why: '0 is emergency; 7 is debug.' },
    ],
  },
  wol: {
    full: 'Switching a computer on over the network',
    description:
      'A computer that is off has no IP, but its network card is still listening. Wake-on-LAN broadcasts a "magic packet": six 0xFF bytes followed by the computer’s MAC repeated 16 times. When the card recognises its MAC, it powers the computer on.',
    facts: [['Layer', 'Data link (layer 2)'], ['Transport', 'UDP to port 7 or 9 (or Ethernet 0x0842)'], ['Destination', 'Broadcast 255.255.255.255'], ['Content', '6 × 0xFF + 16 × MAC'], ['Requirement', 'Enabled in BIOS and network card'], ['Origin', 'AMD, 1995']],
    notes: [
      'The laptop broadcasts the magic packet with the MAC of the server, which is off.',
      'A few seconds later, a ping to check whether it has booted.',
      'It answers: the server is on and on the network.',
    ],
    quiz: [
      { q: 'What does the magic packet contain?', options: ['6 bytes of 0xFF and the MAC repeated 16 times', 'A password', 'The computer’s IP'], answer: 0, why: 'The network card recognises that pattern with its own MAC.' },
      { q: 'Why is it sent by broadcast?', options: ['Because the switched-off computer has no IP', 'Because it is faster', 'For security'], answer: 0, why: 'With no IP or ARP entry, only a broadcast reaches its card.' },
    ],
  },
}
