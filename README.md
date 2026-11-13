# Protocolos de Red

Explorador interactivo de protocolos de red: mira cómo viajan los paquetes de **66 lecciones** (62 protocolos y 4 escenarios de fallo) paso a paso, en un diagrama de red, un diagrama de secuencia y una tabla tipo Wireshark, con **cada paquete decodificado byte a byte**.

**🌐 En vivo: https://protocolos-de-red-eight.vercel.app** (Vercel) · https://protocolos-de-red.david-zabala-asir.workers.dev (Cloudflare)

**Diseñado por David.** Interfaz inspirada en [Protocol Explorer](https://protocol-explorer-alpha.vercel.app/), reconstruida desde cero con React + Tailwind CSS y contenido propio en español.

## Protocolos

| Capa | Protocolos |
|---|---|
| 7 · Aplicación | HTTP, HTTPS, HTTP/2, HTTP/3 (QUIC), WebSocket, WebRTC, SIP, RTSP, RTMP, DNS, DoH, DNSSEC, mDNS, SSDP/UPnP, DHCP, NTP, SMTP, POP3, IMAP, FTP, TFTP, SMB, SSH, Telnet, Kerberos, Proxy HTTP, Proxy inverso, Modbus/TCP, MQTT, CoAP, SNMP, Syslog, LDAP, BGP, Portal cautivo |
| 6 · Presentación | TLS 1.3 |
| 5 · Sesión | SOCKS5 |
| 4 · Transporte | TCP, UDP |
| 3 · Red | IPv4, IPv6, ICMP, Traceroute, NAT, IGMP (multicast), IPsec, GRE, OSPF, RIP, VRRP, WireGuard |
| 2 · Enlace | Ethernet y switches, ARP, VLAN 802.1Q, STP, LLDP, PPPoE, Wi-Fi (802.11), WPA3, 802.1X / RADIUS, Wake-on-LAN, Bluetooth LE |

## Funciones

- **Barra superior**: lista de protocolos (panel lateral), logo, crédito de diseño y tema claro/oscuro (se recuerda entre visitas).
- **Buscador** con atajo `Ctrl K` y navegación con flechas.
- **Selector de capa OSI** (1–7): marca la capa del protocolo actual y filtra la lista.
- **Escenario** con dos vistas: *Red* (los paquetes recorren la topología) y *Secuencia*.
- **Panel lateral con pestañas**:
  - *Resumen*: descripción, capa, puerto, transporte y RFC.
  - *Inspector*: cada paquete construido byte a byte (Ethernet, 802.11, 802.1Q, IPv4 con fragmentación, IPv6/ICMPv6, TCP/UDP/ICMP/ARP y la carga de cada protocolo: DNS, DHCP, STUN, RTP, SMB2, Modbus, MQTT, SNMP, LDAP, RADIUS, IKEv2, ESP, OSPF, IGMP, PPPoE, EAPOL, STP…), con longitudes y checksums IPv4/IPv6/TCP/UDP/ICMP/IGMP calculados de verdad. Al pasar por un campo se resaltan sus bytes en el volcado hexadecimal.
  - *Quiz*: preguntas con explicación para cada protocolo.
- **Progreso guardado**: una lección cuenta como completada al verla entera y acertar su quiz; el panel de protocolos muestra el avance (n/66).
- **Flujo de paquetes**: reproducir/pausa, paso a paso, retroceder, reiniciar, velocidad 0.5×–2×, barra de progreso, botón para inspeccionar cada paquete y atajos (`Espacio`, `←`/`→`, `R`).
- **Descarga en `.pcapng`**: cada lección se descarga como captura real que se abre en Wireshark (Ethernet, 802.11 y Bluetooth LE).
- **Recorrido guiado** de 15 lecciones, de Ethernet a HTTP/3.
- **Qué pasa si falla**: pérdida de un segmento TCP y retransmisión, dominio inexistente (NXDOMAIN), certificado TLS caducado y DHCP sin direcciones libres.
- **Comparar** dos protocolos lado a lado (secuencia, paquetes, tiempo, bytes, cifrado).
- **Modo examen**: 10 preguntas al azar de las lecciones vistas, nota final e impresión como certificado.
- **Incrustar** cualquier lección en otra web con un `<iframe>` (`/dns/?embed=1`).
- **Español e inglés**: botón ES/EN en la cabecera; se recuerda entre visitas y se elige solo según el idioma del navegador. El inspector de paquetes también está traducido entero.
- **Funciona sin conexión**: tras la primera visita, un service worker guarda la web y todas las lecciones.
- **Cuenta opcional** (Clerk): con «Iniciar sesión» el progreso se guarda en tu perfil y te sigue a cualquier dispositivo; sin cuenta todo sigue funcionando igual. Se carga en segundo plano y solo si el proyecto tiene `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Ver [/privacidad/](https://protocolos-de-red-eight.vercel.app/privacidad/).
- **Subneteo** (`/subneteo/`): calculadora de subredes, reparto VLSM y ejercicios con solución paso a paso.
- **Consola de comandos** (`/consola/`): un terminal al estilo Cisco IOS sobre la red de las lecciones (show ip route, show vlan brief, show mac address-table, ping, hostname, interfaces, VLANs…), con ayuda contextual (?), autocompletado (Tab) y 8 retos guiados.
- **Referencia CCNA** (`/referencia/`): la chuleta (puertos, distancias administrativas, rangos, cabeceras, EtherTypes, temporizadores, multicast, ICMP, máscaras, OSI y Wi-Fi) y flashcards con repaso espaciado; cada fila enlaza con su lección.
- **Carga ligera**: el inspector, el decodificador, la descarga `.pcapng`, la comparación, el examen y el texto en inglés se descargan solo cuando se usan (~141 KB comprimidos en la primera carga, antes 197 KB).
- **Instalable** como app en el móvil, con imagen para compartir en redes.
- **Enlaces directos** por protocolo y paso: `/dns/`, `/tcp/#3`, `/#comparar=tcp,udp`, `/#examen`. Cada lección tiene su propia página pre-generada (título, descripción y contenido para buscadores) y hay `sitemap.xml`.

## Desarrollo

```bash
npm install
npm run dev
npm run build
npm test      # 1152 pruebas: decodificación, checksums, rutas, pcapng y traducciones (también del inspector)
npm run e2e   # Playwright + axe en Chrome, Android, Safari e iPhone (180 casos)
```

GitHub Actions ejecuta todo en cada push, también en Firefox ([`.github/workflows/pruebas.yml`](.github/workflows/pruebas.yml)).

Stack: Vite, React 19, TypeScript, Tailwind CSS v4 y Lucide React. Estadísticas de visitas con Vercel Web Analytics (sin cookies ni datos personales, solo en la web publicada); ningún otro script de terceros.

## Auditoría de accesibilidad (WCAG 2.1 AA)

| Criterio | Cómo se cumple |
|---|---|
| 1.1.1 Contenido no textual | Iconos decorativos con `aria-hidden`; los diagramas SVG tienen `role="img"` con una descripción del paquete actual, y la tabla es la alternativa textual completa. |
| 1.3.1 Información y relaciones | Landmarks `header`/`main`/`aside`/`nav`/`footer`, encabezados jerárquicos, `<dl>` para la ficha técnica y `<table>` con `caption` y `th scope`. |
| 1.4.1 Uso del color | Cada tipo de paquete lleva también texto (leyenda, columna Protocolo, número). |
| 1.4.3 Contraste | Texto ≥ 4.5:1 en ambos temas (p. ej. texto secundario 7.5:1 oscuro / 7.6:1 claro; botón primario 5.6:1 / 6.7:1). |
| 1.4.11 Contraste no textual | Bordes de controles ≥ 3:1 (3.6:1 en ambos temas); anillo de foco con el color de acento. |
| 2.1.1 Teclado | Todo es operable con teclado: pestañas con flechas, buscador con ↑/↓/Enter/Esc, filas de la tabla con botón. |
| 2.3.3 / movimiento | Con `prefers-reduced-motion` el paquete aparece directamente en su destino. |
| 2.4.1 Saltar bloques | Enlace «Saltar al contenido». |
| 2.4.7 Foco visible | `:focus-visible` con contorno de 2 px. |
| 2.5.5 Tamaño de objetivo | Controles principales de 44×44 px (los números de fila son de 28 px, por encima de los 24 px de WCAG 2.2). |
| 4.1.2 Nombre, rol, valor | `aria-pressed` en el tema, `aria-current` en capa/protocolo/paquete, `role="tablist"`, `combobox` + `listbox` en la búsqueda, `<dialog>` nativo con foco atrapado y cierre con Esc. |
| 4.1.3 Mensajes de estado | Región `aria-live` anuncia cada paquete y su explicación. |

Los colores de cada tipo de paquete usan tonos más oscuros en el tema claro, con contraste ≥ 4,5:1 sobre el fondo.

### Publicar en Cloudflare

```bash
npm run build
npx wrangler deploy
```
