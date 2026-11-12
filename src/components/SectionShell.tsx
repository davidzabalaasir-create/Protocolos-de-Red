import { useEffect, useState, type ReactNode } from 'react'
import { useLang, useT } from '../i18n'
import { navigate } from '../lib/nav'
import { useProgress } from '../lib/progress'
import { lessonUrl } from '../lib/url'
import { Header } from './Header'
import { ProtocolDrawer } from './ProtocolDrawer'

type Theme = 'light' | 'dark'

/** Shared frame for the sections that are not a lesson (/subneteo/, /referencia/): same header, footer and protocol drawer as the lessons. */
export function SectionShell({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  const lang = useLang()
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) ?? 'dark')
  const [drawer, setDrawer] = useState(false)
  const [layer, setLayer] = useState<number | null>(null)
  const { progress } = useProgress()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('protocolos:theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])
  useEffect(() => {
    document.title = `${title} · Protocolos de Red`
    document.documentElement.lang = lang
  }, [title, lang])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
        {t('Saltar al contenido')}
      </a>
      <Header theme={theme} onTheme={setTheme} onOpenMenu={() => setDrawer(true)} />
      <main id="main" className="flex-1 px-3 py-3 sm:px-4">
        {children}
      </main>
      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        {t('Diseñado por')}{' '}
        <a href="https://github.com/davidzabalaasir-create" target="_blank" rel="noopener noreferrer" className="font-bold text-fg underline">
          David
        </a>{' '}
        · {t('Inspirado en Protocol Explorer · Hecho con React y Tailwind CSS')} ·{' '}
        <a href="/privacidad/" className="underline">
          {t('Privacidad')}
        </a>
      </footer>
      <ProtocolDrawer
        open={drawer}
        layer={layer}
        currentId=""
        progress={progress}
        onClose={() => {
          setDrawer(false)
          setLayer(null)
        }}
        onSelect={(id) => navigate(lessonUrl(id))}
        onLayer={setLayer}
      />
    </div>
  )
}
