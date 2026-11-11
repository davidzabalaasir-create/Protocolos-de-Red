import { useEffect, useState } from 'react'
import { useLang, useT } from '../../i18n'
import { useProgress } from '../../lib/progress'
import { lessonUrl } from '../../lib/url'
import { Header } from '../Header'
import { ProtocolDrawer } from '../ProtocolDrawer'
import { parseSubnetHash, SubnetPage } from './SubnetPage'

type Theme = 'light' | 'dark'

/** /subneteo/: same header and footer as the lessons, with the subnetting tools as content. */
export default function SubnetApp() {
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
    document.title = `${t('Subneteo')} · Protocolos de Red`
    document.documentElement.lang = lang
  }, [t, lang])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
        {t('Saltar al contenido')}
      </a>
      <Header theme={theme} onTheme={setTheme} onOpenMenu={() => setDrawer(true)} />
      <main id="main" className="flex-1 px-3 py-3 sm:px-4">
        <SubnetPage initial={parseSubnetHash(location.hash)} />
      </main>
      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        {t('Diseñado por')}{' '}
        <a href="https://github.com/davidzabalaasir-create" target="_blank" rel="noopener noreferrer" className="font-bold text-fg underline">
          David
        </a>{' '}
        · {t('Inspirado en Protocol Explorer · Hecho con React y Tailwind CSS')}
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
        onSelect={(id) => location.assign(lessonUrl(id))}
        onLayer={setLayer}
      />
    </div>
  )
}
