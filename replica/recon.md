# Recon map: Protocol Explorer (web)

Scope: la transición del panel del diagrama (parte derecha del vídeo): cómo aparece cada equipo, cómo se mueve la cámara y cómo viaja cada paquete.
For: Protocolos de Red, el clon de David (español e inglés).
Date: 2026-11-11

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | vídeo del usuario | `C:\Users\David\Videos\Captures\Claude 2026-11-11 08-53-18.mp4` | 32,2 s, 1920×1020; lección HTTP del original en el panel del navegador. Se extrajeron 33 fotogramas (1 por segundo) |
| 2 | web pública | https://protocol-explorer-alpha.vercel.app/ | usada como usuario, sin leer su código para esta tarea |

Capturas de referencia en `replica/screens/` (fuera de git: incluyen la ventana del usuario).

## Core loop

Ver cómo una conversación de red se construye paso a paso: cada equipo aparece cuando la conversación llega a él y cada paquete viaja visible por la ruta.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Diagrama de red (vista «Red») | cualquier lección, pestaña Red | ver la conversación en el mapa | cámara, nodos, enlaces, etiqueta de paquete, barra de dirección | inicio (primer plano del cliente), escribiendo la URL, URL cargada (✓), equipos apareciendo, paquete en tránsito, en reposo entre paquetes |

## La transición, segundo a segundo (lección HTTP)

| t | qué se ve | detalle a replicar |
|---|---|---|
| 0–8 s | Primer plano del portátil; barra «www.example.com ✓»; el router asoma por la derecha | estado final de la lección anterior: URL con marca de cargada |
| 9 s | Reinicio: desaparece la barra | — |
| 10–12 s | Barra vacía → «www.examp…» → «www.example.com» | escritura letra a letra con cursor |
| 14 s | La cámara se aleja y aparece el router con su enlace | el equipo aparece **antes** de que salga el paquete |
| 16 s | Cliente, router e Internet en plano general | la cámara encuadra todo lo aparecido |
| 17 s | Aparece el resolutor DNS; la cámara se reajusta | **pausa**: primero el encuadre, luego el paquete |
| 18–20 s | «CONSULTA DNS» con ficha «A? www.example.com» avanza cliente → router → Internet → DNS | la etiqueta recorre tramo a tramo; cada tramo se ilumina al pasar, con flecha de dirección |
| 21 s | La etiqueta ha llegado y desaparece | la etiqueta no se queda en el destino |
| 22–23 s | «RESPUESTA DNS» vuelve al cliente | mismo efecto en sentido contrario |
| 27 s | Aparece el servidor web; reencuadre | igual que a los 17 s |
| 28–32 s | «SYN» (verde) va al servidor y vuelve «SYN-ACK» | color por tipo de paquete |

Ritmo: el viaje depende de la longitud de la ruta (unos 0,7–0,9 s por tramo en el vídeo); entre paquetes hay una pausa breve.

## Flows

```
F01 Ver una lección completa
    S01 inicio -> reproducir -> (por cada paquete: reencuadre si aparecen equipos -> viaje tramo a tramo -> llegada) -> fin
    happy path clicks: 1 (Reproducir)
    edge: pasos rápidos (Paso varias veces seguidas), reiniciar a mitad, pestaña en segundo plano, movimiento reducido
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Cámara (viewBox) | primer plano, plano general | quieta, moviéndose | S01 |
| Nodo | por tipo de equipo | oculto, apareciendo, visible, activo | S01 |
| Enlace | — | oculto, en reposo (discontinuo), iluminado con flecha (por tramo) | S01 |
| Etiqueta de paquete | por tipo (DNS, TCP, TLS, petición, respuesta…) | esperando, viajando, llegando (se desvanece), perdido | S01 |
| Barra de dirección | segura, normal | vacía, escribiendo, completa, cargada (✓) | S01 |

## Inferred data model

```
Lesson   id, packets[], nodes revealed in order
         evidence: S01 (los equipos aparecen en el orden en que la conversación llega a ellos)
         confidence: high
Packet   from, to, kind (color), label, field (ficha)
         evidence: etiquetas «CONSULTA DNS» / «A? www.example.com», «SYN» / «seq=0»
         confidence: high
```

Relationships: Lesson 1-n Packet; Packet n-1 Node (origen y destino); la ruta se deriva de la topología.

## Feature matrix

Ver `features.csv` (filas de «transición» añadidas). Lo que no se copia: las ilustraciones isométricas de los equipos (imagen propia del original).

## Size

S: un componente (el diagrama), sin datos ni backend. Lo difícil: sincronizar cámara → viaje → llegada sin que se solapen, mantener el ritmo de reproducción acorde a la longitud de cada ruta y que siga funcionando con la pestaña en segundo plano.
