export interface Question {
  q: string
  options: string[]
  answer: number
  why: string
}

export const QUIZ: Record<string, Question[]> = {
  http: [
    { q: '¿Qué ocurre antes de enviar el GET?', options: ['Se resuelve el nombre por DNS y se abre una conexión TCP', 'El servidor envía la página sin pedirla', 'Se negocia una clave TLS'], answer: 0, why: 'El navegador necesita la IP (DNS) y una conexión TCP antes de hablar HTTP.' },
    { q: '¿Qué significa el código 200?', options: ['Redirección', 'Éxito: aquí tienes el recurso', 'Recurso no encontrado'], answer: 1, why: '2xx es éxito; 3xx redirección; 4xx error del cliente.' },
  ],
  https: [
    { q: '¿Qué aporta el certificado del servidor?', options: ['Comprime la página', 'Demuestra que el servidor es quien dice ser', 'Asigna una IP'], answer: 1, why: 'El certificado, firmado por una autoridad, autentica al servidor.' },
    { q: 'Tras el saludo TLS, ¿cómo viaja la petición HTTP?', options: ['En texto plano', 'Cifrada como Application Data', 'Por UDP'], answer: 1, why: 'Todo lo posterior al saludo va cifrado en registros Application Data.' },
  ],
  dns: [
    { q: '¿A quién pregunta primero un resolutor sin caché?', options: ['Al servidor web', 'A un servidor raíz', 'Al router de casa'], answer: 1, why: 'La resolución iterativa empieza por la raíz, luego el TLD y por último el autoritativo.' },
    { q: '¿Para qué sirve el TTL de un registro?', options: ['Cuánto tiempo puede guardarse en caché', 'Cuántos saltos puede dar', 'El tamaño máximo'], answer: 0, why: 'El TTL dice durante cuántos segundos la respuesta sigue siendo válida en caché.' },
  ],
  dhcp: [
    { q: '¿Cuál es el orden correcto de DHCP?', options: ['Request, Offer, Discover, ACK', 'Discover, Offer, Request, ACK', 'Offer, Discover, ACK, Request'], answer: 1, why: 'DORA: Discover, Offer, Request, Acknowledge.' },
    { q: '¿Por qué el Discover va a 255.255.255.255?', options: ['Porque el cliente aún no conoce al servidor ni tiene IP', 'Para ir más rápido', 'Porque usa TCP'], answer: 0, why: 'Sin IP ni servidor conocido, la única opción es la difusión.' },
  ],
  tcp: [
    { q: '¿Cuántos mensajes tiene el saludo inicial de TCP?', options: ['2', '3', '4'], answer: 1, why: 'SYN, SYN-ACK y ACK: el saludo de tres vías.' },
    { q: '¿Qué hace TCP si se pierde un segmento?', options: ['Lo ignora', 'Lo retransmite al no recibir su ACK', 'Cierra la conexión'], answer: 1, why: 'Sin confirmación a tiempo, el emisor retransmite.' },
  ],
  udp: [
    { q: '¿Qué hace UDP con un datagrama perdido?', options: ['Lo reenvía', 'Nada: no lo detecta ni lo reenvía', 'Pide al router que lo busque'], answer: 1, why: 'UDP no tiene confirmaciones ni retransmisiones.' },
    { q: '¿Por qué conviene UDP para voz en directo?', options: ['Porque cifra los datos', 'Porque un dato tardío ya no sirve y es mejor seguir', 'Porque garantiza el orden'], answer: 1, why: 'En tiempo real importa la latencia más que la fiabilidad.' },
  ],
  icmp: [
    { q: '¿Qué mensaje ICMP envía ping?', options: ['Echo Request (tipo 8)', 'Time Exceeded (tipo 11)', 'Redirect (tipo 5)'], answer: 0, why: 'ping envía Echo Request y espera Echo Reply (tipo 0).' },
    { q: '¿ICMP usa puertos?', options: ['Sí, el 7', 'No, va directamente sobre IP', 'Sí, el 53'], answer: 1, why: 'ICMP es un protocolo de capa 3 sin puertos.' },
  ],
  arp: [
    { q: '¿Qué averigua ARP?', options: ['La IP a partir del nombre', 'La MAC a partir de la IP', 'El puerto abierto'], answer: 1, why: 'ARP traduce una IP local a la dirección MAC de su dueño.' },
    { q: '¿A quién se envía la pregunta ARP?', options: ['A todos (difusión ff:ff:ff:ff:ff:ff)', 'Al servidor DNS', 'Solo al router'], answer: 0, why: 'Como no se conoce la MAC, la pregunta va a toda la red local.' },
  ],
  ssh: [
    { q: '¿Cómo comprueba el cliente que habla con el servidor correcto?', options: ['Por la velocidad de respuesta', 'Comparando la clave de host con known_hosts', 'Por el puerto 22'], answer: 1, why: 'La firma con la clave de host se compara con la guardada en known_hosts.' },
    { q: '¿Cuándo se envía la autenticación del usuario?', options: ['Antes del intercambio de claves', 'Ya cifrada, tras NEWKEYS', 'En el SYN'], answer: 1, why: 'Primero se acuerdan claves; después todo, incluida la autenticación, va cifrado.' },
  ],
  smtp: [
    { q: '¿Cómo se marca el final del mensaje tras DATA?', options: ['Con una línea que solo contiene un punto', 'Con QUIT', 'Cerrando TCP'], answer: 0, why: 'Una línea con "." indica el fin del cuerpo del correo.' },
    { q: '¿Quién habla primero en SMTP?', options: ['El cliente con EHLO', 'El servidor con un saludo 220', 'Nadie: empieza con DATA'], answer: 1, why: 'Tras conectar, el servidor saluda con 220 y entonces el cliente envía EHLO.' },
  ],
  websocket: [
    { q: '¿Con qué respuesta acepta el servidor el cambio a WebSocket?', options: ['200 OK', '101 Switching Protocols', '301 Moved'], answer: 1, why: 'El 101 confirma el cambio de protocolo.' },
    { q: '¿Qué marcos van enmascarados?', options: ['Los del servidor', 'Los del cliente', 'Ninguno'], answer: 1, why: 'El estándar obliga a enmascarar los marcos del cliente al servidor.' },
  ],
  http3: [
    { q: '¿Sobre qué transporte va QUIC?', options: ['TCP', 'UDP', 'Directamente sobre Ethernet'], answer: 1, why: 'QUIC implementa fiabilidad y cifrado por encima de UDP.' },
    { q: '¿Qué problema evita QUIC frente a HTTP/2 sobre TCP?', options: ['El bloqueo de cabeza de línea entre flujos', 'El uso de DNS', 'Los certificados'], answer: 0, why: 'En QUIC cada flujo es independiente: una pérdida no frena a los demás.' },
  ],
  ntp: [
    { q: '¿Cuántas marcas de tiempo usa NTP para calcular el desfase?', options: ['1', '2', '4'], answer: 2, why: 'T1 a T4: salida y llegada en cliente y servidor.' },
    { q: '¿Qué indica el estrato?', options: ['La distancia a un reloj de referencia', 'La velocidad de la red', 'El número de clientes'], answer: 0, why: 'Estrato 1 está junto a un reloj atómico o GPS; cada nivel suma uno.' },
  ],
  imap: [
    { q: '¿Para qué sirven las etiquetas a1, a2…?', options: ['Para cifrar', 'Para emparejar cada respuesta con su orden', 'Para numerar los correos'], answer: 1, why: 'El resultado final lleva la misma etiqueta que la orden.' },
    { q: '¿Dónde queda el correo con IMAP?', options: ['Solo en el móvil', 'En el servidor, sincronizado', 'Se borra al leerlo'], answer: 1, why: 'A diferencia de POP3, IMAP mantiene el buzón en el servidor.' },
  ],
  bgp: [
    { q: '¿Qué anuncia un mensaje UPDATE?', options: ['Rutas hacia bloques de direcciones', 'La hora', 'Un nombre de dominio'], answer: 0, why: 'UPDATE anuncia (o retira) prefijos con sus atributos como AS_PATH.' },
    { q: '¿Qué pasa si no llegan KEEPALIVE durante el hold time?', options: ['Nada', 'La sesión se cae y se retiran sus rutas', 'Se duplica la velocidad'], answer: 1, why: 'Al expirar el hold time el vecino se considera caído.' },
  ],
  wireguard: [
    { q: '¿Cuántos mensajes tiene el saludo de WireGuard?', options: ['2', '4', '6'], answer: 0, why: 'Initiation y Response: un solo viaje de ida y vuelta.' },
    { q: '¿Cómo viaja el tráfico del túnel?', options: ['En TCP sin cifrar', 'Cifrado dentro de datagramas UDP', 'Por ICMP'], answer: 1, why: 'Cada paquete IP va cifrado con ChaCha20-Poly1305 dentro de UDP.' },
  ],
  webrtc: [
    { q: '¿Para qué sirve STUN en WebRTC?', options: ['Para cifrar el vídeo', 'Para descubrir tu IP y puerto públicos', 'Para comprimir el audio'], answer: 1, why: 'STUN devuelve la dirección con la que te ve Internet, necesaria tras un NAT.' },
    { q: '¿Por dónde viaja el vídeo cuando hay camino directo?', options: ['Por el servidor web', 'De igual a igual, cifrado con SRTP', 'Por correo'], answer: 1, why: 'El servidor solo hace la señalización; los medios van directos.' },
  ],
  sip: [
    { q: '¿Qué mensaje SIP inicia una llamada?', options: ['BYE', 'INVITE', 'REGISTER'], answer: 1, why: 'INVITE invita al otro extremo e incluye la descripción SDP.' },
    { q: '¿Por qué protocolo viaja la voz?', options: ['Por SIP', 'Por RTP', 'Por SMTP'], answer: 1, why: 'SIP negocia la llamada; el audio va aparte en paquetes RTP.' },
  ],
  rtsp: [
    { q: '¿Qué orden RTSP empieza la reproducción?', options: ['PLAY', 'SETUP', 'DESCRIBE'], answer: 0, why: 'DESCRIBE describe, SETUP prepara y PLAY arranca el flujo.' },
    { q: '¿Dónde se usa mucho RTSP?', options: ['En cámaras IP', 'En impresoras', 'En DNS'], answer: 0, why: 'Es el protocolo típico de cámaras y videovigilancia.' },
  ],
  rtmp: [
    { q: '¿Para qué se usa RTMP hoy?', options: ['Para enviar un directo a la plataforma de streaming', 'Para leer correo', 'Para asignar IPs'], answer: 0, why: 'Programas como OBS lo usan para la ingesta de directos.' },
    { q: '¿Sobre qué transporte va RTMP?', options: ['UDP', 'TCP', 'ICMP'], answer: 1, why: 'Usa una única conexión TCP al puerto 1935.' },
  ],
  doh: [
    { q: '¿Qué gana DNS al ir sobre HTTPS?', options: ['Más velocidad siempre', 'Privacidad: nadie en la red ve qué dominios consultas', 'Direcciones más cortas'], answer: 1, why: 'La consulta viaja cifrada dentro de TLS.' },
    { q: '¿Qué puerto usa DoH?', options: ['53', '443', '853'], answer: 1, why: 'El mismo que HTTPS; 853 es DNS sobre TLS (DoT).' },
  ],
  dnssec: [
    { q: '¿Qué protege DNSSEC?', options: ['La privacidad de las consultas', 'La autenticidad e integridad de las respuestas', 'La velocidad'], answer: 1, why: 'Firma los registros, pero no los cifra.' },
    { q: '¿Qué registro contiene la firma?', options: ['RRSIG', 'MX', 'CNAME'], answer: 0, why: 'RRSIG firma un conjunto de registros; DNSKEY tiene la clave para verificarla.' },
  ],
  pop3: [
    { q: '¿Qué hace normalmente POP3 con el correo descargado?', options: ['Lo deja sincronizado', 'Lo borra del servidor', 'Lo reenvía'], answer: 1, why: 'Descarga y borra; IMAP, en cambio, sincroniza.' },
    { q: '¿Qué orden descarga un mensaje?', options: ['RETR', 'DELE', 'LIST'], answer: 0, why: 'RETR n recupera el mensaje número n.' },
  ],
  ftp: [
    { q: '¿Cuántas conexiones usa FTP?', options: ['Una', 'Dos: control y datos', 'Ninguna, usa UDP'], answer: 1, why: 'Las órdenes van por el 21 y los archivos por una conexión de datos aparte.' },
    { q: '¿Por qué FTP clásico no es seguro?', options: ['Porque es lento', 'Porque la contraseña viaja sin cifrar', 'Porque usa UDP'], answer: 1, why: 'Usuario y contraseña van en texto plano; usa FTPS o SFTP.' },
  ],
  smb: [
    { q: '¿Para qué sirve SMB?', options: ['Carpetas e impresoras compartidas', 'Enviar correo', 'Resolver nombres'], answer: 0, why: 'Es el protocolo de recursos compartidos de Windows.' },
    { q: '¿Qué puerto usa SMB moderno?', options: ['21', '445', '3389'], answer: 1, why: 'SMB 2/3 funciona directamente sobre TCP 445.' },
  ],
  tls: [
    { q: '¿Cuántos viajes de ida y vuelta necesita el saludo de TLS 1.3?', options: ['1', '2', '3'], answer: 0, why: 'El cliente envía su clave en el primer mensaje: 1-RTT.' },
    { q: 'En TLS 1.3, ¿se ve el certificado en la red?', options: ['Sí, en claro', 'No, va cifrado tras el Server Hello', 'Solo con HTTP/2'], answer: 1, why: 'Todo lo posterior al Server Hello ya está cifrado.' },
  ],
  socks5: [
    { q: '¿Qué hace un proxy SOCKS5 tras el CONNECT?', options: ['Interpreta el HTTP', 'Reenvía bytes sin mirarlos', 'Cierra la conexión'], answer: 1, why: 'SOCKS es un túnel genérico de bytes.' },
    { q: '¿Qué puerto es el habitual de SOCKS?', options: ['1080', '8080', '25'], answer: 0, why: '1080 es el puerto estándar de SOCKS.' },
  ],
  proxy: [
    { q: '¿Qué método usa un proxy HTTP para HTTPS?', options: ['GET', 'CONNECT', 'TRACE'], answer: 1, why: 'CONNECT abre un túnel TCP con el destino.' },
    { q: '¿Puede el proxy leer el HTTPS que pasa por el túnel?', options: ['Sí', 'No, va cifrado de extremo a extremo', 'Solo las imágenes'], answer: 1, why: 'El TLS se negocia entre navegador y servidor.' },
  ],
  modbus: [
    { q: '¿Qué código de función lee registros?', options: ['0x03', '0x06', '0x10'], answer: 0, why: '03 lee registros de retención; 06 escribe uno.' },
    { q: '¿Qué seguridad trae Modbus/TCP?', options: ['TLS obligatorio', 'Ninguna', 'Contraseña por registro'], answer: 1, why: 'No tiene autenticación ni cifrado: hay que aislar la red.' },
  ],
  mqtt: [
    { q: '¿Cómo se comunican los dispositivos MQTT?', options: ['Directamente entre sí', 'Publicando y suscribiéndose a temas en un broker', 'Por difusión'], answer: 1, why: 'El broker reparte los mensajes de cada tema.' },
    { q: '¿Qué garantiza QoS 1?', options: ['Entrega al menos una vez', 'Nada', 'Cifrado'], answer: 0, why: 'Con QoS 1 el receptor confirma con PUBACK.' },
  ],
  snmp: [
    { q: '¿Qué es una trap SNMP?', options: ['Una consulta del gestor', 'Un aviso espontáneo del agente', 'Un ataque'], answer: 1, why: 'El equipo avisa por su cuenta, por el puerto 162.' },
    { q: '¿Cómo se identifica cada variable?', options: ['Por un OID', 'Por una URL', 'Por su MAC'], answer: 0, why: 'Cada dato de la MIB tiene un identificador de objeto (OID).' },
  ],
  ldap: [
    { q: '¿Qué operación LDAP valida un usuario?', options: ['Bind', 'Search', 'Delete'], answer: 0, why: 'Bind autentica con un DN y una contraseña.' },
    { q: '¿Qué guarda un directorio LDAP?', options: ['Usuarios, grupos y equipos', 'Páginas web', 'Vídeos'], answer: 0, why: 'Es una base jerárquica de la organización, como Active Directory.' },
  ],
  captive: [
    { q: '¿Cómo detecta el sistema un portal cautivo?', options: ['Pide una URL de prueba y no recibe lo esperado', 'Por el nombre de la red', 'Por la intensidad de señal'], answer: 0, why: 'Si en vez de 204 llega una redirección, hay portal.' },
    { q: '¿Qué código suele usar la redirección?', options: ['302', '404', '500'], answer: 0, why: 'Un 302 envía al navegador a la página de acceso.' },
  ],
  ipv4: [
    { q: '¿Qué indica la marca MF?', options: ['Que vienen más fragmentos', 'Que el paquete es urgente', 'Que es multicast'], answer: 0, why: 'More Fragments: aún faltan trozos del datagrama.' },
    { q: '¿Qué hace un router con el TTL?', options: ['Lo aumenta', 'Lo reduce en 1 y descarta el paquete si llega a 0', 'Nada'], answer: 1, why: 'Así se evitan paquetes dando vueltas para siempre.' },
  ],
  ipv6: [
    { q: '¿Qué sustituye a ARP en IPv6?', options: ['NDP (mensajes ICMPv6)', 'DHCPv6', 'DNS'], answer: 0, why: 'Neighbor Solicitation y Advertisement hacen ese trabajo.' },
    { q: '¿Cuántos bits tiene una dirección IPv6?', options: ['32', '64', '128'], answer: 2, why: '128 bits, frente a los 32 de IPv4.' },
  ],
  igmp: [
    { q: '¿Para qué sirve IGMP?', options: ['Para unirse a grupos multicast', 'Para cifrar', 'Para asignar IPs'], answer: 0, why: 'Le dice al router qué grupos quiere recibir el equipo.' },
    { q: '¿Qué rango es multicast en IPv4?', options: ['224.0.0.0 – 239.255.255.255', '10.0.0.0 – 10.255.255.255', '192.168.0.0/16'], answer: 0, why: 'El bloque 224.0.0.0/4 está reservado a multicast.' },
  ],
  ipsec: [
    { q: '¿Qué protocolo negocia las claves de IPsec?', options: ['IKEv2', 'ARP', 'SNMP'], answer: 0, why: 'IKE_SA_INIT e IKE_AUTH crean el túnel.' },
    { q: '¿En qué viajan los datos protegidos?', options: ['En ESP', 'En ICMP', 'En HTTP'], answer: 0, why: 'ESP (protocolo IP 50) cifra y autentica cada paquete.' },
  ],
  ospf: [
    { q: '¿Qué algoritmo usa OSPF para calcular rutas?', options: ['Dijkstra (camino más corto)', 'Ordenación burbuja', 'Distancia en saltos de RIP'], answer: 0, why: 'Cada router calcula el árbol de caminos más cortos.' },
    { q: '¿A qué dirección envía OSPF sus Hello?', options: ['224.0.0.5', '255.255.255.255', '8.8.8.8'], answer: 0, why: 'Es el grupo multicast de todos los routers OSPF.' },
  ],
  ethernet: [
    { q: '¿Qué hace un switch con una trama a una MAC desconocida?', options: ['La descarta', 'La inunda por todos los puertos', 'La devuelve'], answer: 1, why: 'Inunda y aprende el puerto cuando llega la respuesta.' },
    { q: '¿Cómo aprende el switch dónde está cada equipo?', options: ['Por la MAC de origen de las tramas', 'Por DNS', 'Preguntando al router'], answer: 0, why: 'Anota en qué puerto aparece cada MAC de origen.' },
  ],
  vlan: [
    { q: '¿Cuánto ocupa la etiqueta 802.1Q?', options: ['4 bytes', '20 bytes', '1 bit'], answer: 0, why: 'TPID 0x8100 + 2 bytes con prioridad y VLAN ID.' },
    { q: '¿Dónde viajan las tramas etiquetadas?', options: ['En los enlaces troncales', 'Hasta el portátil', 'Por Internet'], answer: 0, why: 'Los puertos de acceso quitan la etiqueta antes de entregar.' },
  ],
  stp: [
    { q: '¿Qué problema evita STP?', options: ['Bucles de capa 2', 'Contraseñas débiles', 'Falta de IPs'], answer: 0, why: 'Bloquea enlaces redundantes para que las tramas no circulen sin fin.' },
    { q: '¿Qué switch se convierte en raíz?', options: ['El de menor ID de puente', 'El más nuevo', 'El que tenga más puertos'], answer: 0, why: 'Gana la prioridad + MAC más baja.' },
  ],
  pppoe: [
    { q: '¿Cuál es el primer mensaje de PPPoE?', options: ['PADI', 'PADS', 'LCP'], answer: 0, why: 'PADI busca servidores de acceso por difusión.' },
    { q: '¿Por qué la MTU baja a 1492?', options: ['Por los 8 bytes de cabecera PPPoE + PPP', 'Por el Wi-Fi', 'Por DNS'], answer: 0, why: '1500 − 8 = 1492.' },
  ],
  wifi: [
    { q: '¿Qué anuncia una trama Beacon?', options: ['La existencia de la red y sus capacidades', 'Un error', 'Una dirección IP'], answer: 0, why: 'El AP la emite periódicamente con el SSID.' },
    { q: '¿Qué paso va después de la autenticación 802.11?', options: ['La asociación', 'El DNS', 'El apagado'], answer: 0, why: 'Autenticación y luego Association Request/Response.' },
  ],
  wpa3: [
    { q: '¿Qué intercambio introduce WPA3-Personal?', options: ['SAE', 'WEP', 'PAP'], answer: 0, why: 'SAE demuestra conocer la contraseña sin enviarla.' },
    { q: '¿Cuántos mensajes tiene el saludo EAPOL-Key?', options: ['2', '4', '8'], answer: 1, why: 'El saludo de 4 vías instala las claves de sesión.' },
  ],
  dot1x: [
    { q: '¿Quién decide si un usuario entra en 802.1X?', options: ['El punto de acceso', 'El servidor RADIUS', 'El propio portátil'], answer: 1, why: 'El AP solo reenvía; RADIUS acepta o rechaza.' },
    { q: '¿Qué viaja entre el equipo y el AP?', options: ['EAPOL', 'SMTP', 'BGP'], answer: 0, why: 'EAP sobre LAN (EAPOL); del AP al servidor va dentro de RADIUS.' },
  ],
}
