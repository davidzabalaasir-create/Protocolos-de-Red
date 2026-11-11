# Fallos · Protocolos de Red

Encontrados con `npm run e2e` (Playwright, Chromium, 1440×900 y Pixel 7). Solo se registra lo que se ha reproducido.

### BUG-001: La página se desborda en horizontal en móvil

- Severity: S3
- Flow / case: F09 / F09-H1 (y, como efecto, F02-H1, F02-H2, F03-H1, F04-H1… en móvil)
- Screen: principal
- Build: antes del commit de esta tanda · Chromium, 390×844 y Pixel 7

Steps
1. Abrir `/#http` con un ancho de 390 px.
2. Medir `document.documentElement.scrollWidth`.

Expected: el ancho de la página es igual al de la pantalla (390 px).
Actual: 715 px, 325 px de más. En móvil la página se ve encogida y el panel lateral tapa los botones de reproducción («subtree intercepts pointer events»), así que no se puede pulsar «Paso».
Evidence: prueba F09-H1 (recibido 325, esperado ≤ 0); fallos de clic en F02-H1 móvil.
Suspected cause: los textos ocultos para lectores de pantalla de la tabla («Inspeccionar paquete N») van en posición absoluta, y su contenedor con scroll no tenía posición propia. Por eso no los recortaba y estiraban el documento.
Status: corregido en esta tanda (contenedor `relative`); F09-H1 y todo móvil pasan.

### BUG-002: El enlace del logo tiene un nombre accesible distinto del texto visible

- Severity: S4
- Flow / case: F08 / F08-H1
- Screen: cabecera
- Build: antes del commit de esta tanda · Chromium 1440×900

Steps
1. Abrir `/#http`.
2. Pasar axe (WCAG 2.1 AA).

Expected: cero violaciones.
Actual: `label-content-name-mismatch` en `a[href="/"]`: el nombre era «Protocolos de Red, inicio» y el texto visible incluye «Aprende cómo funciona Internet» (WCAG 2.5.3).
Evidence: prueba F08-H1.
Status: corregido en esta tanda: se quita el `aria-label` y el enlace se nombra por su texto visible.

## Resultado

| | |
|---|---|
| Casos ejecutados | 50 (25 casos × escritorio y móvil) |
| Pasan | 50 |
| Fallos por gravedad | S1: 0 · S2: 0 · S3: 1 · S4: 1 |
| Corregidos | 2 de 2 |

Además: 961 pruebas unitarias (decodificación, checksums, rutas, pcapng, traducciones).

## Por comprobar (no reproducido)

- Pantalla completa: solo se comprobó que el botón existe; Playwright sin interfaz no entra realmente en pantalla completa.
- Animaciones (cámara, pulsos, flujo de líneas): las pruebas comprueban el estado final, no el movimiento.
- Safari y Firefox: solo se ha probado en Chromium.
