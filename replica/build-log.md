# Registro de construcción

| ID | Fecha | Estado | Qué falta | Más difícil de lo esperado |
|---|---|---|---|---|
| Etapas por lección | 2026-11-11 | hecho | Títulos escritos a mano (se calculan) | Se calculan a partir de los paquetes (DNS, conexión TCP, saludo seguro, intercambio, cierre) para no escribir etapas de 54 lecciones a mano. En lecciones de un solo protocolo se agrupan por «quién habla con quién». |
| Resumen final | 2026-11-11 | hecho | — | — |
| Proxy inverso | 2026-11-11 | hecho | — | Hizo falta otro tipo de nodo en la decodificación para que el proxy actúe de servidor ante el navegador y de cliente ante el servidor interno. |
| Explicación ampliable | 2026-11-11 | hecho | — | — |
| Notas en el diagrama | 2026-11-11 | hecho | — | — |
| Vista y velocidad recordadas | 2026-11-11 | hecho | — | — |
| Modo foco y pantalla completa | 2026-11-11 | hecho | La pantalla completa no está probada de forma automática | — |
| Pruebas e2e | 2026-11-11 | hecho | Safari y Firefox | El navegador de pruebas arranca en inglés y la web cambia sola de idioma: se fija `locale: es-ES`. |
| Ficha por etapa | 2026-11-11 | hecho | — | Objetivo, paquetes, duración, protocolos y equipos, calculados de la etapa. |
| Lista lateral fija | 2026-11-11 | hecho | — | La lista se extrajo a un componente común para usarla en la barra y en el panel desplegable; las pruebas e2e tuvieron que distinguir escritorio y móvil. |
| 8 protocolos (mDNS, SSDP, LLDP, VRRP, RIP, GRE, Syslog, Wake-on-LAN) | 2026-11-11 | hecho | — | mDNS necesitó ampliar el constructor DNS (nombres .local, registros PTR, ID 0); la difusión 255.255.255.255 ahora siempre va a la MAC ff:ff:ff:ff:ff:ff. |
| Inspector en inglés | 2026-11-11 | hecho | — | 1219 textos del decodificador (nombres de capa, campos y valores); el texto entre comillas es contenido real del protocolo y se deja igual. Una prueba unitaria falla si queda español. |
| Carga ligera | 2026-11-11 | hecho | — | Inspector, decodificador, .pcapng, comparar, examen, incrustar y lecciones en inglés se cargan bajo demanda: 197 KB → 141 KB comprimidos en la primera carga. |
| Sin conexión | 2026-11-11 | hecho | — | Service worker generado en el build con todos los archivos; la caché debe ignorar `Vary` o los módulos no coinciden sin red. |
| Estadísticas | 2026-11-11 | hecho | activar Web Analytics en el panel de Vercel | @vercel/analytics, sin cookies, solo en la web publicada. |
| Firefox y Safari | 2026-11-11 | hecho | Firefox solo en GitHub Actions | El Firefox de Playwright no arranca en este Windows (error de configuración en paralelo). En Safari, Tab no enfoca enlaces por defecto: la prueba comprueba el orden. |

Decisión del propietario (2026-11-11): solo español e inglés; no se añadirán más idiomas ni escritura de derecha a izquierda.

Pendiente: nada de la matriz de funciones.
