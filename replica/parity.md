# Paridad con Protocol Explorer

Fecha: 2026-11-11 · Original: https://protocol-explorer-alpha.vercel.app/ · Clon: https://protocolos-de-red-eight.vercel.app/

## Puntuación

| | |
|---|---|
| Funciones | **94,0 / 100** (32 funciones puntuadas; antes 78,4) |
| Imprescindibles | 6 de 6 hechas |
| Diseño (capturas) | No medido: la captura automática se detuvo a mano |
| Veredicto | **Mejor que el original**: listo para publicar (imprescindibles 6/6, funciones ≥ 80, sin fallos S1/S2 abiertos), y además añade quiz, capturas .pcapng, recorrido guiado y 15 protocolos más |

## Por área (de peor a mejor)

| Área | Puntuación |
|---|---|
| Ajustes | 75,0 |
| Lecciones | 87,5 |
| Navegación | 92,9 |
| Diagrama, paquetes, inspector, panel, accesibilidad, acabado | 100 |

## Qué falta, en orden de construcción

1. [should] Idiomas: 2 de 21.
2. [should] Etapas: hay etapas numeradas, pero sin ficha de datos propia por etapa.
3. [could] Escritura de derecha a izquierda (árabe y hebreo), necesaria solo si se añaden esos idiomas.
4. [could] Lista lateral fija que se puede ocultar (ahora es un panel desplegable).

Hecho en esta tanda: etapas numeradas con resumen final, proxy inverso, explicación ampliable en la tabla, notas en el diagrama, vista y velocidad recordadas, modo foco y pantalla completa.

Fuera de la puntuación a propósito: las ilustraciones isométricas, que son la imagen propia del original.

## Lo que el clon hace y el original no

Quiz por protocolo, descarga de cada lección en `.pcapng`, recorrido guiado, 15 protocolos más (54 frente a 39), 961 pruebas unitarias y 50 casos e2e.

## Diferencias de comportamiento

| Flujo | Original | Clon | Decisión |
|---|---|---|---|
| Abrir una lección | Primer plano del cliente; los equipos aparecen al avanzar | Igual | Mantener |
| Velocidad | Menú desplegable | Tres botones (0,5×, 1×, 2×) | Mantener: un clic menos |
| Lista de protocolos | Barra lateral fija, recordada | Panel desplegable | Revisar |
| Preferencias | Recuerda tema, idioma, vista, velocidad, lista y foco | Recuerda tema, idioma, progreso, vista, velocidad y foco | Hecho |
| Comprobar lo aprendido | No existe | Quiz con explicación | Ventaja del clon |

## Pruebas

50 casos e2e (escritorio y móvil) y 961 pruebas unitarias; todo pasa. Se encontraron y corrigieron 2 fallos (S3 y S4); ver `bugs.md`.

## Cinco cosas a construir ahora

1. Un tercer idioma (portugués o francés), reutilizando la estructura de la traducción al inglés.
2. Ficha de datos por etapa (qué se consigue en cada una).
3. Lista lateral fija y plegable en pantallas anchas.
4. Pruebas en Firefox y Safari (WebKit) con el mismo conjunto de Playwright.
5. Traducir al inglés los campos poco comunes del inspector.
