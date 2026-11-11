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

void start.then(() =>
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

// Offline support (production only, so development always sees fresh files).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

// Visit counts without cookies or personal data (Vercel Web Analytics), on the live site only.
if (import.meta.env.PROD && location.origin === SITE) {
  void import('@vercel/analytics').then((m) => m.inject())
}
