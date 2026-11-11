import { ClerkProvider, Show, SignInButton, UserButton, useUser } from '@clerk/react'
import { esES } from '@clerk/localizations'
import { Cloud, CloudOff, LogIn } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { useLang, useT } from '../../i18n'
import { getProgress, mergeProgress, parseProgress, replaceProgress, sameProgress, subscribeProgress, type Progress } from '../../lib/progress'
import { Button } from '../ui/Button'

// Optional accounts: signing in keeps the lesson progress in the user's Clerk profile
// (unsafeMetadata.progress, under 2 KB), so it follows them to any device. No database, no server.
// This whole module (and Clerk) is loaded after the page is idle, only when a Clerk key is configured.

type Status = 'idle' | 'syncing' | 'saved' | 'error'
const StatusCtx = createContext<Status>('idle')

function CloudSync({ onStatus }: { onStatus: (s: Status) => void }) {
  const { isSignedIn, user } = useUser()
  const lastSaved = useRef<Progress | null>(null)

  useEffect(() => {
    if (!isSignedIn || !user) {
      lastSaved.current = null
      onStatus('idle')
      return
    }
    let cancelled = false
    let timer = 0
    const push = async (p: Progress) => {
      onStatus('syncing')
      try {
        await user.updateMetadata({ unsafeMetadata: { progress: p } })
        if (!cancelled) {
          lastSaved.current = p
          onStatus('saved')
        }
      } catch {
        if (!cancelled) onStatus('error')
      }
    }
    // first sync for this account: nothing is lost on either side
    const cloud = parseProgress(user.unsafeMetadata?.progress)
    const merged = cloud ? mergeProgress(getProgress(), cloud) : getProgress()
    if (!sameProgress(merged, getProgress())) replaceProgress(merged)
    if (cloud && sameProgress(merged, cloud)) {
      lastSaved.current = cloud
      onStatus('saved')
    } else void push(merged)

    // afterwards, save changes a moment after they happen
    const off = subscribeProgress(() => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        const now = getProgress()
        if (!lastSaved.current || !sameProgress(now, lastSaved.current)) void push(now)
      }, 1500)
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      off()
    }
  }, [isSignedIn, user, onStatus])
  return null
}

function AccountButton() {
  const t = useT()
  const status = useContext(StatusCtx)
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button size="sm">
            <LogIn aria-hidden className="size-4" />
            {t('Iniciar sesión')}
          </Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <span role="status" className="hidden items-center gap-1 text-[11px] text-muted sm:inline-flex">
          {status === 'error' ? <CloudOff aria-hidden className="size-3.5 text-[var(--k-err)]" /> : <Cloud aria-hidden className="size-3.5" />}
          {status === 'syncing' ? t('Guardando…') : status === 'error' ? t('Sin conexión: se guardará luego') : status === 'saved' ? t('Progreso guardado') : ''}
        </span>
        <UserButton />
      </Show>
    </div>
  )
}

/** Clerk's sign-in window in the site's own colours, following the light/dark theme. */
function readTheme() {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    colorPrimary: v('--accent'),
    colorPrimaryForeground: v('--accent-fg'),
    colorBackground: v('--panel'),
    colorForeground: v('--fg'),
    colorMuted: v('--panel-2'),
    colorMutedForeground: v('--muted'),
    colorInput: v('--bg'),
    colorInputForeground: v('--fg'),
    colorBorder: v('--line'),
    colorDanger: v('--k-err'),
    fontFamily: css.getPropertyValue('font-family'),
    borderRadius: '0.5rem',
  }
}

function useSiteTheme() {
  const [vars, setVars] = useState(readTheme)
  useEffect(() => {
    const mo = new MutationObserver(() => setVars(readTheme()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return vars
}

function Account({ publishableKey }: { publishableKey: string }) {
  const lang = useLang()
  const variables = useSiteTheme()
  const [status, setStatus] = useState<Status>('idle')
  const [slot, setSlot] = useState<HTMLElement | null>(() => document.getElementById('account-slot'))
  // the header can be re-created (e.g. switching pages); follow its slot
  useEffect(() => {
    const find = () => {
      const el = document.getElementById('account-slot')
      setSlot((prev) => (prev === el ? prev : el))
    }
    const mo = new MutationObserver(find)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
  return (
    <ClerkProvider publishableKey={publishableKey} localization={lang === 'es' ? esES : undefined} appearance={{ variables }} afterSignOutUrl={location.pathname}>
      <CloudSync onStatus={setStatus} />
      <StatusCtx.Provider value={status}>{slot && createPortal(<AccountButton />, slot)}</StatusCtx.Provider>
    </ClerkProvider>
  )
}

export function mountAccount(publishableKey: string) {
  const host = document.createElement('div')
  host.id = 'account-root'
  document.body.append(host)
  createRoot(host).render(<Account publishableKey={publishableKey} />)
}
