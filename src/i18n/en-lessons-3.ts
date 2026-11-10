import { HS } from './en-lessons-1'
import type { LessonText } from './types'

const L7 = 'Application (layer 7)'

export const LESSONS_EN_3: Record<string, LessonText> = {
  nat: {
    full: 'Network Address Translation',
    description:
      'Your home has a single public IP but many devices with private IPs. The router rewrites the source address and port of every outgoing packet, records the change in its NAT table and undoes the translation when the reply comes back.',
    facts: [['Layer', 'Network (layer 3)'], ['Home variant', 'NAPT (port is changed too)'], ['Private IPs', '10/8, 172.16/12, 192.168/16'], ['Table', 'Private IP:port ↔ public port'], ['Effect', 'Connections cannot be started from outside'], ['Specification', 'RFC 3022, RFC 1918']],
    notes: [
      'The laptop sends from its private IP 192.168.1.10, port 52344.',
      'The router replaces the source with its public IP 198.51.100.37:40001 and records the translation.',
      'The server only knows the public IP and replies to it.',
      'The router looks up port 40001 in its table and returns the packet to the laptop.',
      'Every packet of this connection gets the same translation.',
      'Source rewritten again; the TCP checksum is recomputed too.',
    ],
    quiz: [
      { q: 'What does the router change in an outgoing packet with NAT?', options: ['The source IP and port', 'The HTTP content', 'The server’s MAC'], answer: 0, why: 'It replaces the private IP and port with its public IP and a port of its own.' },
      { q: 'How does the router know who to return the reply to?', options: ['Its NAT table', 'By asking DNS', 'By broadcast'], answer: 0, why: 'The table maps each public port to the private IP and port.' },
    ],
  },
  traceroute: {
    full: 'Discovering the path hop by hop',
    description:
      'Traceroute exploits the TTL: it sends probes with TTL 1, 2, 3… Each router that brings the TTL to zero drops the probe and reports back with an ICMP "Time Exceeded", revealing its address. When the probe reaches the destination, it answers "Port Unreachable" and the journey ends.',
    facts: [['Layer', 'Network (layer 3)'], ['Probes', 'UDP to high ports (33434+) or ICMP'], ['Replies', 'ICMP type 11 and type 3'], ['Command', 'traceroute / tracert'], ['Measures', 'Hops and latency of each'], ['Basis', 'RFC 792 (ICMP), RFC 1393']],
    notes: [
      'First probe towards the web server, but with TTL 1.',
      'The router lowers the TTL to 0, drops it and reports: hop 1 = 192.168.1.1 (2 ms).',
      'Second probe with TTL 2: it gets past the first router and dies at the next.',
      'Hop 2 = 198.51.100.1, the provider’s router (9 ms).',
      'Third probe: now it reaches the destination.',
      'Nobody listens on port 33436: the destination says so and traceroute knows it is done (14 ms).',
    ],
    quiz: [
      { q: 'Which field does traceroute exploit?', options: ['The TTL', 'The checksum', 'The TCP window'], answer: 0, why: 'It sends probes with growing TTL and each router that exhausts it gives itself away.' },
      { q: 'Which message does an intermediate router send back?', options: ['ICMP Time Exceeded', 'TCP RST', 'HTTP 404'], answer: 0, why: 'ICMP type 11: the TTL reached zero in transit.' },
    ],
  },
  http2: {
    full: 'Binary, multiplexed HTTP',
    description:
      'HTTP/2 keeps the same methods and headers as HTTP/1.1 but sends them in binary frames. Several requests travel at once over a single connection, each on its own stream, and headers are compressed with HPACK. The frames are shown here already decrypted.',
    facts: [['Layer', L7], ['Port', '443'], ['Transport', 'TCP + TLS (ALPN "h2")'], ['Unit', 'Frames: HEADERS, DATA, SETTINGS…'], ['Compression', 'HPACK'], ['Specification', 'RFC 9113']],
    notes: [
      ...HS,
      'In the TLS handshake the browser offers HTTP/2 via ALPN.',
      'The server picks h2.',
      'The client sends the magic string "PRI * HTTP/2.0" and its settings.',
      'The server sends its own (and acknowledges the client’s).',
      'Request for the page on stream 1, with HPACK headers.',
      'Without waiting, it asks for the stylesheet on stream 3.',
      'The CSS arrives first: streams are independent.',
      'Then the page, all over the same connection.',
    ],
    quiz: [
      { q: 'What does HTTP/2 allow compared with HTTP/1.1?', options: ['Several requests at once on one connection', 'Using UDP', 'Dropping headers'], answer: 0, why: 'Each request goes on its own stream within the same connection.' },
      { q: 'How are headers compressed?', options: ['With HPACK', 'With ZIP', 'They are not'], answer: 0, why: 'HPACK uses index tables and Huffman coding.' },
    ],
  },
  kerberos: {
    full: 'Ticket-based authentication',
    description:
      'Kerberos avoids sending the password over the network. At sign-in the key distribution centre (KDC) issues a master ticket (TGT). With it you request tickets for each service, such as a shared folder, which are shown to the server as proof of identity.',
    facts: [['Layer', L7], ['Port', '88'], ['Transport', 'UDP and TCP'], ['Messages', 'AS-REQ/REP, TGS-REQ/REP, AP-REQ'], ['Typical use', 'Active Directory'], ['Specification', 'RFC 4120']],
    notes: [
      'The computer asks for a master ticket for the user.',
      'The KDC demands pre-authentication: prove you know the password.',
      'It sends the current time encrypted with a key derived from the password.',
      'It receives the TGT, valid for about 10 hours.',
      'To open the shared folder, it asks for a ticket for that service, presenting the TGT.',
      'It receives the ticket for "cifs/servidor".',
      'It presents it to the file server, which validates it without talking to the KDC.',
      'Access granted without the password ever crossing the network.',
    ],
    quiz: [
      { q: 'What does the KDC issue at sign-in?', options: ['A TGT (master ticket)', 'The encrypted password', 'An IP'], answer: 0, why: 'With the TGT, tickets for each service are requested later.' },
      { q: 'Does the password travel over the network with Kerberos?', options: ['Yes, in clear', 'No', 'Only the first time'], answer: 1, why: 'Only data encrypted with keys derived from it travels.' },
    ],
  },
  tftp: {
    full: 'Trivial File Transfer Protocol',
    description:
      'TFTP is a minimal FTP over UDP, with no users or listings: just read or write a file in 512-byte blocks, each confirmed with an ACK. It is used to boot machines over the network (PXE) and to load firmware or configurations.',
    facts: [['Layer', L7], ['Port', '69'], ['Transport', 'UDP'], ['Blocks', '512 bytes; a shorter one marks the end'], ['Security', 'None'], ['Specification', 'RFC 1350']],
    notes: [
      'Asks to read the file in binary mode.',
      'First 512-byte block.',
      'Acknowledgement: the next block is not sent until it arrives.',
      'This block is shorter than 512 bytes: it is the last one.',
      'Transfer complete: 812 bytes.',
    ],
    quiz: [
      { q: 'How does a TFTP client know the transfer is over?', options: ['A block shorter than 512 bytes arrives', 'A TCP FIN', 'An email'], answer: 0, why: 'A block shorter than 512 bytes marks the end.' },
      { q: 'Which transport does TFTP use?', options: ['UDP', 'TCP', 'ICMP'], answer: 0, why: 'UDP port 69, with its own per-block ACKs.' },
    ],
  },
  telnet: {
    full: 'Unencrypted remote terminal',
    description:
      'Telnet was the classic way to control a machine remotely. Everything, password included, travels in plain text: anyone along the way can read it. That is why it was replaced by SSH, though it still shows up on old equipment.',
    facts: [['Layer', L7], ['Port', '23'], ['Transport', 'TCP'], ['Negotiation', 'IAC commands (0xFF)'], ['Security', 'None: use SSH'], ['Specification', 'RFC 854']],
    notes: [
      ...HS,
      'Option negotiation with 0xFF (IAC) bytes.',
      'The router asks for the user name.',
      'The user name travels in clear…',
      'It asks for the password.',
      '…and so does the password: look at the bytes in the inspector.',
      'Session open.',
    ],
    quiz: [
      { q: 'Why should Telnet not be used?', options: ['Everything, password included, is unencrypted', 'It is too fast', 'It does not work on routers'], answer: 0, why: 'Anyone along the way can read the session: use SSH.' },
      { q: 'Which byte starts a negotiation command?', options: ['0xFF (IAC)', '0x00', '0x7F'], answer: 0, why: 'IAC, "Interpret As Command", precedes WILL, DO, etc.' },
    ],
  },
  coap: {
    full: 'Constrained Application Protocol',
    description:
      'CoAP is "HTTP for microcontrollers": the same verbs (GET, POST…) and similar codes (2.05 = 200), but in tiny binary messages over UDP. With the Observe option, the client is notified every time the value changes.',
    facts: [['Layer', L7], ['Port', '5683 (5684 with DTLS)'], ['Transport', 'UDP'], ['Header', '4 bytes'], ['Messages', 'CON, NON, ACK, RST'], ['Specification', 'RFC 7252, RFC 7641']],
    notes: [
      'Confirmable request: the sensor must acknowledge it.',
      'The response rides inside the ACK itself: 21.5 °C.',
      'Now it subscribes with the Observe option.',
      'Confirmed: it will notify when the value changes.',
      'Non-confirmable notification with the new value.',
    ],
    quiz: [
      { q: 'What does CoAP code 2.05 correspond to?', options: ['A 200 OK with content', 'A 404', 'An error'], answer: 0, why: '2.05 Content is the successful response with data.' },
      { q: 'What does the Observe option do?', options: ['Get notified when the resource changes', 'Encrypt the message', 'Delete the resource'], answer: 0, why: 'The server reports every change without new requests.' },
    ],
  },
  ble: {
    full: 'Bluetooth Low Energy',
    description:
      'BLE devices, such as wristbands or sensors, advertise their presence on three advertising channels. The phone scans for them, connects, and reads or receives their data through ATT/GATT: attributes with an identifier (handle), such as heart rate.',
    facts: [['Layer', 'Link + application (own stack)'], ['Band', '2.4 GHz, 40 channels (3 for advertising)'], ['Address', '48 bits, like a MAC'], ['Data', 'GATT: services and characteristics'], ['Power use', 'Months or years on a coin cell'], ['Specification', 'Bluetooth Core 5.x']],
    notes: [
      'The wristband advertises itself: name and heart-rate service.',
      'The phone asks for more information.',
      'Scan response with extra data.',
      'The phone opens the connection and sets how often they will talk.',
      'Reads the sensor-location characteristic.',
      'Value 2: wrist.',
      'Every second it sends a notification with the pulse: 72 beats per minute.',
    ],
    quiz: [
      { q: 'How does the phone discover a BLE wristband?', options: ['By listening to its advertisements (ADV_IND)', 'Through DNS', 'With a cable'], answer: 0, why: 'Devices advertise on the advertising channels.' },
      { q: 'Which protocol is used to read data such as the pulse?', options: ['ATT/GATT', 'SMTP', 'BGP'], answer: 0, why: 'Data are GATT attributes read or notified through ATT.' },
    ],
  },
}
