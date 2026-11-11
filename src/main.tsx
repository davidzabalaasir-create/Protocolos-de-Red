import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preferredLang, setLang } from './i18n'
import { SITE } from './lib/site'

const SubnetApp = lazy(() => import('./components/subnet/SubnetApp'))
const isSubnet = /^\/subneteo\/?$/.test(location.pathname)

// English visitors wait for their lesson text so they never see a flash of Spanish.
const start = preferredLang() === 'en' ? setLang('en') : Promise.resolve()

// /privacidad/ is a plain pre-rendered page: keep it as is
const isStatic = /^\/privacidad\/?$/.test(location.pathname)

void start.then(() =>
  !isStatic &&
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {isSubnet ? (
        <Suspense fallback={null}>
          <SubnetApp />
        </Suspense>
      ) : (
        <App />
      )}
    </StrictMode>,
  ),
)

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
