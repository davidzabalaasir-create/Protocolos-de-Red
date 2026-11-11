import { tcpHandshake } from './helpers'
import type { Protocol } from './protocols'

const PUBLIC_IP = '198.51.100.37'
const CLIENT_IP = '192.168.1.10'
const WEB_IP = '203.0.113.10'

/** Third expansion: NAT, traceroute, HTTP/2, Kerberos, TFTP, Telnet, CoAP and Bluetooth LE. */
export const MORE_PROTOCOLS_2: Protocol[] = [
  {
    id: 'nat',
    name: 'NAT',
    full: 'Traducción de direcciones de red',
    layer: 3,
    description:
      'Tu casa tiene una sola IP pública, pero muchos dispositivos con IP privada. El router reescribe la dirección y el puerto de origen de cada paquete que sale, apunta el cambio en su tabla NAT y deshace la traducción cuando vuelve la respuesta.',
    facts: [
      ['Capa', 'Red (capa 3)'],
      ['Variante doméstica', 'NAPT (también cambia el puerto)'],
      ['IP privadas', '10/8, 172.16/12, 192.168/16'],
      ['Tabla', 'IP:puerto privado ↔ puerto público'],
      ['Efecto', 'Desde fuera no se puede iniciar conexión'],
      ['Especificación', 'RFC 3022, RFC 1918'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'router', proto: 'TCP', info: '52344 → 80 [SYN] Seq=0', size: '66 B', kind: 'req', note: `El portátil envía desde su IP privada ${CLIENT_IP}, puerto 52344.`, srcIp: CLIENT_IP, dstIp: WEB_IP },
      { t: 0.001, from: 'router', to: 'web', proto: 'TCP', info: '40001 → 80 [SYN] Seq=0', size: '66 B', kind: 'ctrl', note: `El router cambia el origen por su IP pública ${PUBLIC_IP}:40001 y anota la traducción.`, srcIp: PUBLIC_IP, dstIp: WEB_IP },
      { t: 0.017, from: 'web', to: 'router', proto: 'TCP', info: '80 → 40001 [SYN, ACK] Seq=0 Ack=1', size: '66 B', kind: 'res', note: 'El servidor solo conoce la IP pública y responde a ella.', srcIp: WEB_IP, dstIp: PUBLIC_IP },
      { t: 0.018, from: 'router', to: 'client', proto: 'TCP', info: '80 → 52344 [SYN, ACK] Seq=0 Ack=1', size: '66 B', kind: 'ctrl', note: 'El router busca el puerto 40001 en su tabla y devuelve el paquete al portátil.', srcIp: WEB_IP, dstIp: CLIENT_IP },
      { t: 0.02, from: 'client', to: 'router', proto: 'HTTP', info: '52344 → 80 GET / HTTP/1.1', size: '484 B', kind: 'req', note: 'Cada paquete de esta conexión recibe la misma traducción.', srcIp: CLIENT_IP, dstIp: WEB_IP },
      { t: 0.021, from: 'router', to: 'web', proto: 'HTTP', info: '40001 → 80 GET / HTTP/1.1', size: '484 B', kind: 'ctrl', note: 'Origen reescrito otra vez; el checksum TCP también se recalcula.', srcIp: PUBLIC_IP, dstIp: WEB_IP },
    ],
  },
  {
    id: 'traceroute',
    name: 'Traceroute',
    full: 'Descubrir el camino salto a salto',
    layer: 3,
    description:
      'Traceroute aprovecha el TTL: envía sondas con TTL 1, 2, 3… Cada router que reduce el TTL a cero descarta la sonda y avisa con un ICMP «Time Exceeded», revelando su dirección. Cuando la sonda llega al destino, este responde «Port Unreachable» y el viaje termina.',
    facts: [
      ['Capa', 'Red (capa 3)'],
      ['Sondas', 'UDP a puertos altos (33434+) o ICMP'],
      ['Respuestas', 'ICMP tipo 11 y tipo 3'],
      ['Comando', 'traceroute / tracert'],
      ['Mide', 'Saltos y latencia de cada uno'],
      ['Base', 'RFC 792 (ICMP), RFC 1393'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'router', proto: 'Traceroute', info: 'Sonda UDP → 33434, TTL=1', size: '74 B', kind: 'req', note: 'Primera sonda hacia el servidor web, pero con TTL 1.', dstIp: WEB_IP, ttl: 1 },
      { t: 0.002, from: 'router', to: 'client', proto: 'ICMP', info: 'Time Exceeded (TTL expirado en tránsito)', size: '102 B', kind: 'err', note: 'El router baja el TTL a 0, la descarta y avisa: salto 1 = 192.168.1.1 (2 ms).' },
      { t: 0.01, from: 'client', to: 'access', proto: 'Traceroute', info: 'Sonda UDP → 33435, TTL=2', size: '74 B', kind: 'req', note: 'Segunda sonda con TTL 2: pasa el primer router y muere en el siguiente.', dstIp: WEB_IP, ttl: 2 },
      { t: 0.019, from: 'access', to: 'client', proto: 'ICMP', info: 'Time Exceeded (TTL expirado en tránsito)', size: '102 B', kind: 'err', note: 'Salto 2 = 198.51.100.1, el router del proveedor (9 ms).' },
      { t: 0.03, from: 'client', to: 'web', proto: 'Traceroute', info: 'Sonda UDP → 33436, TTL=3', size: '74 B', kind: 'req', note: 'Tercera sonda: ahora llega hasta el destino.', ttl: 3 },
      { t: 0.044, from: 'web', to: 'client', proto: 'ICMP', info: 'Destination Unreachable (Port Unreachable)', size: '102 B', kind: 'res', note: 'Nadie escucha en el puerto 33436: el destino lo dice y traceroute sabe que ha terminado (14 ms).' },
    ],
  },
  {
    id: 'http2',
    name: 'HTTP/2',
    full: 'HTTP binario y multiplexado',
    layer: 7,
    description:
      'HTTP/2 mantiene los mismos métodos y cabeceras que HTTP/1.1, pero los envía en tramas binarias. Varias peticiones viajan a la vez por una sola conexión, cada una en su flujo (stream), y las cabeceras se comprimen con HPACK. Aquí se muestran las tramas ya descifradas.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '443'],
      ['Transporte', 'TCP + TLS (ALPN "h2")'],
      ['Unidad', 'Tramas: HEADERS, DATA, SETTINGS…'],
      ['Compresión', 'HPACK'],
      ['Especificación', 'RFC 9113'],
    ],
    packets: [
      ...tcpHandshake('web', 443, 0),
      { t: 0.03, from: 'client', to: 'web', proto: 'TLS', info: 'Client Hello (ALPN: h2, http/1.1)', size: '517 B', kind: 'tls', note: 'En el saludo TLS el navegador ofrece HTTP/2 mediante ALPN.' },
      { t: 0.05, from: 'web', to: 'client', proto: 'TLS', info: 'Server Hello, Certificate, Finished (ALPN: h2)', size: '3.9 KB', kind: 'tls', note: 'El servidor elige h2.' },
      { t: 0.055, from: 'client', to: 'web', proto: 'HTTP/2', info: 'Prefacio + SETTINGS', size: '96 B', kind: 'ctrl', note: 'El cliente envía la cadena mágica «PRI * HTTP/2.0» y sus ajustes.' },
      { t: 0.07, from: 'web', to: 'client', proto: 'HTTP/2', info: 'SETTINGS', size: '72 B', kind: 'ctrl', note: 'El servidor envía los suyos (y confirma los del cliente).' },
      { t: 0.071, from: 'client', to: 'web', proto: 'HTTP/2', info: 'HEADERS stream 1: GET /', size: '90 B', kind: 'req', note: 'Petición de la página en el flujo 1, con cabeceras HPACK.' },
      { t: 0.072, from: 'client', to: 'web', proto: 'HTTP/2', info: 'HEADERS stream 3: GET /estilo.css', size: '84 B', kind: 'req', note: 'Sin esperar, pide la hoja de estilos en el flujo 3.' },
      { t: 0.088, from: 'web', to: 'client', proto: 'HTTP/2', info: 'HEADERS + DATA stream 3: 200 text/css', size: '2.1 KB', kind: 'res', note: 'El CSS llega primero: los flujos son independientes.' },
      { t: 0.091, from: 'web', to: 'client', proto: 'HTTP/2', info: 'HEADERS + DATA stream 1: 200 text/html', size: '12.6 KB', kind: 'res', note: 'Y después la página, todo por la misma conexión.' },
    ],
  },
  {
    id: 'kerberos',
    name: 'Kerberos',
    full: 'Autenticación por tickets',
    layer: 7,
    description:
      'Kerberos evita enviar la contraseña por la red. Al iniciar sesión, el centro de distribución de claves (KDC) entrega un ticket maestro (TGT). Con él se piden tickets para cada servicio, como una carpeta compartida, que se presentan al servidor como prueba de identidad.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '88'],
      ['Transporte', 'UDP y TCP'],
      ['Mensajes', 'AS-REQ/REP, TGS-REQ/REP, AP-REQ'],
      ['Uso típico', 'Active Directory'],
      ['Especificación', 'RFC 4120'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'dc', proto: 'Kerberos', info: 'AS-REQ david@EJEMPLO.LOCAL', size: '220 B', kind: 'req', note: 'El equipo pide un ticket maestro para el usuario.' },
      { t: 0.004, from: 'dc', to: 'client', proto: 'Kerberos', info: 'KRB-ERROR PREAUTH_REQUIRED', size: '180 B', kind: 'err', note: 'El KDC exige preautenticación: demostrar que conoces la contraseña.' },
      { t: 0.01, from: 'client', to: 'dc', proto: 'Kerberos', info: 'AS-REQ con PA-ENC-TIMESTAMP', size: '300 B', kind: 'req', note: 'Envía la hora actual cifrada con una clave derivada de la contraseña.' },
      { t: 0.015, from: 'dc', to: 'client', proto: 'Kerberos', info: 'AS-REP (TGT)', size: '1.4 KB', kind: 'res', note: 'Recibe el TGT, válido unas 10 horas.' },
      { t: 2, from: 'client', to: 'dc', proto: 'Kerberos', info: 'TGS-REQ cifs/servidor.ejemplo.local', size: '1.5 KB', kind: 'req', note: 'Para abrir la carpeta compartida, pide un ticket de ese servicio presentando el TGT.' },
      { t: 2.004, from: 'dc', to: 'client', proto: 'Kerberos', info: 'TGS-REP (ticket de servicio)', size: '1.4 KB', kind: 'res', note: 'Recibe el ticket para «cifs/servidor».' },
      { t: 2.01, from: 'client', to: 'filesrv', proto: 'SMB', info: 'Session Setup Request (AP-REQ de Kerberos)', size: '1.6 KB', kind: 'req', note: 'Lo presenta al servidor de archivos, que lo valida sin hablar con el KDC.' },
      { t: 2.014, from: 'filesrv', to: 'client', proto: 'SMB', info: 'Session Setup Response', size: '330 B', kind: 'res', note: 'Acceso concedido sin que la contraseña haya viajado por la red.' },
    ],
  },
  {
    id: 'tftp',
    name: 'TFTP',
    full: 'Protocolo trivial de transferencia de archivos',
    layer: 7,
    description:
      'TFTP es un FTP mínimo sobre UDP, sin usuarios ni listados: solo pedir o enviar un archivo en bloques de 512 bytes, cada uno confirmado con un ACK. Se usa para arrancar equipos por red (PXE) y cargar firmware o configuraciones.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '69'],
      ['Transporte', 'UDP'],
      ['Bloques', '512 bytes; uno menor marca el final'],
      ['Seguridad', 'Ninguna'],
      ['Especificación', 'RFC 1350'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'filesrv', proto: 'TFTP', info: 'RRQ firmware.bin (octet)', size: '62 B', kind: 'req', note: 'Pide leer el archivo en modo binario.' },
      { t: 0.003, from: 'filesrv', to: 'client', proto: 'TFTP', info: 'DATA bloque 1 (512 bytes)', size: '558 B', kind: 'res', note: 'Primer bloque de 512 bytes.' },
      { t: 0.004, from: 'client', to: 'filesrv', proto: 'TFTP', info: 'ACK bloque 1', size: '46 B', kind: 'ctrl', note: 'Confirmación: hasta que llegue, no se envía el siguiente.' },
      { t: 0.007, from: 'filesrv', to: 'client', proto: 'TFTP', info: 'DATA bloque 2 (300 bytes)', size: '346 B', kind: 'res', note: 'Este bloque tiene menos de 512 bytes: es el último.' },
      { t: 0.008, from: 'client', to: 'filesrv', proto: 'TFTP', info: 'ACK bloque 2', size: '46 B', kind: 'ctrl', note: 'Transferencia completa: 812 bytes.' },
    ],
  },
  {
    id: 'telnet',
    name: 'Telnet',
    full: 'Terminal remoto sin cifrar',
    layer: 7,
    description:
      'Telnet fue la forma clásica de controlar un equipo a distancia. Todo, incluida la contraseña, viaja en texto plano: cualquiera en el camino puede leerlo. Por eso se sustituyó por SSH, aunque aún aparece en equipos antiguos.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '23'],
      ['Transporte', 'TCP'],
      ['Negociación', 'Órdenes IAC (0xFF)'],
      ['Seguridad', 'Ninguna: usa SSH'],
      ['Especificación', 'RFC 854'],
    ],
    packets: [
      ...tcpHandshake('router', 23, 0),
      { t: 0.03, from: 'router', to: 'client', proto: 'Telnet', info: 'IAC WILL ECHO, IAC WILL SGA, IAC DO TERMINAL-TYPE', size: '63 B', kind: 'ctrl', note: 'Negociación de opciones con bytes 0xFF (IAC).' },
      { t: 0.04, from: 'router', to: 'client', proto: 'Telnet', info: 'Texto: "login: "', size: '61 B', kind: 'res', note: 'El router pide el usuario.' },
      { t: 1.2, from: 'client', to: 'router', proto: 'Telnet', info: 'Texto: "admin\\r\\n"', size: '61 B', kind: 'req', note: 'El usuario viaja en claro…' },
      { t: 1.21, from: 'router', to: 'client', proto: 'Telnet', info: 'Texto: "Password: "', size: '64 B', kind: 'res', note: 'Pide la contraseña.' },
      { t: 2.5, from: 'client', to: 'router', proto: 'Telnet', info: 'Texto: "secreto123\\r\\n"', size: '66 B', kind: 'err', note: '…y la contraseña también: mira los bytes en el inspector.' },
      { t: 2.52, from: 'router', to: 'client', proto: 'Telnet', info: 'Texto: "router> "', size: '62 B', kind: 'res', note: 'Sesión abierta.' },
    ],
  },
  {
    id: 'coap',
    name: 'CoAP',
    full: 'Protocolo para aplicaciones restringidas',
    layer: 7,
    description:
      'CoAP es un «HTTP para microcontroladores»: mismos verbos (GET, POST…) y códigos parecidos (2.05 = 200), pero en mensajes binarios diminutos sobre UDP. Con la opción Observe, el cliente recibe avisos cada vez que cambia el valor.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '5683 (5684 con DTLS)'],
      ['Transporte', 'UDP'],
      ['Cabecera', '4 bytes'],
      ['Mensajes', 'CON, NON, ACK, RST'],
      ['Especificación', 'RFC 7252, RFC 7641'],
    ],
    packets: [
      { t: 0, from: 'client', to: 'iot', proto: 'CoAP', info: 'CON GET /temp', size: '55 B', kind: 'req', note: 'Petición confirmable: el sensor debe acusar recibo.' },
      { t: 0.008, from: 'iot', to: 'client', proto: 'CoAP', info: 'ACK 2.05 Content "21.5"', size: '58 B', kind: 'res', note: 'La respuesta va dentro del propio ACK: 21,5 °C.' },
      { t: 1, from: 'client', to: 'iot', proto: 'CoAP', info: 'CON GET /temp Observe', size: '56 B', kind: 'req', note: 'Ahora se suscribe con la opción Observe.' },
      { t: 1.008, from: 'iot', to: 'client', proto: 'CoAP', info: 'ACK 2.05 Content "21.5" Observe', size: '59 B', kind: 'res', note: 'Confirmado: avisará cuando cambie.' },
      { t: 61, from: 'iot', to: 'client', proto: 'CoAP', info: 'NON 2.05 Content "21.7" Observe', size: '59 B', kind: 'res', note: 'Notificación no confirmable con el nuevo valor.' },
    ],
  },
  {
    id: 'reverse',
    name: 'Proxy inverso',
    full: 'Un único punto de entrada delante de los servidores',
    layer: 7,
    description:
      'Un proxy inverso se coloca delante de los servidores de una web: recibe todas las conexiones, descifra el TLS con su propio certificado y reparte cada petición al servidor interno adecuado. Los visitantes solo ven una dirección; los servidores de aplicaciones, ocultos en la red interna, nunca tratan con TLS.',
    facts: [
      ['Capa', 'Aplicación (capa 7)'],
      ['Puerto', '443 hacia fuera, 80/8080 hacia dentro'],
      ['Transporte', 'TCP'],
      ['Funciones', 'TLS, balanceo, caché, compresión'],
      ['Ejemplos', 'nginx, HAProxy, Caddy, CDN'],
      ['Cabecera típica', 'X-Forwarded-For'],
    ],
    packets: [
      ...tcpHandshake('rproxy', 443, 0),
      { t: 0.03, from: 'client', to: 'rproxy', proto: 'TLS', info: 'Client Hello (SNI=www.ejemplo.com)', size: '517 B', kind: 'tls', note: 'El navegador cree hablar con la web; en realidad saluda al proxy inverso.' },
      { t: 0.048, from: 'rproxy', to: 'client', proto: 'TLS', info: 'Server Hello, Certificate, Finished', size: '4.1 KB', kind: 'tls', note: 'El certificado lo presenta el proxy: es quien guarda la clave privada de la web.' },
      { t: 0.052, from: 'client', to: 'rproxy', proto: 'TLS', info: 'Application Data (GET /)', size: '512 B', kind: 'req', note: 'La petición llega cifrada al proxy, que la descifra.' },
      ...tcpHandshake('app1', 8080, 0.053, 'rproxy', 41500),
      { t: 0.058, from: 'rproxy', to: 'app1', proto: 'HTTP', info: 'GET / HTTP/1.1 (X-Forwarded-For: 192.168.1.10)', size: '540 B', kind: 'req', note: 'Por la red interna la reenvía en HTTP normal, indicando la IP del visitante original.' },
      { t: 0.07, from: 'app1', to: 'rproxy', proto: 'HTTP', info: 'HTTP/1.1 200 OK (text/html)', size: '12.8 KB', kind: 'res', note: 'El servidor de aplicaciones responde al proxy, no al navegador.' },
      { t: 0.073, from: 'rproxy', to: 'client', proto: 'TLS', info: 'Application Data (200 OK)', size: '12.9 KB', kind: 'res', note: 'El proxy vuelve a cifrar la respuesta y se la entrega al navegador.' },
    ],
  },
  {
    id: 'ble',
    name: 'Bluetooth LE',
    full: 'Bluetooth de bajo consumo',
    layer: 2,
    description:
      'Los dispositivos BLE, como pulseras o sensores, anuncian su presencia en tres canales de publicidad. El móvil los escanea, se conecta y lee o recibe sus datos mediante ATT/GATT: atributos con un identificador (handle), como la frecuencia cardiaca.',
    facts: [
      ['Capa', 'Enlace + aplicación (pila propia)'],
      ['Banda', '2,4 GHz, 40 canales (3 de anuncios)'],
      ['Dirección', '48 bits, como una MAC'],
      ['Datos', 'GATT: servicios y características'],
      ['Consumo', 'Meses o años con una pila'],
      ['Especificación', 'Bluetooth Core 5.x'],
    ],
    packets: [
      { t: 0, from: 'ble', to: 'phone', proto: 'BLE', info: 'ADV_IND "Pulsera" (servicio 0x180D)', size: '39 B', kind: 'ctrl', note: 'La pulsera se anuncia: nombre y servicio de frecuencia cardiaca.' },
      { t: 0.02, from: 'phone', to: 'ble', proto: 'BLE', info: 'SCAN_REQ', size: '22 B', kind: 'req', note: 'El móvil pide más información.' },
      { t: 0.021, from: 'ble', to: 'phone', proto: 'BLE', info: 'SCAN_RSP', size: '31 B', kind: 'res', note: 'Respuesta de escaneo con datos extra.' },
      { t: 0.5, from: 'phone', to: 'ble', proto: 'BLE', info: 'CONNECT_IND intervalo 30 ms', size: '44 B', kind: 'req', note: 'El móvil abre la conexión y fija cada cuánto hablarán.' },
      { t: 0.6, from: 'phone', to: 'ble', proto: 'BLE', info: 'ATT Read Request handle 0x002a', size: '17 B', kind: 'req', note: 'Lee la característica de posición del sensor.' },
      { t: 0.63, from: 'ble', to: 'phone', proto: 'BLE', info: 'ATT Read Response (muñeca)', size: '16 B', kind: 'res', note: 'Valor 2: muñeca.' },
      { t: 1.6, from: 'ble', to: 'phone', proto: 'BLE', info: 'ATT Notification handle 0x0027: 72 lpm', size: '18 B', kind: 'res', note: 'Cada segundo envía una notificación con el pulso: 72 latidos por minuto.' },
    ],
  },
]
