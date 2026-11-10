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
}
