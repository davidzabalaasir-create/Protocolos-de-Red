// Offline support. Pages: network first, cached copy when offline.
// Hashed build files and icons: cache first (their names change when their content does).
const CACHE = 'protocolos-v1'
const SHELL = ['/', '/favicon.svg', '/site.webmanifest', '/icon-192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const put = (req, res) => {
  if (res.ok && res.type === 'basic') {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy))
  }
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return

  if (req.mode === 'navigate') {
    // Any lesson page works offline: the app reads the lesson from the URL.
    e.respondWith(
      fetch(req)
        .then((res) => put(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit || caches.match('/', { ignoreVary: true }))),
    )
    return
  }

  if (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname) || /\.(png|svg|webmanifest)$/.test(url.pathname)) {
    e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req).then((res) => put(req, res))))
  }
})
