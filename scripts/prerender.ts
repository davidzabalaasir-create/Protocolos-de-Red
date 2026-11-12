import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { OSI_LAYERS, PROTOCOLS } from '../src/data/protocols'
import { SITE } from '../src/lib/site'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * After the build, writes one static page per lesson (/dns/index.html…) with its own title,
 * description, canonical URL and the lesson as plain HTML, so search engines can index each
 * protocol. The React app replaces that HTML as soon as it starts. Also writes sitemap.xml and
 * robots.txt.
 */
export function prerenderLessons(): Plugin {
  let outDir = 'dist'
  return {
    name: 'prerender-lessons',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir
    },
    closeBundle() {
      const shell = readFileSync(join(outDir, 'index.html'), 'utf8')
      const writePage = (dir: string, url: string, title: string, desc: string, body: string) => {
        const html = shell
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
          .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
          .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
        mkdirSync(join(outDir, dir), { recursive: true })
        writeFileSync(join(outDir, dir, 'index.html'), html)
      }

      for (const p of PROTOCOLS) {
        const url = `${SITE}/${p.id}/`
        const title = `${p.name}: cómo funciona paso a paso · Protocolos de Red`
        const desc = p.description.length > 155 ? p.description.slice(0, 152).trimEnd() + '…' : p.description
        const body = `<main>
<h1>${esc(p.name)}: ${esc(p.full)}</h1>
<p>${esc(p.description)}</p>
<dl>${p.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
<h2>Los paquetes, uno a uno</h2>
<ol>${p.packets.map((k) => `<li><strong>${esc(k.proto)}</strong> · ${esc(k.info)}: ${esc(k.note)}</li>`).join('')}</ol>
<p>Capa ${p.layer} (${esc(OSI_LAYERS[p.layer])}). Lección interactiva de <a href="/">Protocolos de Red</a>.</p>
</main>`
        writePage(p.id, url, title, desc, body)
      }
      const today = new Date().toISOString().slice(0, 10)
      writePage(
        'subneteo',
        `${SITE}/subneteo/`,
        'Calculadora de subredes y VLSM paso a paso · Protocolos de Red',
        'Calcula red, broadcast, rango de hosts, máscara y wildcard de cualquier IPv4, reparte una red con VLSM y practica subneteo con corrección paso a paso.',
        `<main>
<h1>Subneteo: calculadora de subredes IPv4</h1>
<p>Escribe una IP con su prefijo (por ejemplo 192.168.10.77/26) y obtén la dirección de red, el broadcast, el primer y el último host, el número de hosts útiles, la máscara y la wildcard, con la explicación bit a bit.</p>
<h2>Dividir una red (VLSM)</h2>
<p>Indica cuántos hosts necesita cada departamento y la calculadora asigna las subredes de mayor a menor, sin solaparse.</p>
<h2>Practicar</h2>
<p>Ejercicios al azar de red, broadcast, hosts, prefijo necesario y misma subred, con la solución explicada.</p>
<p>Parte de <a href="/">Protocolos de Red</a>.</p>
</main>`,
      )


      writePage(
        'referencia',
        `${SITE}/referencia/`,
        'Chuleta CCNA y flashcards con repaso espaciado · Protocolos de Red',
        'Puertos conocidos, distancias administrativas, rangos IPv4 e IPv6, cabeceras, EtherTypes, temporizadores, multicast, tipos ICMP, máscaras, modelo OSI y Wi-Fi, con flashcards para memorizarlos.',
        `<main>
<h1>Referencia: la chuleta del CCNA</h1>
<p>Las tablas que hay que saberse de memoria: puertos conocidos, distancias administrativas, rangos IPv4 especiales, direcciones IPv6, cabeceras y tamaños, EtherTypes y números de protocolo, temporizadores por defecto, direcciones multicast, tipos ICMP, máscaras y hosts, el modelo OSI y los estándares Wi-Fi.</p>
<h2>Flashcards con repaso espaciado</h2>
<p>Cada tabla genera tarjetas de memoria. Si aciertas, la tarjeta tarda más en volver (1, 3, 7, 15 y 30 días); si fallas, vuelve a empezar.</p>
<p>Parte de <a href="/">Protocolos de Red</a>.</p>
</main>`,
      )

      // privacy notice: plain static page, the app doesn't mount there (see main.tsx)
      writePage(
        'privacidad',
        `${SITE}/privacidad/`,
        'Privacidad · Protocolos de Red',
        'Qué datos guarda Protocolos de Red: progreso en tu navegador, cuenta opcional con Clerk y estadísticas de visitas sin cookies.',
        `<main style="max-width:44rem;margin:0 auto;padding:2rem 1rem;line-height:1.6">
<p><a href="/">← Protocolos de Red</a></p>
<h1>Privacidad</h1>
<h2>Sin cuenta</h2>
<p>Tu progreso (lecciones vistas y notas del quiz), el idioma y el tema se guardan solo en tu navegador (localStorage). No salen de tu dispositivo y puedes borrarlos borrando los datos del sitio.</p>
<h2>Con cuenta (opcional)</h2>
<p>Si inicias sesión, el servicio <a href="https://clerk.com/legal/privacy" rel="noopener">Clerk</a> guarda tu email (y tu nombre y foto si entras con Google o GitHub) y una copia de tu progreso para sincronizarlo entre dispositivos. No se usa para nada más ni se comparte con terceros. Puedes eliminar la cuenta y todos sus datos desde el menú de tu avatar → <em>Gestionar cuenta</em> → <em>Eliminar cuenta</em>.</p>
<h2>Estadísticas</h2>
<p>Contamos visitas con Vercel Web Analytics, que no usa cookies ni guarda datos personales.</p>
<h2>Contacto</h2>
<p>Responsable: David, <a href="https://github.com/davidzabalaasir-create" rel="noopener">github.com/davidzabalaasir-create</a>.</p>
</main>`,
      )

      const urls = ['', 'subneteo/', 'referencia/', 'privacidad/', ...PROTOCOLS.map((p) => `${p.id}/`)]
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`,
      )
      // each section page downloads its own code in parallel with the main bundle (no wait, no blank page)
      for (const [dir, prefix] of [
        ['subneteo', 'SubnetApp-'],
        ['referencia', 'RefApp-'],
      ] as const) {
        const chunk = readdirSync(join(outDir, 'assets')).find((f) => f.startsWith(prefix) && f.endsWith('.js'))
        if (chunk) {
          const file = join(outDir, dir, 'index.html')
          writeFileSync(file, readFileSync(file, 'utf8').replace('</head>', `  <link rel="modulepreload" crossorigin href="/assets/${chunk}">
  </head>`))
        }
      }

      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)

      // Offline: the service worker precaches every build file, lazy chunks included,
      // and its cache name changes with each build so old files are dropped.
      // (the account chunk is left out: signing in needs the network anyway)
      const assets = readdirSync(join(outDir, 'assets'))
        .filter((f) => !f.startsWith('Account-'))
        .map((f) => `/assets/${f}`)
      const version = createHash('sha256').update(assets.join()).digest('hex').slice(0, 10)
      const sw = readFileSync(join(outDir, 'sw.js'), 'utf8')
        .replace("const CACHE = 'protocolos-v1'", `const CACHE = 'protocolos-${version}'`)
        .replace(/const SHELL = \[([^\]]*)\]/, (_, list) => `const SHELL = [${list}, ${assets.map((a) => `'${a}'`).join(', ')}]`)
      writeFileSync(join(outDir, 'sw.js'), sw)
    },
  }
}
