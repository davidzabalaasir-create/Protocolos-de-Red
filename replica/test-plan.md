# Plan de pruebas · Protocolos de Red

No existe `replica/recon.md`, así que los flujos salen de la propia app. Las pruebas se ejecutan contra el clon en local (`npm run e2e`), nunca contra el original. Cada caso se ejecuta en escritorio (1440×900) y en móvil (Pixel 7). En todos los specs una prueba falla si hay un error en la consola, una excepción en la página o una respuesta 5xx.

No aplican: contraseñas, pagos, sesiones, datos de otros usuarios ni zonas horarias, porque la app no tiene cuentas ni servidor.

## F01 · Elegir una lección
- **F01-H1** Abrir la lista de protocolos y elegir DNS: el título y la vista general muestran DNS y el enlace pasa a `#dns`.
- **F01-H2** Buscar «quic» con Ctrl K y pulsar Enter: se abre HTTP/3.
- **F01-H3** Pulsar la capa OSI 2: la lista se filtra por «Enlace de datos».
- **F01-E1** Abrir un enlace a un protocolo que no existe (`#noexiste`): se abre la lección por defecto, sin errores.
- **F01-E2** Buscar con acentos y mayúsculas («CONEXIÓN»): no falla; sin resultados se muestra «Sin resultados».
- **F01-E3** Cambiar el hash a mano (`#tcp`) sin recargar: la lección cambia.

## F02 · Reproducir una lección
- **F02-H1** Pulsar Paso tres veces: la fila 3 queda marcada, el progreso dice «3/8» y aparece la explicación del paquete.
- **F02-H2** Pulsar Reproducir a 2×: llega al último paquete y aparece «Lección completada».
- **F02-H3** Pulsar una etapa de la franja: salta a su primer paquete.
- **F02-E1** Pulsar Paso muchas veces seguidas (más que paquetes): no pasa del último ni falla.
- **F02-E2** Recargar a mitad de reproducción: vuelve al inicio sin errores.
- **F02-E3** Solo teclado: Espacio reproduce y pausa; las flechas avanzan y retroceden.

## F03 · Inspeccionar bytes
- **F03-H1** Pulsar el botón de bytes de una fila: se abre el inspector con las capas Ethernet, IPv4 y UDP, y el volcado hexadecimal.
- **F03-H2** Abrir y cerrar una capa: el botón cambia `aria-expanded`.

## F04 · Quiz y progreso
- **F04-H1** Ver DNS hasta el final y acertar el quiz: la lista dice «1/54 completados» y lo mantiene tras recargar.
- **F04-E1** Hacer doble clic en una respuesta: cuenta una sola vez.

## F05 · Ajustes que se recuerdan
- **F05-H1** Cambiar a inglés: la interfaz pasa a «Packet flow»; tras recargar sigue en inglés.
- **F05-H2** Cambiar el tema a claro: se mantiene tras recargar.
- **F05-H3** Elegir la vista Secuencia y la velocidad 2×: se mantienen tras recargar.
- **F05-H4** Modo foco con el botón y con la tecla F: el panel lateral se oculta y vuelve.

## F06 · Recorrido guiado
- **F06-H1** Empezar el recorrido desde la lista: se abre Ethernet y la barra dice «1/15»; «Siguiente» lleva a ARP.

## F07 · Descargar la captura
- **F07-H1** Pulsar descargar: se descarga `protocolos-de-red-http.pcapng`, que empieza por la cabecera pcapng (0x0A0D0D0A).

## F08 · Accesibilidad
- **F08-H1** Análisis axe (WCAG 2.1 AA) de la pantalla principal, del panel de protocolos abierto, del inspector y del quiz: cero violaciones.
- **F08-E1** El enlace «Saltar al contenido» es lo primero al pulsar Tab.

## F09 · Móvil
- **F09-H1** A 390 px de ancho la página no se desborda en horizontal y los controles de reproducción se ven.
