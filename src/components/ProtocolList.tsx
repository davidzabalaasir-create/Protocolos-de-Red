import { BookMarked, CircleCheck, GraduationCap, Network, Route, SquareTerminal } from 'lucide-react'
import { memo } from 'react'
import { OSI_LAYERS, PROTOCOLS } from '../data/protocols'
import { QUIZ_COUNT } from '../data/quiz-count'
import { TOUR } from '../data/tour'
import { displayName, fullName, useLang, useT } from '../i18n'
import { appLinkClick, prefetchSection } from '../lib/nav'
import { isDone, type Progress } from '../lib/progress'
import { Button } from './ui/Button'

interface Props {
  onExam?: () => void
  layer: number | null
  currentId: string
  progress: Progress
  onSelect: (id: string) => void
  onLayer: (layer: number | null) => void
}

export const doneCount = (progress: Progress) => PROTOCOLS.filter((p) => isDone(progress, p.id, QUIZ_COUNT[p.id] ?? 0)).length

/** Completion counter + bar, shared by the drawer and the sidebar. */
export function ListProgress({ progress }: { progress: Progress }) {
  const t = useT()
  const done = doneCount(progress)
  return (
    <>
      <p className="mt-1 text-xs text-muted">{t('{done}/{total} completados', { done, total: PROTOCOLS.length })}</p>
      <div aria-hidden className="mt-1.5 h-1 w-40 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(done / PROTOCOLS.length) * 100}%` }} />
      </div>
    </>
  )
}

/** Lessons grouped by OSI layer, with the layer filter and the guided-tour shortcut. */
export const ProtocolList = memo(function ProtocolList({ layer, currentId, progress, onSelect, onLayer, onExam }: Props) {
  const t = useT()
  const lang = useLang()
  const layers = [7, 6, 5, 4, 3, 2, 1].filter((l) => (layer === null || l === layer) && PROTOCOLS.some((p) => p.layer === l))

  return (
    <>
      {layer !== null && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2 text-xs">
          <span>{t('Filtrado: capa {l} · {name}', { l: layer, name: t(OSI_LAYERS[layer]) })}</span>
          <Button variant="ghost" size="sm" onClick={() => onLayer(null)}>
            {t('Ver todas')}
          </Button>
        </div>
      )}

      <div className="border-b border-line p-3">
        <Button variant="primary" className="w-full" onClick={() => onSelect(TOUR[0].id)}>
          <Route aria-hidden className="size-4" />
          {t('Empezar el recorrido guiado ({n} lecciones)', { n: TOUR.length })}
        </Button>
        {onExam && (
          <Button className="mt-2 w-full" onClick={onExam}>
            <GraduationCap aria-hidden className="size-4" />
            {t('Modo examen')}
          </Button>
        )}
        <a
          href="/subneteo/"
          onClick={appLinkClick}
          onPointerEnter={prefetchSection('subneteo')}
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-panel px-4 text-sm font-bold shadow-sm hover:border-accent hover:bg-panel-2"
        >
          <Network aria-hidden className="size-4" />
          {t('Calculadora de subredes')}
        </a>
        <a
          href="/referencia/"
          onClick={appLinkClick}
          onPointerEnter={prefetchSection('referencia')}
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-panel px-4 text-sm font-bold shadow-sm hover:border-accent hover:bg-panel-2"
        >
          <BookMarked aria-hidden className="size-4" />
          {t('Chuleta y flashcards')}
        </a>
        <a
          href="/consola/"
          onClick={appLinkClick}
          onPointerEnter={prefetchSection('consola')}
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-panel px-4 text-sm font-bold shadow-sm hover:border-accent hover:bg-panel-2"
        >
          <SquareTerminal aria-hidden className="size-4" />
          {t('Consola de comandos')}
        </a>
      </div>

      <nav aria-label={t('Lista de protocolos')} className="p-2">
        {layers.map((l) => (
          <section key={l} className="mb-3">
            <h3 className="px-2 py-2 text-[11px] font-bold tracking-widest text-muted uppercase">{t('Capa {l} · {name}', { l, name: t(OSI_LAYERS[l]) })}</h3>
            <ul>
              {PROTOCOLS.filter((p) => p.layer === l).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-current={p.id === currentId ? 'true' : undefined}
                    onClick={() => onSelect(p.id)}
                    className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left hover:bg-panel-2 aria-[current]:bg-accent aria-[current]:text-accent-fg"
                  >
                    <span className="flex items-center gap-2 font-bold">
                      {displayName(lang, p)}
                      {isDone(progress, p.id, QUIZ_COUNT[p.id] ?? 0) && (
                        <CircleCheck aria-label={t('completado')} className="size-4 text-green-700 aria-[current]:text-current dark:text-green-400" />
                      )}
                    </span>
                    <span className="truncate text-xs text-muted group-aria-[current]:text-accent-fg">{fullName(lang, p)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {layers.length === 0 && <p className="p-3 text-sm text-muted">{t('Todavía no hay lecciones para esta capa.')}</p>}
      </nav>
    </>
  )
})
