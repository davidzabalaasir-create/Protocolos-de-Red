import { BookOpen, Binary, GraduationCap } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useT } from '../i18n'
import type { Protocol } from '../data/protocols'
import { Overview } from './Overview'
import { Quiz } from './Quiz'

const Inspector = lazy(() => import('./Inspector').then((m) => ({ default: m.Inspector })))

export type PanelTab = 'overview' | 'inspector' | 'quiz'

const TABS: [PanelTab, string, typeof BookOpen][] = [
  ['overview', 'Resumen', BookOpen],
  ['inspector', 'Inspector', Binary],
  ['quiz', 'Quiz', GraduationCap],
]

interface Props {
  protocol: Protocol
  step: number
  tab: PanelTab
  onTab: (t: PanelTab) => void
  done: boolean
  bestScore: number | undefined
  onScore: (score: number) => void
  onSelect: (id: string) => void
  onCompare: (id: string) => void
  onEmbed: () => void
}

export function SidePanel({ protocol, step, tab, onTab, done, bestScore, onScore, onSelect, onCompare, onEmbed }: Props) {
  const t = useT()
  const move = (dir: number) => {
    const i = TABS.findIndex(([id]) => id === tab)
    const next = TABS[(i + dir + TABS.length) % TABS.length][0]
    onTab(next)
    document.getElementById(`panel-tab-${next}`)?.focus()
  }

  return (
    <aside aria-label={t('Panel del protocolo')} className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel lg:sticky lg:top-3 lg:max-h-[calc(100dvh-1.5rem)]">
      <div role="tablist" aria-label={t('Secciones')} className="flex gap-0.5 border-b border-line p-1.5">
        {TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            id={`panel-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls="side-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => onTab(id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(1)
              else if (e.key === 'ArrowLeft') move(-1)
            }}
            className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-bold tracking-wider uppercase hover:bg-panel-2 aria-selected:bg-accent aria-selected:text-accent-fg"
          >
            <Icon aria-hidden className="size-4" />
            {t(label)}
          </button>
        ))}
      </div>
      <div id="side-panel" role="tabpanel" aria-labelledby={`panel-tab-${tab}`} className="flex flex-1 flex-col overflow-y-auto">
        {tab === 'overview' && <Overview protocol={protocol} done={done} onSelect={onSelect} onCompare={onCompare} onEmbed={onEmbed} />}
        {tab === 'inspector' && (
          <Suspense fallback={<p className="p-4 text-sm text-muted">{t('Cargando…')}</p>}>
            <Inspector packet={step >= 0 ? protocol.packets[step] : null} index={step} />
          </Suspense>
        )}
        {tab === 'quiz' && <Quiz key={protocol.id} protocolId={protocol.id} best={bestScore} onScore={onScore} />}
      </div>
    </aside>
  )
}
