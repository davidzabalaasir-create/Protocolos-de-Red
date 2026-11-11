# Paridad con Protocol Explorer

Fecha: 2026-11-11 · Original: https://protocol-explorer-alpha.vercel.app/ · Clon: https://protocolos-de-red-eight.vercel.app/

## Puntuación

| | |
|---|---|
| Funciones | **100 / 100** (30 funciones puntuadas; empezó en 78,4) |
| Imprescindibles | 6 de 6 hechas |
| Diseño (capturas) | No medido: la captura automática se detuvo a mano |
| Veredicto | **Mejor que el original**: todas las funciones puntuadas están hechas, no hay fallos abiertos y añade quiz, capturas `.pcapng`, recorrido guiado y 23 protocolos más |

## Fuera de la puntuación a propósito

- Las ilustraciones isométricas, que son la imagen propia del original.
- Más idiomas y escritura de derecha a izquierda: decisión del propietario, la web es solo en español e inglés (ambos completos).

## Lo que el clon hace y el original no

Quiz por protocolo, descarga de cada lección en `.pcapng`, recorrido guiado, 62 lecciones frente a 39 (23 protocolos que el original no tiene), 1 045 pruebas unitarias y 68 casos e2e.

## Diferencias de comportamiento

| Flujo | Original | Clon | Decisión |
|---|---|---|---|
| Abrir una lección | Primer plano del cliente; los equipos aparecen al avanzar | Igual | Mantener |
| Etapas | Etapas escritas a mano con su ficha | Etapas calculadas de los paquetes, con ficha (objetivo, paquetes, duración, protocolos, equipos) | Mantener |
| Velocidad | Menú desplegable | Tres botones (0,5×, 1×, 2×) | Mantener: un clic menos |
| Lista de protocolos | Barra lateral fija, recordada | Barra fija desde 1280 px, plegable y recordada; panel desplegable en pantallas estrechas | Hecho |
| Preferencias | Recuerda tema, idioma, vista, velocidad, lista y foco | Lo mismo, más el progreso del quiz | Hecho |
| Comprobar lo aprendido | No existe | Quiz con explicación | Ventaja del clon |

## Pruebas

68 casos e2e (escritorio y móvil; 1 omitido a propósito en móvil) y 1 045 pruebas unitarias; todo pasa. Se encontraron y corrigieron 2 fallos (S3 y S4); ver `bugs.md`.

## Siguientes pasos posibles

1. Pruebas en Firefox y Safari (WebKit) con el mismo conjunto de Playwright.
2. Traducir al inglés los campos poco comunes del inspector.
3. Medir el diff visual con capturas, si se quiere comparar la disposición.
