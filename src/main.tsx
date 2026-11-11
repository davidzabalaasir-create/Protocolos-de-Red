import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preferredLang, setLang } from './i18n'
import { isSubnetPath, loadedSubnet, loadSubnet, NAV_EVENT, prefetchSubnet } from './lib/nav'
import { SITE } from './lib/site'

/** Lessons or subnetting tools, switched in place when the address changes (no page reload). */
function Root() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const on = () => {
      const next = location.pathname
      // keep showing the current view until the subnetting code is ready: never a blank frame
      if (isSubnetPath(next) && !loadedSubnet())
        void loadSubnet().then(
          () => setPath(location.pathname),
          () => location.reload(), // offline and not cached: let the browser show what it can
        )
      else setPath(next)
    }
    window.addEventListener(NAV_EVENT, on)
    window.addEventListener('popstate', on)
    return () => {
      window.removeEventListener(NAV_EVENT, on)
      window.removeEventListener('popstate', on)
    }
  }, [])
  const Subnet = loadedSubnet()?.default
  return isSubnetPath(path) && Subnet ? <Subnet /> : <App key="lessons" />
}

// English visitors wait for their lesson text so they never see a flash of Spanish,
// and /subneteo/ waits for its own code (preloaded by the page) instead of flashing an empty page.
const start = Promise.all([preferredLang() === 'en' ? setLang('en') : null, isSubnetPath(location.pathname) ? loadSubnet() : null])

// /privacidad/ is a plain pre-rendered page: keep it as is
const isStatic = /^\/privacidad\/?$/.test(location.pathname)

void start.then(() => {
  if (isStatic) return
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
  // fetch the subnetting view in the background so opening it later is instant
  const warm = prefetchSubnet
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 })
  else setTimeout(warm, 2000)
})

// Optional accounts (Clerk): only when a key is configured, loaded once the page is idle so it
// never slows the first paint. Vercel's Clerk integration provides NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
if (clerkKey && !isStatic && new URLSearchParams(location.search).get('embed') !== '1') {
  const load = () => void import('./components/account/Account').then((m) => m.mountAccount(clerkKey))
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 3000 })
  else setTimeout(load, 1500)
}

// Offline support (production only, so development always sees fresh files).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

// Visit counts without cookies or personal data (Vercel Web Analytics), on the live site only.
if (import.meta.env.PROD && location.origin === SITE) {
  void import('@vercel/analytics').then((m) => m.inject())
}
