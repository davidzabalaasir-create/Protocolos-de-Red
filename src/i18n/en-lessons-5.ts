import { HS } from './en-lessons-1'
import type { LessonText } from './types'

export const LESSONS_EN_5: Record<string, LessonText> = {
  'tcp-loss': {
    full: 'When a segment does not arrive',
    description:
      'The Internet loses packets all the time. TCP notices because the receiver keeps asking for the byte it is missing: three duplicate ACKs in a row make the sender resend that segment without waiting for the timer to expire (fast retransmit).',
    facts: [['Layer', 'Transport (layer 4)'], ['Loss signal', '3 duplicate ACKs or timer expiry (RTO)'], ['Reaction', 'Fast retransmit'], ['Also', 'Shrinks the congestion window'], ['Improvement', 'SACK: says which blocks did arrive'], ['Specification', 'RFC 5681, RFC 2018']],
    notes: [
      ...HS,
      'First segment with 1460 bytes: it arrives fine.',
      'The second segment is lost on the way.',
      'The third one does arrive, but out of order: there is a gap before it.',
      'The server only acknowledges up to byte 1460: it is still waiting for 1461.',
      'Receiving more data without the gap, it repeats the same ACK: a duplicate.',
      'A third identical ACK: for the sender, the sign that something was lost.',
      'Fast retransmit: the client resends the lost segment without waiting for the timer.',
      'With the gap filled, the server acknowledges everything up to byte 4380 at once.',
    ],
    quiz: [
      { q: 'What makes TCP resend a segment without waiting for the timer?', options: ['Three duplicate ACKs', 'A DNS reply', 'A SYN'], answer: 0, why: 'Three repeated ACKs trigger fast retransmit.' },
      { q: 'Why does the receiver repeat the same ACK?', options: ['It is still missing the bytes of the gap', 'Out of politeness', 'To close the connection'], answer: 0, why: 'The ACK always points to the first byte not yet received.' },
    ],
  },
  'dns-nxdomain': {
    full: 'When the name does not exist',
    description:
      'If you mistype a domain, the query walks the hierarchy as usual, but the responsible server answers NXDOMAIN: "that name does not exist". The resolver also caches that negative answer for a while so it does not repeat the lookup.',
    facts: [['Layer', 'Application (layer 7)'], ['Response code', 'NXDOMAIN (RCODE 3)'], ['Negative cache', 'Per the zone’s SOA record'], ['In the browser', '"This site can’t be reached"'], ['Different from', 'SERVFAIL (server failure)'], ['Specification', 'RFC 1035, RFC 2308']],
    notes: [
      'The browser asks for a mistyped domain.',
      'The resolver already knows the .com servers and asks them directly.',
      'The TLD has no such domain registered: it answers NXDOMAIN with the .com SOA.',
      'The resolver stores it in its negative cache and tells the browser, which shows the error.',
    ],
    quiz: [
      { q: 'What does NXDOMAIN mean?', options: ['The domain does not exist', 'The server is down', 'The answer is encrypted'], answer: 0, why: 'RCODE 3: the name does not exist.' },
      { q: 'Does the resolver remember the negative answer?', options: ['Yes, for a while (negative cache)', 'Never', 'Forever'], answer: 0, why: 'It caches it according to the zone’s SOA.' },
    ],
  },
  'tls-expired': {
    full: 'When the server cannot prove who it is',
    description:
      'Certificates have an expiry date. If the server presents an expired one, the browser cannot trust it is talking to the real site: it cuts the handshake with a TLS alert and shows a security warning instead of the page.',
    facts: [['Layer', 'Presentation (layer 6)'], ['Alert', 'Fatal, certificate_expired (45)'], ['Checks', 'Date, name and chain of trust'], ['Maximum validity', 'A few months (shrinking)'], ['Fix', 'Automatic renewal (ACME)'], ['Specification', 'RFC 8446 §6, RFC 5280']],
    notes: [
      ...HS,
      'The browser starts the handshake normally.',
      'The server presents a certificate whose validity date has passed.',
      'The browser checks it, rejects it and sends a fatal alert: the handshake stops.',
      'It closes the connection without sending a single byte of the HTTP request.',
    ],
    quiz: [
      { q: 'What does the browser do with an expired certificate?', options: ['Sends a fatal alert and stops', 'Accepts it silently', 'Asks DNS'], answer: 0, why: 'Without a valid certificate it cannot trust the server.' },
      { q: 'Is the HTTP request sent in this case?', options: ['No', 'Yes, encrypted', 'Yes, in clear'], answer: 0, why: 'The connection closes before any HTTP is sent.' },
    ],
  },
  'dhcp-full': {
    full: 'When the server cannot hand out an IP',
    description:
      'If the router’s address range runs out, the DHCP server rejects requests or does not answer. The device retries and finally gives itself a 169.254.x.x address (APIPA): it can talk to its local network but cannot reach the Internet.',
    facts: [['Layer', 'Application (layer 7)'], ['Rejection', 'DHCPNAK'], ['Retries', '4 s, 8 s, 16 s…'], ['Plan B', 'APIPA 169.254.0.0/16'], ['Symptom', '"No Internet" while Wi-Fi is connected'], ['Specification', 'RFC 2131, RFC 3927']],
    notes: [
      'On reconnecting, the device asks to reuse the IP it had.',
      'The server rejects it: that IP belongs to someone else and none are free.',
      'It starts over asking for any address…',
      '…but no offer comes. After several retries it takes 169.254.37.12 (APIPA) and has no Internet.',
    ],
    quiz: [
      { q: 'Which message rejects a DHCP request?', options: ['NAK', 'ACK', 'Offer'], answer: 0, why: 'DHCPNAK tells the client it cannot use that address.' },
      { q: 'What does a 169.254.x.x address mean?', options: ['DHCP failed and the device assigned it to itself', 'A public IP', 'A VPN address'], answer: 0, why: 'APIPA: local only, no Internet.' },
    ],
  },
}
