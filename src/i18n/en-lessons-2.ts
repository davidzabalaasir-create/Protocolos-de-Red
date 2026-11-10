import { HS } from './en-lessons-1'
import type { LessonText } from './types'

const L7 = 'Application (layer 7)'

export const LESSONS_EN_2: Record<string, LessonText> = {
  webrtc: {
    full: 'Real-time communication between browsers',
    description:
      'WebRTC enables direct video calls between browsers. A web server only relays the SDP offers; STUN discovers each side’s public IP, ICE tries paths and, once one works, audio and video travel encrypted peer to peer with DTLS and SRTP.',
    facts: [['Layer', L7], ['Transport', 'UDP (ICE, DTLS, SRTP)'], ['Signalling', 'Your choice: WebSocket, HTTP…'], ['NAT', 'STUN and, if that fails, TURN'], ['Encryption', 'Mandatory: DTLS-SRTP'], ['Specification', 'RFC 8825 and following']],
    notes: [
      'The browser sends its offer (codecs, keys) to the signalling server.',
      'It receives the other side’s answer through the same server.',
      'It asks the STUN server: which IP and port do you see me coming from?',
      'STUN replies with the public address, which is shared as an ICE candidate.',
      'ICE tests for a direct path by sending a check to the other device.',
      'An answer comes back: the direct path works.',
      'Keys are negotiated with DTLS, the UDP flavour of TLS.',
      'The certificate fingerprint must match the one in the SDP.',
      'Video travels encrypted directly between the two devices.',
      'And the other side’s audio arrives the same way, never touching the server.',
    ],
    quiz: [
      { q: 'What is STUN for in WebRTC?', options: ['Encrypting the video', 'Discovering your public IP and port', 'Compressing the audio'], answer: 1, why: 'STUN returns the address the Internet sees you at, needed behind NAT.' },
      { q: 'Where does the video travel when a direct path exists?', options: ['Through the web server', 'Peer to peer, encrypted with SRTP', 'By email'], answer: 1, why: 'The server only does signalling; media goes direct.' },
    ],
  },
  sip: {
    full: 'Session Initiation Protocol (VoIP)',
    description:
      'SIP sets up, changes and tears down voice and video calls. It looks like HTTP: text messages with methods (INVITE, ACK, BYE) and codes (100, 180, 200). SIP only negotiates the call; the voice travels separately over RTP.',
    facts: [['Layer', L7], ['Port', '5060 (5061 with TLS)'], ['Transport', 'UDP or TCP'], ['Media', 'RTP, described with SDP'], ['Methods', 'REGISTER, INVITE, ACK, BYE, CANCEL'], ['Specification', 'RFC 3261']],
    notes: [
      'The phone invites Ana to a call and includes its SDP (codec and audio port).',
      'The server confirms it is looking for the callee.',
      'It forwards the invitation to the device where Ana is registered.',
      'Ana’s phone is ringing.',
      'The caller hears the ringback tone.',
      'Ana picks up: the 200 OK carries her SDP.',
      'The ACK confirms; the call is established.',
      'Voice flows directly between the phones over RTP, every 20 ms.',
      'Hanging up sends BYE.',
      'Call ended.',
    ],
    quiz: [
      { q: 'Which SIP message starts a call?', options: ['BYE', 'INVITE', 'REGISTER'], answer: 1, why: 'INVITE invites the other end and includes the SDP description.' },
      { q: 'Which protocol carries the voice?', options: ['SIP', 'RTP', 'SMTP'], answer: 1, why: 'SIP negotiates the call; audio travels separately in RTP packets.' },
    ],
  },
  rtsp: {
    full: 'Real Time Streaming Protocol',
    description:
      'RTSP is the "remote control" of a video stream, widely used by IP cameras. With text commands the client asks for the description (DESCRIBE), prepares the channel (SETUP) and starts playback (PLAY); the video arrives separately over RTP.',
    facts: [['Layer', L7], ['Port', '554'], ['Transport', 'TCP (control) + RTP/UDP (video)'], ['Commands', 'OPTIONS, DESCRIBE, SETUP, PLAY, TEARDOWN'], ['Typical use', 'IP cameras and CCTV'], ['Specification', 'RFC 7826']],
    notes: [
      ...HS,
      'Asks for the stream description.',
      'The camera describes the video in SDP: H.264 codec at 1080p.',
      'Gives the UDP ports where it wants to receive the video.',
      'The camera creates a session and confirms the ports.',
      'Play!',
      'Video starts arriving in RTP packets.',
    ],
    quiz: [
      { q: 'Which RTSP command starts playback?', options: ['PLAY', 'SETUP', 'DESCRIBE'], answer: 0, why: 'DESCRIBE describes, SETUP prepares and PLAY starts the stream.' },
      { q: 'Where is RTSP widely used?', options: ['IP cameras', 'Printers', 'DNS'], answer: 0, why: 'It is the typical protocol of cameras and CCTV.' },
    ],
  },
  rtmp: {
    full: 'Real-Time Messaging Protocol',
    description:
      'RTMP is how broadcasting software (such as OBS) sends a live stream to streaming platforms. After its own handshake it splits audio and video into interleaved chunks over a single TCP connection.',
    facts: [['Layer', L7], ['Port', '1935'], ['Transport', 'TCP'], ['Handshake', 'C0/C1/C2 and S0/S1/S2'], ['Typical use', 'Live stream ingest'], ['Origin', 'Adobe (Flash)']],
    notes: [
      ...HS,
      'The broadcaster sends the version (C0) and 1536 random bytes (C1).',
      'The server answers with its own and echoes C1.',
      'Echo of S1: handshake complete.',
      'Connects to the "live" application.',
      'Connection accepted.',
      'Starts publishing with the stream key.',
      'The first frames of the live stream arrive.',
    ],
    quiz: [
      { q: 'What is RTMP used for today?', options: ['Sending a live stream to the streaming platform', 'Reading email', 'Assigning IPs'], answer: 0, why: 'Tools like OBS use it to ingest live streams.' },
      { q: 'Which transport does RTMP use?', options: ['UDP', 'TCP', 'ICMP'], answer: 1, why: 'A single TCP connection to port 1935.' },
    ],
  },
  doh: {
    full: 'DNS over HTTPS',
    description:
      'DNS over HTTPS wraps DNS queries inside ordinary HTTPS requests. Nobody on the network can see which domains you visit or forge the answers, and the traffic blends in with the rest of your browsing.',
    facts: [['Layer', L7], ['Port', '443'], ['Transport', 'HTTPS (TCP + TLS)'], ['Format', 'application/dns-message'], ['Benefit', 'Privacy and integrity'], ['Specification', 'RFC 8484']],
    notes: [
      ...HS,
      'A TLS channel is opened with the resolver, as with any website.',
      'The resolver proves its identity with a certificate.',
      'The DNS query travels encrypted inside an HTTP request.',
      'So does the answer: nobody along the way knows which domain you asked for.',
    ],
    quiz: [
      { q: 'What does DNS gain by going over HTTPS?', options: ['Always more speed', 'Privacy: nobody on the network sees which domains you look up', 'Shorter addresses'], answer: 1, why: 'The query travels encrypted inside TLS.' },
      { q: 'Which port does DoH use?', options: ['53', '443', '853'], answer: 1, why: 'The same as HTTPS; 853 is DNS over TLS (DoT).' },
    ],
  },
  dnssec: {
    full: 'DNS Security Extensions',
    description:
      'DNSSEC digitally signs DNS records. The resolver checks each signature (RRSIG) with the zone key (DNSKEY), and that key with a digest (DS) published by the parent zone, forming a chain of trust up to the root.',
    facts: [['Layer', L7], ['Port', '53'], ['Transport', 'UDP / TCP'], ['Records', 'RRSIG, DNSKEY, DS, NSEC'], ['Protects', 'Integrity (not privacy)'], ['Specification', 'RFC 4033–4035']],
    notes: [
      'The DO bit asks for signatures to be included.',
      'The resolver asks the authoritative server.',
      'The answer carries the RRSIG signature of the record.',
      'To check the signature it needs the zone’s public key.',
      'The key arrives signed too; its DS digest lives in the .com zone.',
      'Everything checks out: the AD bit says the answer is authenticated.',
    ],
    quiz: [
      { q: 'What does DNSSEC protect?', options: ['The privacy of queries', 'The authenticity and integrity of answers', 'Speed'], answer: 1, why: 'It signs records but does not encrypt them.' },
      { q: 'Which record holds the signature?', options: ['RRSIG', 'MX', 'CNAME'], answer: 0, why: 'RRSIG signs a record set; DNSKEY holds the key to verify it.' },
    ],
  },
  pop3: {
    full: 'Post Office Protocol v3',
    description:
      'POP3 downloads mail from the server to the device and usually deletes it from the server. It is simpler than IMAP: sign in, list, download (RETR), delete (DELE) and quit.',
    facts: [['Layer', L7], ['Port', '110 (995 with TLS)'], ['Transport', 'TCP'], ['Replies', '+OK or -ERR'], ['Versus IMAP', 'Download and delete; no sync'], ['Specification', 'RFC 1939']],
    notes: [
      ...HS,
      'Server greeting.',
      'User name…',
      '…and password (in practice, inside TLS).',
      'Two messages are waiting.',
      'Downloads the first one.',
      'The full message arrives, ending in a line with a single dot.',
      'Marks it for deletion on the server.',
      'Deletions take effect on quit.',
    ],
    quiz: [
      { q: 'What does POP3 usually do with downloaded mail?', options: ['Keeps it in sync', 'Deletes it from the server', 'Forwards it'], answer: 1, why: 'Download and delete; IMAP, instead, synchronises.' },
      { q: 'Which command downloads a message?', options: ['RETR', 'DELE', 'LIST'], answer: 0, why: 'RETR n retrieves message number n.' },
    ],
  },
  ftp: {
    full: 'File Transfer Protocol',
    description:
      'FTP uses two connections: a control one (port 21) for text commands and a data one for each file or listing. In passive mode (PASV) the server tells the client which port to connect to for the data.',
    facts: [['Layer', L7], ['Ports', '21 (control) + data port'], ['Transport', 'TCP'], ['Modes', 'Active and passive'], ['Security', 'Unencrypted: use FTPS or SFTP'], ['Specification', 'RFC 959']],
    notes: [
      ...HS,
      'Greeting on the control connection.',
      'User name…',
      '…and password, in clear: that is why FTP without TLS is unsafe.',
      'Signed in.',
      'Asks for passive mode.',
      'The last two numbers encode the port: 195×256+80 = 50000.',
      'Asks for the file over the control connection…',
      '…and the bytes arrive over the data connection on port 50000.',
      'File received.',
    ],
    quiz: [
      { q: 'How many connections does FTP use?', options: ['One', 'Two: control and data', 'None, it uses UDP'], answer: 1, why: 'Commands go over port 21 and files over a separate data connection.' },
      { q: 'Why is classic FTP unsafe?', options: ['Because it is slow', 'Because the password travels unencrypted', 'Because it uses UDP'], answer: 1, why: 'User and password go in plain text; use FTPS or SFTP.' },
    ],
  },
  smb: {
    full: 'Server Message Block',
    description:
      'SMB is the Windows file-sharing protocol (also on macOS and Linux via Samba). After negotiating the dialect and signing in, the client connects to a share and opens, reads and writes files as if they were local.',
    facts: [['Layer', L7], ['Port', '445'], ['Transport', 'TCP'], ['Current version', 'SMB 3.1.1 (with encryption)'], ['Authentication', 'NTLM or Kerberos'], ['Specification', 'MS-SMB2']],
    notes: [
      ...HS,
      'The client offers the SMB dialects it understands.',
      'The server picks SMB 3.1.1.',
      'User authentication.',
      'Session created.',
      'It connects to the "docs" share.',
      'Access granted.',
      'Reads a file.',
      'The content arrives.',
    ],
    quiz: [
      { q: 'What is SMB for?', options: ['Shared folders and printers', 'Sending email', 'Resolving names'], answer: 0, why: 'It is the Windows resource-sharing protocol.' },
      { q: 'Which port does modern SMB use?', options: ['21', '445', '3389'], answer: 1, why: 'SMB 2/3 runs directly over TCP 445.' },
    ],
  },
  tls: {
    full: 'Transport Layer Security',
    description:
      'TLS encrypts and authenticates any connection: web, mail, VPN… In TLS 1.3 the client guesses the key exchange and sends it in the first message, so a single round trip is enough. Everything after the Server Hello is already encrypted, certificate included.',
    facts: [['Layer', 'Presentation (layer 6)'], ['Transport', 'TCP (DTLS over UDP)'], ['Key exchange', '(EC)DHE, X25519'], ['Ciphers', 'AES-GCM, ChaCha20-Poly1305'], ['Handshake', '1-RTT (0-RTT on resumption)'], ['Specification', 'RFC 8446']],
    notes: [
      ...HS,
      'It already includes the client’s ephemeral key.',
      'With both ephemeral keys, each side derives the shared secret.',
      'The rest of the handshake is already encrypted: the certificate is not visible on the network.',
      'The client finishes the handshake.',
      'A ticket allows a faster resumption next time.',
    ],
    quiz: [
      { q: 'How many round trips does the TLS 1.3 handshake need?', options: ['1', '2', '3'], answer: 0, why: 'The client sends its key in the first message: 1-RTT.' },
      { q: 'In TLS 1.3, is the certificate visible on the network?', options: ['Yes, in clear', 'No, it is encrypted after the Server Hello', 'Only with HTTP/2'], answer: 1, why: 'Everything after the Server Hello is already encrypted.' },
    ],
  },
  socks5: {
    full: 'Generic socket proxy',
    description:
      'SOCKS5 is a proxy that relays any TCP (or UDP) connection. The client says hello, authenticates if needed and asks "connect me to this destination"; from then on the proxy passes bytes both ways without interpreting them.',
    facts: [['Layer', 'Session (layer 5)'], ['Port', '1080'], ['Transport', 'TCP (and UDP ASSOCIATE)'], ['Authentication', 'None, user/password, GSSAPI'], ['Typical use', 'SSH tunnels, Tor'], ['Specification', 'RFC 1928']],
    notes: [
      ...HS,
      'The client lists the authentication methods it supports.',
      'The proxy picks one.',
      'It asks to connect to the destination.',
      ...HS,
      'Connected: from here the proxy just relays bytes.',
    ],
    quiz: [
      { q: 'What does a SOCKS5 proxy do after CONNECT?', options: ['Parses the HTTP', 'Relays bytes without looking at them', 'Closes the connection'], answer: 1, why: 'SOCKS is a generic byte tunnel.' },
      { q: 'What is the usual SOCKS port?', options: ['1080', '8080', '25'], answer: 0, why: '1080 is the standard SOCKS port.' },
    ],
  },
  proxy: {
    full: 'Web intermediary and CONNECT tunnel',
    description:
      'An HTTP proxy receives clients’ requests and makes them on their behalf: it can filter, log or cache. For HTTPS it uses the CONNECT method, which opens a TCP tunnel to the destination without being able to see the encrypted content.',
    facts: [['Layer', L7], ['Port', '3128 / 8080 (common)'], ['Transport', 'TCP'], ['Key method', 'CONNECT for HTTPS'], ['Variants', 'Forward, reverse, transparent'], ['Specification', 'RFC 9110 §9.3.6']],
    notes: [
      ...HS,
      'The browser asks for a tunnel to the destination.',
      ...HS,
      'Tunnel ready.',
      'TLS runs end to end; the proxy only sees encrypted bytes.',
      'The proxy forwards it unchanged to the server.',
    ],
    quiz: [
      { q: 'Which method does an HTTP proxy use for HTTPS?', options: ['GET', 'CONNECT', 'TRACE'], answer: 1, why: 'CONNECT opens a TCP tunnel to the destination.' },
      { q: 'Can the proxy read the HTTPS going through the tunnel?', options: ['Yes', 'No, it is encrypted end to end', 'Only the images'], answer: 1, why: 'TLS is negotiated between browser and server.' },
    ],
  },
  modbus: {
    full: 'Industrial automation protocol',
    description:
      'Modbus lets a control system read and write registers on PLCs, sensors and drives. It is very simple: a function code, an address and a quantity. It has no authentication or encryption, so it is kept on isolated industrial networks.',
    facts: [['Layer', L7], ['Port', '502'], ['Transport', 'TCP'], ['Functions', '03 read registers, 06 write one…'], ['Security', 'None by design'], ['Origin', 'Modicon, 1979']],
    notes: [
      ...HS,
      'The SCADA asks for two registers: for example, temperature and pressure.',
      'The PLC returns 21.5 °C and 1013 hPa encoded as integers.',
      'It switches a pump on by writing a 1.',
      'The PLC confirms by echoing the request.',
    ],
    quiz: [
      { q: 'Which function code reads registers?', options: ['0x03', '0x06', '0x10'], answer: 0, why: '03 reads holding registers; 06 writes one.' },
      { q: 'What security does Modbus/TCP have?', options: ['Mandatory TLS', 'None', 'A password per register'], answer: 1, why: 'No authentication or encryption: the network must be isolated.' },
    ],
  },
  mqtt: {
    full: 'Lightweight IoT messaging',
    description:
      'MQTT connects IoT devices through a broker: sensors publish messages to "topics" (such as casa/salon/temp) and whoever is subscribed receives them. Headers take just 2 bytes, ideal for small devices and slow networks.',
    facts: [['Layer', L7], ['Port', '1883 (8883 with TLS)'], ['Transport', 'TCP'], ['Model', 'Publish / subscribe'], ['Quality of service', 'QoS 0, 1, 2'], ['Specification', 'OASIS MQTT 5.0']],
    notes: [
      ...HS,
      'The sensor introduces itself to the broker.',
      'Connection accepted.',
      'Publishes the temperature. With QoS 1 it expects a confirmation.',
      'The broker confirms and delivers the message to subscribers.',
      'With nothing to publish, a ping keeps the session alive.',
      'Ping reply.',
    ],
    quiz: [
      { q: 'How do MQTT devices communicate?', options: ['Directly with each other', 'Publishing and subscribing to topics on a broker', 'By broadcast'], answer: 1, why: 'The broker delivers each topic’s messages.' },
      { q: 'What does QoS 1 guarantee?', options: ['At-least-once delivery', 'Nothing', 'Encryption'], answer: 0, why: 'With QoS 1 the receiver confirms with PUBACK.' },
    ],
  },
  snmp: {
    full: 'Simple Network Management Protocol',
    description:
      'SNMP monitors and configures network equipment. A manager queries the agent’s variables (identified by OID, such as uptime or traffic on an interface) and the agent can send an unsolicited "trap" when something happens.',
    facts: [['Layer', L7], ['Ports', '161 (queries), 162 (traps)'], ['Transport', 'UDP'], ['Data', 'MIB and OIDs, BER-encoded'], ['Versions', 'v2c (community), v3 (users and encryption)'], ['Specification', 'RFC 3411–3418']],
    notes: [
      'The manager asks how long the router has been up.',
      'One day (in hundredths of a second).',
      'Now it asks for the bytes received on interface 2.',
      'Subtracting two readings gives the bandwidth used.',
      'The router speaks up unasked: port 3 has gone down.',
    ],
    quiz: [
      { q: 'What is an SNMP trap?', options: ['A query from the manager', 'An unsolicited alert from the agent', 'An attack'], answer: 1, why: 'The device reports on its own, to port 162.' },
      { q: 'How is each variable identified?', options: ['By an OID', 'By a URL', 'By its MAC'], answer: 0, why: 'Each MIB value has an object identifier (OID).' },
    ],
  },
  ldap: {
    full: 'Lightweight Directory Access Protocol',
    description:
      'LDAP queries directories: hierarchical databases of users, groups and computers, such as Active Directory. Applications use it to check passwords (Bind) and look up data (Search) about an organisation.',
    facts: [['Layer', L7], ['Port', '389 (636 with TLS)'], ['Transport', 'TCP'], ['Encoding', 'ASN.1 BER'], ['Operations', 'Bind, Search, Modify, Add, Delete'], ['Specification', 'RFC 4511']],
    notes: [
      ...HS,
      'The application checks the user name and password.',
      'Credentials are correct.',
      'Looks up the entry with that email.',
      'Returns the attributes, such as the groups the user belongs to.',
      'End of results.',
      'Closes the LDAP session.',
    ],
    quiz: [
      { q: 'Which LDAP operation validates a user?', options: ['Bind', 'Search', 'Delete'], answer: 0, why: 'Bind authenticates with a DN and a password.' },
      { q: 'What does an LDAP directory store?', options: ['Users, groups and computers', 'Web pages', 'Videos'], answer: 0, why: 'It is a hierarchical database of the organisation, like Active Directory.' },
    ],
  },
  captive: {
    full: 'Login page of public networks',
    description:
      'In hotels and airports, the network intercepts your first web request and redirects you to a login page. Operating systems detect this by fetching a test URL: if they do not get the expected answer, they open the portal automatically.',
    facts: [['Layer', L7], ['Port', '80 (detection uses HTTP)'], ['Transport', 'TCP'], ['Mechanism', '302 redirect or fake DNS'], ['Modern standard', 'DHCP option 114 (portal API)'], ['Specification', 'RFC 8910, RFC 8908']],
    notes: [
      ...HS,
      'The system checks for Internet by fetching a URL that should return 204.',
      'Instead of 204 it gets a redirect: there is a captive portal.',
      'A window opens with the login page.',
      'The terms of use appear.',
      'The user accepts.',
      'The router authorises the device’s MAC and the Internet works.',
    ],
    quiz: [
      { q: 'How does the system detect a captive portal?', options: ['It fetches a test URL and does not get what it expects', 'By the network name', 'By signal strength'], answer: 0, why: 'If a redirect arrives instead of 204, there is a portal.' },
      { q: 'Which code does the redirect usually use?', options: ['302', '404', '500'], answer: 0, why: 'A 302 sends the browser to the login page.' },
    ],
  },
  ipv4: {
    full: 'Internet Protocol version 4',
    description:
      'IP carries each packet from source to destination, hopping from router to router. The IPv4 header holds addresses, the TTL (hops left) and the protocol it carries. If a packet does not fit the link (MTU), it is split into fragments that the destination reassembles.',
    facts: [['Layer', 'Network (layer 3)'], ['Addresses', '32 bits (≈4.3 billion)'], ['Header', '20 bytes minimum'], ['TTL', 'Each router lowers it by 1'], ['Typical MTU', '1500 bytes on Ethernet'], ['Specification', 'RFC 791']],
    notes: [
      'The 2000-byte datagram does not fit in 1500: the first piece goes with the MF flag (more fragments).',
      'The second piece, with the same identifier and offset 1480.',
      'The server reassembled the fragments and replies.',
    ],
    quiz: [
      { q: 'What does the MF flag mean?', options: ['More fragments are coming', 'The packet is urgent', 'It is multicast'], answer: 0, why: 'More Fragments: pieces of the datagram are still to come.' },
      { q: 'What does a router do with the TTL?', options: ['Increases it', 'Lowers it by 1 and drops the packet at 0', 'Nothing'], answer: 1, why: 'That stops packets from looping forever.' },
    ],
  },
  ipv6: {
    full: 'Internet Protocol version 6',
    description:
      'IPv6 uses 128-bit addresses, enough for every device on the planet. It replaces ARP and much of DHCP with NDP (ICMPv6 messages): the device asks for the router, receives the network prefix and builds its own address (SLAAC).',
    facts: [['Layer', 'Network (layer 3)'], ['Addresses', '128 bits'], ['Header', '40 bytes, fixed'], ['Autoconfiguration', 'SLAAC with Router Advertisement'], ['Neighbours', 'NDP instead of ARP'], ['Specification', 'RFC 8200, RFC 4861']],
    notes: [
      'On connecting, the device asks all routers (ff02::2).',
      'The router announces the prefix; the device builds its global address from it.',
      'ARP’s equivalent: what is the router’s MAC?',
      'The router replies with its MAC.',
      'With a global address now, a ping6 to the web server.',
      'Reply in 14 ms over IPv6.',
    ],
    quiz: [
      { q: 'What replaces ARP in IPv6?', options: ['NDP (ICMPv6 messages)', 'DHCPv6', 'DNS'], answer: 0, why: 'Neighbor Solicitation and Advertisement do that job.' },
      { q: 'How many bits does an IPv6 address have?', options: ['32', '64', '128'], answer: 2, why: '128 bits, versus 32 in IPv4.' },
    ],
  },
  igmp: {
    full: 'Multicast in IPv4',
    description:
      'With multicast, a single transmission reaches many receivers: the sender targets a group address (224.0.0.0–239.255.255.255) and the network copies the traffic only towards those who joined. IGMP is how a host tells the router "I want this group".',
    facts: [['Layer', 'Network (layer 3)'], ['IP protocol', '2'], ['Groups', '224.0.0.0/4'], ['Messages', 'Membership Query, Report, Leave'], ['Typical use', 'IPTV, trading, discovery'], ['Specification', 'RFC 2236, RFC 3376']],
    notes: [
      'The TV set-top box joins channel 239.1.1.1.',
      'The router starts forwarding the group’s stream to this network.',
      'Every so often the router asks who is still interested.',
      'Still watching the channel.',
      'Channel change: it leaves the group and the router stops sending it.',
    ],
    quiz: [
      { q: 'What is IGMP for?', options: ['Joining multicast groups', 'Encrypting', 'Assigning IPs'], answer: 0, why: 'It tells the router which groups the host wants to receive.' },
      { q: 'Which IPv4 range is multicast?', options: ['224.0.0.0 – 239.255.255.255', '10.0.0.0 – 10.255.255.255', '192.168.0.0/16'], answer: 0, why: 'The 224.0.0.0/4 block is reserved for multicast.' },
    ],
  },
  ipsec: {
    full: 'IP Security (site-to-site VPN)',
    description:
      'IPsec encrypts IP traffic between two points, typically two company sites. IKEv2 negotiates keys in two exchanges (IKE_SA_INIT and IKE_AUTH); then every packet travels inside ESP, encrypted and authenticated.',
    facts: [['Layer', 'Network (layer 3)'], ['Negotiation', 'IKEv2, UDP 500 / 4500'], ['Data', 'ESP (IP protocol 50)'], ['Modes', 'Tunnel and transport'], ['Encryption', 'AES-GCM'], ['Specification', 'RFC 7296, RFC 4303']],
    notes: [
      'Algorithm proposal and Diffie-Hellman key.',
      'Answer with the other half of the exchange.',
      'Each side proves its identity and defines which traffic it will protect.',
      'Tunnel created.',
      'The site’s original packet travels encrypted inside ESP.',
      'And the reply comes back the same way in the other direction.',
    ],
    quiz: [
      { q: 'Which protocol negotiates IPsec keys?', options: ['IKEv2', 'ARP', 'SNMP'], answer: 0, why: 'IKE_SA_INIT and IKE_AUTH create the tunnel.' },
      { q: 'What does protected data travel in?', options: ['ESP', 'ICMP', 'HTTP'], answer: 0, why: 'ESP (IP protocol 50) encrypts and authenticates each packet.' },
    ],
  },
  ospf: {
    full: 'Open Shortest Path First',
    description:
      'OSPF is the most widely used interior routing protocol in companies. Neighbouring routers greet each other, exchange their link map (LSAs) and each one computes, with Dijkstra’s algorithm, the shortest path to every network.',
    facts: [['Layer', 'Network (layer 3)'], ['IP protocol', '89'], ['Multicast', '224.0.0.5 (all OSPF routers)'], ['Algorithm', 'Link state + Dijkstra'], ['Scope', 'Within an autonomous system'], ['Specification', 'RFC 2328']],
    notes: [
      'Every 10 s hellos are sent to discover neighbours.',
      'The neighbour answers: now they know each other.',
      'A summary of the LSAs each one knows.',
      'It asks for the LSAs it is missing.',
      'It sends the details of its links.',
      'Confirmed: both have the same map and compute their routes.',
    ],
    quiz: [
      { q: 'Which algorithm does OSPF use to compute routes?', options: ['Dijkstra (shortest path)', 'Bubble sort', 'RIP hop count'], answer: 0, why: 'Each router computes the shortest-path tree.' },
      { q: 'Where does OSPF send its Hellos?', options: ['224.0.0.5', '255.255.255.255', '8.8.8.8'], answer: 0, why: 'It is the multicast group of all OSPF routers.' },
    ],
  },
  ethernet: {
    full: 'Frames and MAC address learning',
    description:
      'A switch learns which port each MAC address is on by looking at the source of the frames it receives. If it does not know the destination, it floods the frame out of every port; as soon as it learns, it delivers only through the right port.',
    facts: [['Layer', 'Data link (layer 2)'], ['Addresses', '48-bit MAC'], ['Frame', '64–1518 bytes'], ['Integrity', 'FCS (CRC-32) at the end'], ['Switch', 'MAC → port table'], ['Specification', 'IEEE 802.3']],
    notes: [
      'The switch learns: the client’s MAC is on port 1.',
      'Since it does not know where the destination is, it copies the frame to every port.',
      'As the reply passes, the switch learns the printer’s port.',
      'Now the switch sends it only to the right port.',
    ],
    quiz: [
      { q: 'What does a switch do with a frame to an unknown MAC?', options: ['Drops it', 'Floods it out of every port', 'Returns it'], answer: 1, why: 'It floods, and learns the port when the reply arrives.' },
      { q: 'How does the switch learn where each device is?', options: ['From the source MAC of frames', 'From DNS', 'By asking the router'], answer: 0, why: 'It records the port where each source MAC appears.' },
    ],
  },
  vlan: {
    full: 'Virtual local area networks',
    description:
      'VLANs split a single switch into several isolated networks. Between switches, a trunk link carries every VLAN by adding a 4-byte tag with the VLAN number to each frame, which is removed when delivering it to the end device.',
    facts: [['Layer', 'Data link (layer 2)'], ['Tag', '4 bytes: TPID 0x8100 + VLAN ID'], ['Possible VLANs', '4094'], ['Ports', 'Access (untagged) and trunk'], ['Priority', '3-bit PCP (QoS)'], ['Specification', 'IEEE 802.1Q']],
    notes: [
      'The device knows nothing about VLANs: it sends a normal frame.',
      'On the trunk, the switch adds the tag with VLAN 20.',
      'The second switch removes the tag and delivers it only to VLAN 20 ports.',
    ],
    quiz: [
      { q: 'How big is the 802.1Q tag?', options: ['4 bytes', '20 bytes', '1 bit'], answer: 0, why: 'TPID 0x8100 + 2 bytes with priority and VLAN ID.' },
      { q: 'Where do tagged frames travel?', options: ['On trunk links', 'All the way to the laptop', 'Across the Internet'], answer: 0, why: 'Access ports strip the tag before delivering.' },
    ],
  },
  stp: {
    full: 'Spanning Tree Protocol',
    description:
      'If two switches are joined by more than one cable, broadcast frames would loop forever. STP elects a root switch and blocks redundant links, leaving a single path; if a link fails, it unblocks another.',
    facts: [['Layer', 'Data link (layer 2)'], ['Messages', 'BPDUs every 2 s'], ['Destination', '01:80:c2:00:00:00'], ['Election', 'Lowest bridge ID = root'], ['Fast version', 'RSTP (802.1w)'], ['Specification', 'IEEE 802.1D / 802.1Q']],
    notes: [
      'Every switch claims to be root when it boots.',
      'So does the other one.',
      'The lowest ID wins: switch 1 is the root.',
      'Switch 2 agrees and blocks its redundant link.',
      'A link goes down: a notice is sent to recompute and flush MAC tables.',
    ],
    quiz: [
      { q: 'Which problem does STP prevent?', options: ['Layer 2 loops', 'Weak passwords', 'Running out of IPs'], answer: 0, why: 'It blocks redundant links so frames do not circulate endlessly.' },
      { q: 'Which switch becomes root?', options: ['The one with the lowest bridge ID', 'The newest', 'The one with most ports'], answer: 0, why: 'The lowest priority + MAC wins.' },
    ],
  },
  pppoe: {
    full: 'PPP over Ethernet (ISP connection)',
    description:
      'Many fibre and DSL providers use PPPoE to identify the customer. The router discovers the ISP’s access server, opens a session, signs in with user name and password and receives its public IP via IPCP.',
    facts: [['Layer', 'Data link (layer 2)'], ['EtherType', '0x8863 (discovery), 0x8864 (session)'], ['Discovery', 'PADI, PADO, PADR, PADS'], ['Authentication', 'PAP or CHAP'], ['MTU', '1492 (8 bytes of header)'], ['Specification', 'RFC 2516']],
    notes: [
      'The router looks for access servers by broadcast.',
      'The ISP’s server offers itself.',
      'The router picks it.',
      'Session created with identifier 0x1a2b.',
      'The PPP link parameters are negotiated.',
      'Authentication with the contract credentials.',
      'Valid customer.',
      'The router receives its public IP: the Internet works.',
    ],
    quiz: [
      { q: 'What is the first PPPoE message?', options: ['PADI', 'PADS', 'LCP'], answer: 0, why: 'PADI looks for access servers by broadcast.' },
      { q: 'Why does the MTU drop to 1492?', options: ['Because of the 8 bytes of PPPoE + PPP header', 'Because of Wi-Fi', 'Because of DNS'], answer: 0, why: '1500 − 8 = 1492.' },
    ],
  },
  wifi: {
    full: 'Wireless local area network',
    description:
      'Before sending data, a Wi-Fi device discovers networks (beacons or probes), authenticates with the access point and associates with it. 802.11 frames carry up to three MAC addresses: receiver, transmitter and final destination.',
    facts: [['Layer', 'Data link (layer 2)'], ['Bands', '2.4 / 5 / 6 GHz'], ['Medium access', 'CSMA/CA with acknowledgements'], ['Frames', 'Management, control and data'], ['Current version', 'Wi-Fi 7 (802.11be)'], ['Specification', 'IEEE 802.11']],
    notes: [
      'The access point announces its network about 10 times a second.',
      'The laptop actively asks for the network.',
      'The AP answers with its capabilities.',
      '802.11 authentication step (real security comes with WPA).',
      'Accepted.',
      'Asks to join the network.',
      'Associated: it can now exchange data (or start WPA).',
    ],
    quiz: [
      { q: 'What does a Beacon frame announce?', options: ['The network’s existence and capabilities', 'An error', 'An IP address'], answer: 0, why: 'The AP sends it periodically with the SSID.' },
      { q: 'Which step comes after 802.11 authentication?', options: ['Association', 'DNS', 'Shutdown'], answer: 0, why: 'Authentication, then Association Request/Response.' },
    ],
  },
  wpa3: {
    full: 'Modern Wi-Fi security',
    description:
      'WPA3-Personal replaces the WPA2 handshake with SAE: an exchange that proves knowledge of the password without sending it and resists dictionary attacks. Then the 4-way handshake (EAPOL-Key) installs the keys that encrypt every frame.',
    facts: [['Layer', 'Data link (layer 2)'], ['Authentication', 'SAE (Dragonfly)'], ['Keys', 'EAPOL 4-way handshake'], ['Encryption', 'AES-CCMP / GCMP'], ['Advantage', 'Perfect forward secrecy'], ['Specification', 'IEEE 802.11-2020']],
    notes: [
      'Each side sends a commitment derived from the password.',
      'The AP does the same.',
      'They confirm both reached the same key (PMK).',
      'The password never travelled over the air.',
      'The 4-way handshake starts with a random number from the AP.',
      'The client answers with its own: both derive the session key.',
      'The AP sends the group key for broadcasts.',
      'Keys installed: all traffic is encrypted.',
    ],
    quiz: [
      { q: 'Which exchange does WPA3-Personal introduce?', options: ['SAE', 'WEP', 'PAP'], answer: 0, why: 'SAE proves knowledge of the password without sending it.' },
      { q: 'How many messages does the EAPOL-Key handshake have?', options: ['2', '4', '8'], answer: 1, why: 'The 4-way handshake installs the session keys.' },
    ],
  },
  dot1x: {
    full: 'Enterprise network authentication',
    description:
      'Enterprise networks need more than a shared password: everyone signs in with their own credentials. The access point decides nothing, it just relays the device’s EAP messages to a RADIUS server, which accepts or rejects access.',
    facts: [['Layer', 'Data link (layer 2)'], ['Device ↔ AP', 'EAPOL'], ['AP ↔ server', 'RADIUS (UDP 1812)'], ['EAP methods', 'PEAP, EAP-TLS, EAP-TTLS'], ['Typical use', 'Corporate Wi-Fi and ports, eduroam'], ['Specification', 'IEEE 802.1X, RFC 2865']],
    notes: [
      'The device wants to authenticate.',
      'Who are you?',
      'It answers with its identity.',
      'The AP wraps it in RADIUS and passes it to the server.',
      'The server starts the EAP method (here PEAP with a TLS tunnel).',
      'After several exchanges, valid credentials: access granted and VLAN assigned.',
      'The device can now use the network.',
    ],
    quiz: [
      { q: 'Who decides whether a user gets in with 802.1X?', options: ['The access point', 'The RADIUS server', 'The laptop itself'], answer: 1, why: 'The AP only relays; RADIUS accepts or rejects.' },
      { q: 'What travels between the device and the AP?', options: ['EAPOL', 'SMTP', 'BGP'], answer: 0, why: 'EAP over LAN (EAPOL); from the AP to the server it goes inside RADIUS.' },
    ],
  },
}
