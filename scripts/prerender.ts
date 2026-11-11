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
        mkdirSync(join(outDir, p.id), { recursive: true })
        writeFileSync(join(outDir, p.id, 'index.html'), html)
      }
      const today = new Date().toISOString().slice(0, 10)
      const urls = ['', ...PROTOCOLS.map((p) => `${p.id}/`)]
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`,
      )
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)

      // Offline: the service worker precaches every build file, lazy chunks included,
      // and its cache name changes with each build so old files are dropped.
      const assets = readdirSync(join(outDir, 'assets')).map((f) => `/assets/${f}`)
      const version = createHash('sha256').update(assets.join()).digest('hex').slice(0, 10)
      const sw = readFileSync(join(outDir, 'sw.js'), 'utf8')
        .replace("const CACHE = 'protocolos-v1'", `const CACHE = 'protocolos-${version}'`)
        .replace(/const SHELL = \[([^\]]*)\]/, (_, list) => `const SHELL = [${list}, ${assets.map((a) => `'${a}'`).join(', ')}]`)
      writeFileSync(join(outDir, 'sw.js'), sw)
    },
  }
}
