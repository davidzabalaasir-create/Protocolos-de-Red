## Especificación de entrega: Subneteo

### Resumen

Nueva sección `/subneteo/` con una calculadora de subredes propia (sin dependencias externas) y un modo de práctica.
Es el complemento natural de las lecciones de IPv4, ARP, DHCP y NAT: allí el alumno ve **cómo viaja** un paquete; aquí aprende **cómo se reparte** el espacio de direcciones.
Público: estudiantes de redes (ASIR/SMR, CCNA) que necesitan calcular rápido y entender el porqué de cada bit.

Tres pestañas:

| Pestaña | Para qué | Entrada | Salida |
|---|---|---|---|
| **Calculadora** | Ver una subred al detalle | IP + prefijo (`192.168.10.77/26`) o IP + máscara | Red, broadcast, primer/último host, nº de hosts, máscara, wildcard, clase, privada/pública, vista binaria |
| **Dividir (VLSM)** | Repartir una red entre departamentos | Red base + lista de “nombre · hosts necesarios” | Tabla de subredes ordenadas de mayor a menor, espacio sobrante, aviso si no cabe |
| **Practicar** | Entrenar para el examen | — (ejercicios generados) | Pregunta, respuesta del alumno, corrección paso a paso, racha |

Reglas de producto:
- Funciona sin conexión (entra en el precache del service worker como cualquier chunk).
- Se carga bajo demanda (`lazy`), igual que Comparar o Examen: no suma a la primera carga.
- Español e inglés, con las cadenas en `ui-en.ts`.
- El estado va en la URL para poder compartirlo: `/subneteo/#192.168.10.77/26`, `/subneteo/#vlsm=10.0.0.0/24;Ventas:50;IT:20;Wifi:100`.

### Layout

Reutiliza la retícula principal de `App.tsx`: contenido + panel lateral.

```
┌ Header (igual que el resto) ─────────────────────────────────────┐
├ [Calculadora] [Dividir (VLSM)] [Practicar]   ← tablist           ┤
├──────────────────────────────────────────┬──────────────────────┤
│ Entrada  [192.168.10.77/26        ] [⟳]  │ Panel “Cómo se       │
│ Slider de prefijo /0 ─────●──── /32      │ calcula”: pasos      │
│                                          │ numerados con la     │
│ Tarjetas de resultado (grid 2×4)         │ operación AND, la    │
│ Red · Broadcast · 1er host · Último host │ máscara y el salto   │
│ Hosts · Máscara · Wildcard · Tipo        │ de bloque            │
│                                          │                      │
│ Vista binaria (32 bits, red | host)      │                      │
│ Mapa de bloques del octeto interesante   │                      │
└──────────────────────────────────────────┴──────────────────────┘
```

- Contenedor: `grid items-start gap-3 lg:grid-cols-[1fr_minmax(20rem,26rem)]`, el mismo que la lección.
- Tarjetas: `rounded-lg border border-line bg-panel p-4`.
- La sección aparece en el header como enlace “Subneteo” junto al buscador y en el panel de protocolos bajo “Modo examen” (botón secundario con icono `Network` de lucide).

### Tokens de diseño

Solo tokens existentes (`src/index.css`); no se añaden colores nuevos salvo los dos de bits, derivados de los de protocolo.

| Token | Valor claro / oscuro | Uso |
|---|---|---|
| `bg-panel` / `bg-panel-2` | `--panel` / `--panel-2` | Tarjetas / filas alternas de la tabla VLSM |
| `border-line` / `border-line-strong` | `--line` / `--line-strong` | Bordes de tarjeta / borde del campo |
| `text-fg` / `text-muted` | `--fg` / `--muted` | Valores / etiquetas |
| `bg-accent` / `text-accent-fg` | `--accent` | Pestaña activa, botón principal |
| `--k-dns` | `#1d4ed8` / `#3b82f6` | **Bits de red** (nuevo alias `--bit-net`) |
| `--k-tcp` | `#15803d` / `#22c55e` | **Bits de host** (nuevo alias `--bit-host`) |
| `--k-err` | `#b91c1c` / `#ef4444` | Errores de entrada, “no cabe” en VLSM |
| `--k-req` | `#a16207` / `#eab308` | Espacio sobrante en el mapa de bloques |
| `font-mono` | JetBrains Mono… | Toda IP, máscara y bit |
| Etiquetas | `text-[11px] font-bold tracking-wider uppercase` | Igual que los `dt` de Resumen |
| Valor principal | `text-2xl font-bold font-mono` | Valor de cada tarjeta |

El color nunca es la única pista: los bits de red llevan además subrayado y el separador `|` entre red y host.

### Componentes

| Componente | Variante | Props | Notas |
|---|---|---|---|
| `SubnetPage` | — | `initial: SubnetRoute` | Página; lee y escribe el hash. `lazy` desde `App.tsx`. |
| `CidrInput` | — | `value, onChange, error?` | `<input inputMode="decimal">`; acepta `a.b.c.d/n`, `a.b.c.d n` y `a.b.c.d 255.255.255.192`. Normaliza al salir del campo. |
| `PrefixSlider` | — | `value 0–32, onChange` | `<input type="range">` con marcas en /8, /16, /24 y /30. Sincronizado con `CidrInput`. |
| `ResultCard` | `default` / `highlight` | `label, value, copy?` | `highlight` en Red y Broadcast. Botón copiar (`Button size="iconSm" variant="ghost"`). |
| `BitRuler` | — | `ip, prefix` | 4 octetos × 8 bits; cada bit es un `span` de `size-6`; los de red con `--bit-net`. |
| `BlockMap` | — | `prefix, ip` | Barra del octeto “interesante” dividida en bloques del tamaño del salto; marca el bloque de la IP. |
| `HowPanel` | — | `ip, prefix` | Lista ordenada: 1) máscara en binario, 2) AND, 3) salto = 256 − octeto de la máscara, 4) broadcast = siguiente red − 1. |
| `VlsmForm` | — | `base, rows[]` | Filas “nombre · hosts” añadibles/eliminables (máx. 32). `Button variant="primary"` “Calcular”. |
| `VlsmTable` | — | `result` | `<table>` con caption; columnas: Nombre, Hosts pedidos, Prefijo, Red, Rango, Broadcast, Desperdicio. |
| `Practice` | — | — | Generador con semilla; tipos: red de una IP, broadcast, nº de hosts, prefijo necesario, ¿misma subred? |
| Lógica | `src/lib/subnet.ts` | — | Funciones puras con enteros de 32 bits sin signo (`>>> 0`); 100 % cubierta por Vitest. |

### Estados e interacciones

| Elemento | Estado | Comportamiento |
|---|---|---|
| `CidrInput` | Vacío | Placeholder `192.168.1.0/24`; tarjetas muestran “—”. |
| `CidrInput` | Escribiendo | Recalcula a cada pulsación si la entrada es válida; si no, mantiene el último resultado válido atenuado (`opacity-60`). |
| `CidrInput` | Error | `border-[var(--k-err)]`, mensaje bajo el campo (`aria-describedby`), p. ej. “El octeto 3 vale 300; el máximo es 255”. Nunca bloquea la escritura. |
| `CidrInput` | Foco | Anillo de foco global del sitio. |
| IP que no es la de red | Aviso | Texto informativo: “192.168.10.77 es un host; la red es 192.168.10.64/26”, con botón “Usar la red”. |
| `PrefixSlider` | Arrastre / flechas | Actualiza prefijo, URL (`replaceState`) y resultados en vivo. |
| `ResultCard` copiar | Pulsado | Copia al portapapeles; el icono cambia a ✓ 1,5 s y se anuncia “Copiado”. |
| `BitRuler` bit | Hover / foco | Tooltip con el valor posicional (128, 64…). |
| `VlsmForm` | Fila nueva | Foco al campo “nombre” de la nueva fila. |
| `VlsmTable` | No cabe | Fila resumen en `--k-err`: “Faltan 64 direcciones: usa un /23 o reduce Wifi”. |
| `Practice` | Respondida | Correcta: mensaje verde y siguiente. Incorrecta: muestra la solución con `HowPanel`. |
| Pestañas | Activa | Mismo estilo que las pestañas del panel lateral (`aria-selected:bg-accent`). |

### Comportamiento responsive

| Ancho | Cambios |
|---|---|
| Escritorio (≥1024 px) | Dos columnas: calculadora + `HowPanel`. Tarjetas en 4 columnas. |
| Tablet (768–1023 px) | Una columna; `HowPanel` debajo y plegable (`<details>` abierto). Tarjetas en 2 columnas. |
| Móvil (<768 px) | Tarjetas en 2 columnas; `BitRuler` en 2 filas (16 + 16 bits) para no desbordar a 375 px; `VlsmTable` pasa a tarjetas apiladas (una por subred). Sin scroll horizontal (prueba como F09-H1). |

### Casos límite

- **/31 y /32**: /31 tiene 2 hosts utilizables (RFC 3021, enlaces punto a punto); /32 es un solo host. Mostrarlo con nota, no con 0 ni −1.
- **/0**: 4 294 967 296 direcciones; formatear con separador de miles según idioma.
- **Máscaras no contiguas** (`255.0.255.0`): error explicado, no se calculan.
- **Direcciones especiales**: detectar y etiquetar privada (RFC 1918), CGNAT (100.64/10), loopback, link-local (169.254/16), multicast y reservada.
- **Ceros a la izquierda** (`192.168.010.1`): aceptar y normalizar a decimal (no octal), avisando.
- **Espacios y pegado**: recortar; aceptar texto pegado tipo `IP: 10.0.0.5/8`.
- **VLSM**: hosts = 0 o > 2³⁰ rechazados; nombres de hasta 24 caracteres (truncar con `truncate` y `title`); empate de tamaños, mantener el orden de entrada.
- **URL con datos inválidos**: cargar vacío y mostrar el error, sin romper la página.
- **Sin conexión**: todo funciona (cálculo local).
- **Textos largos en inglés**: etiquetas de tarjeta máx. ~22 caracteres en ambos idiomas.

### Animación / movimiento

Siguiendo la decisión anterior del propietario (prefiere pocas transiciones), solo lo imprescindible:

| Elemento | Disparo | Animación | Duración | Curva |
|---|---|---|---|---|
| Bits de `BitRuler` | Cambio de prefijo | Cambio de color del bit | 150 ms | `ease-out` |
| Bloque activo de `BlockMap` | Cambio de IP | Desplazamiento del marcador | 200 ms | `ease-out` |
| Resto | — | Ninguna | — | — |

Con `prefers-reduced-motion: reduce`, duración 0.

### Accesibilidad (WCAG 2.1 AA)

- **Orden de foco**: pestañas → campo → slider → botones de copiar (en orden de tarjeta) → `HowPanel`.
- **Pestañas**: `role="tablist"`/`tab`/`tabpanel`, flechas ←/→ como en el panel lateral.
- **Resultados**: contenedor con `aria-live="polite"` que anuncia un resumen corto (“Red 192.168.10.64, 62 hosts”), con un retardo de 500 ms para no anunciar cada tecla.
- **`BitRuler`**: `role="img"` con `aria-label` “26 bits de red y 6 de host”; los bits individuales `aria-hidden`.
- **`PrefixSlider`**: `aria-valuetext="/26, máscara 255.255.255.192"`.
- **`VlsmTable`**: `<caption>`, `<th scope="col">`; botones “Eliminar fila Ventas” con nombre accesible completo.
- **Errores**: `aria-invalid` + `aria-describedby`; el mensaje dice qué falla y cómo arreglarlo.
- **Contraste**: los tokens `--k-*` ya cumplen AA sobre `--panel` en ambos temas; añadir la página a la prueba axe F08.
- **Objetivos táctiles**: mínimo 44 px (`min-h-11`), como el resto del sitio.

### Pruebas a añadir

- `src/lib/subnet.test.ts`: tabla de casos conocidos (/0…/32, /31, /32, especiales, VLSM que cabe y que no).
- `e2e`: F17-H1 calcular `192.168.10.77/26`; F17-H2 VLSM con 3 departamentos; F17-E1 entrada inválida; F17-E2 enlace directo con hash; axe en las tres pestañas; sin desbordamiento a 375 px.
