# Protocolos de Red

Explorador interactivo de protocolos de red: mira cómo viajan los paquetes de **16 protocolos** —HTTP, HTTPS, HTTP/3 (QUIC), WebSocket, DNS, DHCP, NTP, SSH, SMTP, IMAP, BGP, TCP, UDP, ICMP, WireGuard y ARP— paso a paso, en un diagrama de red, un diagrama de secuencia y una tabla tipo Wireshark, con **cada paquete decodificado byte a byte**.

**Diseñado por David.** Interfaz inspirada en [Protocol Explorer](https://protocol-explorer-alpha.vercel.app/), reconstruida desde cero con React + Tailwind CSS y contenido propio en español.

## Funciones

- **Barra superior**: lista de protocolos (panel lateral), logo, crédito de diseño y tema claro/oscuro (se recuerda entre visitas).
- **Buscador** con atajo `Ctrl K` y navegación con flechas.
- **Selector de capa OSI** (1–7): marca la capa del protocolo actual y filtra la lista.
- **Escenario** con dos vistas: *Red* (los paquetes recorren la topología) y *Secuencia*.
- **Panel lateral con pestañas**:
  - *Resumen*: descripción, capa, puerto, transporte y RFC.
  - *Inspector*: cada paquete construido byte a byte (Ethernet, IPv4, TCP/UDP/ICMP/ARP y la carga de la aplicación: DNS, DHCP, NTP, BGP, TLS, QUIC, WireGuard, WebSocket…), con longitudes y checksums IPv4/TCP/UDP calculados de verdad. Al pasar por un campo se resaltan sus bytes en el volcado hexadecimal.
  - *Quiz*: preguntas con explicación para cada protocolo.
- **Progreso guardado**: una lección cuenta como completada al verla entera y acertar su quiz; el panel de protocolos muestra el avance (n/16).
- **Flujo de paquetes**: reproducir/pausa, paso a paso, retroceder, reiniciar, velocidad 0.5×–2×, barra de progreso, botón para inspeccionar cada paquete y atajos (`Espacio`, `←`/`→`, `R`).
- Enlaces directos por protocolo: `/#dns`, `/#tcp`, etc.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4 y Lucide React. Sin scripts de terceros ni analítica.

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

Pendiente menor: en tema claro, los colores amarillo y azul de las flechas del diagrama tienen poco contraste sobre blanco; la información también está en texto, pero podrían oscurecerse para ese tema.
