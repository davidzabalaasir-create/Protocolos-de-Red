import type { LessonText } from './types'

/** TCP three-way handshake notes, shared by every lesson that opens a TCP connection. */
export const HS = [
  'The client asks to open a connection and proposes its initial sequence number.',
  "The server accepts, acknowledges the client's sequence number and sends its own.",
  'The client confirms: the connection is established (three-way handshake).',
]

export const LESSONS_EN_1: Record<string, LessonText> = {
  http: {
    full: 'Hypertext Transfer Protocol',
    description:
      'HTTP is the language of the web. The browser sends a request (method, path and headers) and the server replies with a status code, its headers and usually a body such as an HTML page. In HTTP/1.1 everything travels as readable text.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '80 (HTTPS: 443)'],
      ['Transport', 'TCP'],
      ['Format', 'Text: headers + optional body'],
      ['Methods', 'GET, POST, PUT, DELETE, HEAD'],
      ['Specification', 'RFC 9110, RFC 9112'],
    ],
    notes: [
      'Before connecting, the browser needs the IP of the domain and asks the DNS resolver.',
      'The resolver returns the IP address of the web server.',
      ...HS,
      'The browser requests the root page with headers such as Host, User-Agent and Accept.',
      'The server replies 200 OK and sends the HTML, split across several TCP segments.',
      'The client acknowledges receiving every byte.',
    ],
    quiz: [
      { q: 'What happens before the GET is sent?', options: ['The name is resolved via DNS and a TCP connection is opened', 'The server sends the page unasked', 'A TLS key is negotiated'], answer: 0, why: 'The browser needs the IP (DNS) and a TCP connection before speaking HTTP.' },
      { q: 'What does status code 200 mean?', options: ['Redirect', 'Success: here is the resource', 'Resource not found'], answer: 1, why: '2xx is success; 3xx redirect; 4xx client error.' },
    ],
  },
  https: {
    full: 'HTTP over TLS',
    description:
      'HTTPS is HTTP inside a TLS tunnel. After opening the TCP connection, client and server negotiate keys with a TLS handshake; from then on requests and responses travel encrypted and nobody along the way can read or modify them.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '443'],
      ['Transport', 'TCP (or QUIC in HTTP/3)'],
      ['Encryption', 'TLS 1.3 / 1.2'],
      ['Authentication', "Server's X.509 certificate"],
      ['Specification', 'RFC 9110, RFC 8446'],
    ],
    notes: [
      ...HS,
      'The client proposes versions and ciphers and sends its share of the key exchange.',
      'The server picks the cipher, presents its certificate and proves it holds the private key.',
      'The client verifies the certificate and finishes the handshake: the channel is now encrypted.',
      'The HTTP request travels encrypted; an observer only sees random-looking bytes.',
      'The response also arrives encrypted and the browser decrypts it.',
    ],
    quiz: [
      { q: "What does the server's certificate provide?", options: ['It compresses the page', 'Proof that the server is who it claims to be', 'An IP address'], answer: 1, why: 'The certificate, signed by an authority, authenticates the server.' },
      { q: 'After the TLS handshake, how does the HTTP request travel?', options: ['In plain text', 'Encrypted as Application Data', 'Over UDP'], answer: 1, why: 'Everything after the handshake travels encrypted in Application Data records.' },
    ],
  },
  dns: {
    full: 'Domain Name System',
    description:
      'DNS turns names like www.ejemplo.com into IP addresses. Your computer asks a resolver, which walks the hierarchy: a root server, the top-level domain server (.com) and finally the authoritative server for the domain.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '53'],
      ['Transport', 'UDP (TCP for large answers)'],
      ['Records', 'A, AAAA, CNAME, MX, TXT, NS'],
      ['Cache', 'According to each record’s TTL'],
      ['Specification', 'RFC 1034, RFC 1035'],
    ],
    notes: [
      'The client asks the resolver to find the IP for it (recursive query).',
      'The resolver has nothing cached, so it starts with a root server.',
      "The root doesn't know the answer, but knows who runs .com.",
      'The resolver asks the .com TLD server.',
      'The TLD points to the authoritative servers for ejemplo.com.',
      "Last hop: the domain's authoritative server.",
      'The authoritative server gives the final answer and how long it may be cached.',
      'The resolver caches it and hands it to the client.',
    ],
    quiz: [
      { q: 'Who does a resolver with an empty cache ask first?', options: ['The web server', 'A root server', 'The home router'], answer: 1, why: 'Iterative resolution starts at the root, then the TLD and finally the authoritative server.' },
      { q: 'What is a record’s TTL for?', options: ['How long it may be cached', 'How many hops it may take', 'Its maximum size'], answer: 0, why: 'The TTL says for how many seconds the answer stays valid in cache.' },
    ],
  },
  dhcp: {
    full: 'Dynamic Host Configuration Protocol',
    description:
      "When a device joins the network it has no IP address. DHCP assigns one automatically in four steps (DORA): Discover, Offer, Request and Acknowledge, together with the gateway and DNS servers.",
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Ports', '67 (server), 68 (client)'],
      ['Transport', 'UDP, broadcast'],
      ['Provides', 'IP, mask, gateway, DNS'],
      ['Lease', 'Temporary, renewed'],
      ['Specification', 'RFC 2131'],
    ],
    notes: [
      'With no IP yet, the client shouts to the whole network: is there a DHCP server?',
      'The router (DHCP server) offers a free address.',
      'The client formally accepts that offer.',
      'Confirmed: the client may use the IP for 24 hours.',
    ],
    quiz: [
      { q: 'What is the right order of DHCP?', options: ['Request, Offer, Discover, ACK', 'Discover, Offer, Request, ACK', 'Offer, Discover, ACK, Request'], answer: 1, why: 'DORA: Discover, Offer, Request, Acknowledge.' },
      { q: 'Why does the Discover go to 255.255.255.255?', options: ["Because the client doesn't know the server and has no IP yet", 'To go faster', 'Because it uses TCP'], answer: 0, why: 'With no IP and no known server, broadcast is the only option.' },
    ],
  },
  tcp: {
    full: 'Transmission Control Protocol',
    description:
      'TCP provides a reliable, ordered byte stream over a network that can lose or reorder packets. It numbers every byte, requires acknowledgements (ACK), retransmits what is lost and paces itself so it does not flood the network.',
    facts: [
      ['Layer', 'Transport (layer 4)'],
      ['Connection', 'Yes: three-way handshake'],
      ['Reliability', 'ACK + retransmission'],
      ['Order', 'Guaranteed by sequence numbers'],
      ['Control', 'Flow and congestion control'],
      ['Specification', 'RFC 9293'],
    ],
    notes: [
      ...HS,
      'The client sends 120 bytes of application data.',
      'The server confirms it received up to byte 120.',
      'The client has nothing more to send and closes its side.',
      'The server confirms and closes its side too.',
      'Final ACK: the connection is closed.',
    ],
    quiz: [
      { q: 'How many messages does the TCP opening handshake have?', options: ['2', '3', '4'], answer: 1, why: 'SYN, SYN-ACK and ACK: the three-way handshake.' },
      { q: 'What does TCP do if a segment is lost?', options: ['Ignores it', 'Retransmits it when no ACK arrives', 'Closes the connection'], answer: 1, why: 'Without a timely acknowledgement, the sender retransmits.' },
    ],
  },
  udp: {
    full: 'User Datagram Protocol',
    description:
      'UDP sends standalone datagrams with no connection, no acknowledgements and no retries. It is minimal and fast, ideal for voice, live video or games, where arriving late is worse than not arriving.',
    facts: [
      ['Layer', 'Transport (layer 4)'],
      ['Connection', 'No'],
      ['Reliability', 'None: data can be lost'],
      ['Header', '8 bytes'],
      ['Uses', 'DNS, VoIP, streaming, games, QUIC'],
      ['Specification', 'RFC 768'],
    ],
    notes: [
      'The video server sends the first chunk without setting up a connection.',
      'Next datagram, independent of the previous one.',
      "This datagram is lost in the network. UDP doesn't resend it: the player hides the glitch.",
      'The stream carries on without waiting for anyone.',
    ],
    quiz: [
      { q: 'What does UDP do with a lost datagram?', options: ['Resends it', "Nothing: it neither notices nor resends", 'Asks the router to find it'], answer: 1, why: 'UDP has no acknowledgements or retransmissions.' },
      { q: 'Why is UDP a good fit for live voice?', options: ['Because it encrypts data', 'Because late data is useless and it is better to keep going', 'Because it guarantees order'], answer: 1, why: 'In real time, latency matters more than reliability.' },
    ],
  },
  icmp: {
    full: 'Internet Control Message Protocol',
    description:
      "ICMP is the network layer's notification channel: it reports unreachable destinations or packets whose TTL ran out. The ping tool uses it to check whether a host answers and how long it takes.",
    facts: [
      ['Layer', 'Network (layer 3)'],
      ['Port', 'No ports'],
      ['Transport', 'Directly over IP'],
      ['Common types', 'Echo (8), Echo Reply (0), Time Exceeded (11)'],
      ['Tools', 'ping, traceroute'],
      ['Specification', 'RFC 792'],
    ],
    notes: [
      'ping sends an echo request to 8.8.8.8.',
      'Reply in 14 ms: the host is up and reachable.',
      'A second later, ping repeats the test.',
      'Second reply: 13 ms round trip.',
    ],
    quiz: [
      { q: 'Which ICMP message does ping send?', options: ['Echo Request (type 8)', 'Time Exceeded (type 11)', 'Redirect (type 5)'], answer: 0, why: 'ping sends Echo Request and waits for Echo Reply (type 0).' },
      { q: 'Does ICMP use ports?', options: ['Yes, port 7', 'No, it sits directly on IP', 'Yes, port 53'], answer: 1, why: 'ICMP is a layer 3 protocol without ports.' },
    ],
  },
  arp: {
    full: 'Address Resolution Protocol',
    description:
      'On a local network, Ethernet frames are delivered by MAC address, not by IP. ARP broadcasts "who has this IP?" and the owner answers with its MAC; the switch learns which port each device is on.',
    facts: [
      ['Layer', 'Data link (layer 2)'],
      ['Scope', 'Local network only'],
      ['Destination', 'Broadcast ff:ff:ff:ff:ff:ff'],
      ['Cache', "The system's ARP table"],
      ['IPv6 equivalent', 'NDP'],
      ['Specification', 'RFC 826'],
    ],
    notes: [
      'The client wants to print but only knows the IP; it broadcasts an ARP question.',
      'The switch forwards the broadcast out of every port.',
      'The printer answers directly with its MAC address.',
      'With the MAC known, the client sends frames that the switch delivers only to that port.',
    ],
    quiz: [
      { q: 'What does ARP find out?', options: ['The IP from a name', 'The MAC from an IP', 'The open port'], answer: 1, why: "ARP maps a local IP to its owner's MAC address." },
      { q: 'Who receives the ARP question?', options: ['Everyone (broadcast ff:ff:ff:ff:ff:ff)', 'The DNS server', 'Only the router'], answer: 0, why: 'Since the MAC is unknown, the question goes to the whole local network.' },
    ],
  },
  ssh: {
    full: 'Secure Shell',
    description:
      'SSH opens an encrypted remote session to manage servers. After the TCP handshake both sides exchange versions and algorithms, agree on keys with Diffie-Hellman, the server proves its identity and the user signs in with a public key or a password.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '22'],
      ['Transport', 'TCP'],
      ['Key exchange', 'Curve25519 / ECDH'],
      ['Authentication', 'Public key or password'],
      ['Specification', 'RFC 4251–4254'],
    ],
    notes: [
      ...HS,
      'Both sides announce their protocol and software version.',
      'The client lists supported algorithms and sends its ephemeral key.',
      'The server answers and signs with its host key; the client checks it against known_hosts.',
      'Now encrypted, the user authenticates with their public key.',
      'Authentication succeeded: a channel to the remote shell opens.',
    ],
    quiz: [
      { q: 'How does the client check it is talking to the right server?', options: ['By response speed', 'By comparing the host key with known_hosts', 'By port 22'], answer: 1, why: 'The host key signature is checked against the one stored in known_hosts.' },
      { q: 'When is the user authentication sent?', options: ['Before the key exchange', 'Already encrypted, after NEWKEYS', 'In the SYN'], answer: 1, why: 'Keys are agreed first; everything after, including authentication, is encrypted.' },
    ],
  },
  smtp: {
    full: 'Simple Mail Transfer Protocol',
    description:
      'SMTP delivers email. The client holds a text dialogue with the server: it introduces itself, names sender and recipients, sends the message after DATA and ends it with a dot on a line of its own.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Ports', '25 (servers), 587 (submission)'],
      ['Transport', 'TCP, with STARTTLS'],
      ['Format', 'Text commands and 3-digit codes'],
      ['Reading mail', 'Paired with IMAP or POP3'],
      ['Specification', 'RFC 5321'],
    ],
    notes: [
      ...HS,
      'The server greets first with code 220.',
      'The client introduces itself and asks for the list of extensions.',
      'It gives the envelope sender.',
      'It gives the recipient; this can repeat for several.',
      'It sends headers and body, ending with a line containing only a dot.',
      'The server accepts the message and queues it for delivery.',
    ],
    quiz: [
      { q: 'How is the end of the message marked after DATA?', options: ['With a line containing only a dot', 'With QUIT', 'By closing TCP'], answer: 0, why: 'A line with "." marks the end of the email body.' },
      { q: 'Who speaks first in SMTP?', options: ['The client with EHLO', 'The server with a 220 greeting', 'Nobody: it starts with DATA'], answer: 1, why: 'After connecting, the server greets with 220 and then the client sends EHLO.' },
    ],
  },
  websocket: {
    full: 'Two-way channel over HTTP',
    description:
      'WebSocket turns an HTTP connection into a permanent two-way channel. The browser asks for an "upgrade" and, after the 101, client and server send each other small frames at any time: ideal for chats, games and live dashboards.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '80 (ws) / 443 (wss)'],
      ['Transport', 'TCP'],
      ['Start', 'GET with Upgrade: websocket'],
      ['Unit', 'Frames (text, binary, ping, close)'],
      ['Specification', 'RFC 6455'],
    ],
    notes: [
      ...HS,
      'The browser asks to switch protocols and includes a random key (Sec-WebSocket-Key).',
      'The server agrees and returns a hash of that key: from here on, no more HTTP.',
      "The client's frames are masked with 4 random bytes.",
      'The server can write whenever it likes, without waiting for a request.',
      'A periodic ping checks the connection is still alive.',
      'The client answers with an identical pong.',
    ],
    quiz: [
      { q: 'Which response accepts the switch to WebSocket?', options: ['200 OK', '101 Switching Protocols', '301 Moved'], answer: 1, why: 'The 101 confirms the protocol change.' },
      { q: 'Which frames are masked?', options: ["The server's", "The client's", 'None'], answer: 1, why: 'The standard requires client-to-server frames to be masked.' },
    ],
  },
  http3: {
    full: 'HTTP over QUIC',
    description:
      'HTTP/3 runs over QUIC, an encrypted transport built on top of UDP. QUIC merges the transport and TLS 1.3 handshakes into a single round trip and multiplexes independent streams: losing a packet does not block the others.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '443/UDP'],
      ['Transport', 'QUIC over UDP'],
      ['Encryption', 'Built-in TLS 1.3'],
      ['Advantage', '1-RTT, no head-of-line blocking'],
      ['Specification', 'RFC 9000, RFC 9114'],
    ],
    notes: [
      'The very first packet already carries the TLS Client Hello, padded to 1200 bytes to prevent amplification.',
      'The server answers with its half of the handshake and the certificate, all in one flight.',
      'A single round trip and the connection is ready and encrypted.',
      'The request goes on stream 0, with headers compressed by QPACK.',
      'The response arrives on the same stream; other streams progress in parallel.',
      'QUIC does its own acknowledgements, since UDP has none.',
    ],
    quiz: [
      { q: 'What transport does QUIC run on?', options: ['TCP', 'UDP', 'Directly on Ethernet'], answer: 1, why: 'QUIC implements reliability and encryption on top of UDP.' },
      { q: 'Which problem does QUIC avoid compared with HTTP/2 over TCP?', options: ['Head-of-line blocking between streams', 'Using DNS', 'Certificates'], answer: 0, why: 'In QUIC each stream is independent: one loss does not stall the rest.' },
    ],
  },
  ntp: {
    full: 'Network Time Protocol',
    description:
      'NTP synchronises computer clocks. The client notes when it sends the request and when the reply arrives; the server notes when it received it and when it answered. With those four timestamps it computes the delay and the offset of its clock.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '123'],
      ['Transport', 'UDP'],
      ['Message', '48 bytes, 4 timestamps'],
      ['Accuracy', 'Milliseconds over the Internet'],
      ['Specification', 'RFC 5905'],
    ],
    notes: [
      'The client sends its departure time T1.',
      'The server adds T2 (arrival) and T3 (departure). The client records T4 and computes the offset.',
      'Every 64 s (or more) it repeats the query to correct clock drift.',
      'New timestamps: the clock is adjusted smoothly, without jumps.',
    ],
    quiz: [
      { q: 'How many timestamps does NTP use to compute the offset?', options: ['1', '2', '4'], answer: 2, why: 'T1 to T4: departure and arrival at client and server.' },
      { q: 'What does the stratum indicate?', options: ['Distance from a reference clock', 'Network speed', 'Number of clients'], answer: 0, why: 'Stratum 1 sits next to an atomic or GPS clock; each level adds one.' },
    ],
  },
  imap: {
    full: 'Internet Message Access Protocol',
    description:
      'IMAP lets you read mail that stays on the server, in sync across all your devices. Every client command carries a tag (a1, a2…) and the server answers with data lines and an OK, NO or BAD result with the same tag.',
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '143 (993 with TLS)'],
      ['Transport', 'TCP'],
      ['Format', 'Tagged text commands'],
      ['Versus POP3', 'Mail stays on the server'],
      ['Specification', 'RFC 9051'],
    ],
    notes: [
      ...HS,
      'Initial greeting, untagged (*).',
      'The client signs in (in practice, always inside TLS).',
      'Tag a1 shows which command this answers.',
      'Opens the inbox.',
      'There are 12 messages; the mailbox opens read-write.',
      'Requests message 12 in full.',
      'The message arrives with its exact size in braces.',
    ],
    quiz: [
      { q: 'What are the tags a1, a2… for?', options: ['Encryption', 'Matching each response with its command', 'Numbering emails'], answer: 1, why: 'The final result carries the same tag as the command.' },
      { q: 'Where does mail live with IMAP?', options: ['Only on the phone', 'On the server, in sync', 'It is deleted once read'], answer: 1, why: 'Unlike POP3, IMAP keeps the mailbox on the server.' },
    ],
  },
  bgp: {
    full: 'Border Gateway Protocol',
    description:
      "BGP is the postal system between networks: each autonomous system (AS) tells its neighbours which address blocks it can reach and by which path. That is how the routing map of the whole Internet is built.",
    facts: [
      ['Layer', 'Application (layer 7)'],
      ['Port', '179'],
      ['Transport', 'TCP'],
      ['Messages', 'OPEN, UPDATE, KEEPALIVE, NOTIFICATION'],
      ['Decision', 'By policy and AS_PATH'],
      ['Specification', 'RFC 4271'],
    ],
    notes: [
      ...HS,
      'Each router introduces itself with its AS number and hold time.',
      'The neighbour does the same.',
      'A KEEPALIVE confirms the OPEN: the session becomes Established.',
      'The ISP announces it can reach the 203.0.113.0/24 network.',
      'The transit provider offers a default route to the rest of the Internet.',
      'A KEEPALIVE every 30 s; if 90 s pass without one, the session drops.',
    ],
    quiz: [
      { q: 'What does an UPDATE message announce?', options: ['Routes to address blocks', 'The time', 'A domain name'], answer: 0, why: 'UPDATE announces (or withdraws) prefixes with attributes such as AS_PATH.' },
      { q: 'What happens if no KEEPALIVE arrives within the hold time?', options: ['Nothing', 'The session drops and its routes are withdrawn', 'Speed doubles'], answer: 1, why: 'When the hold time expires the neighbour is considered down.' },
    ],
  },
  wireguard: {
    full: 'Modern VPN tunnel',
    description:
      'WireGuard builds an encrypted tunnel between two machines. A two-message handshake agrees keys with Curve25519; then every original IP packet travels encrypted inside a UDP datagram. With no traffic, it sends nothing.',
    facts: [
      ['Layer', 'Network (layer 3 tunnel)'],
      ['Port', '51820/UDP (configurable)'],
      ['Transport', 'UDP'],
      ['Cryptography', 'Curve25519, ChaCha20-Poly1305'],
      ['Handshake', '1 round trip'],
      ['Code', '~4,000 lines in the kernel'],
    ],
    notes: [
      'The client sends its ephemeral key and its encrypted identity.',
      'The server answers; both derive the same session keys.',
      "One of the client's IP packets travels encrypted through the tunnel.",
      'The reply comes back through the tunnel; the counter blocks replays.',
      'An optional keepalive keeps the path open through NAT.',
    ],
    quiz: [
      { q: 'How many messages does the WireGuard handshake have?', options: ['2', '4', '6'], answer: 0, why: 'Initiation and Response: a single round trip.' },
      { q: 'How does tunnel traffic travel?', options: ['Unencrypted over TCP', 'Encrypted inside UDP datagrams', 'Over ICMP'], answer: 1, why: 'Each IP packet is encrypted with ChaCha20-Poly1305 inside UDP.' },
    ],
  },
}
