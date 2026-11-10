import { ChevronLeft, ChevronRight, Route } from 'lucide-react'
import { displayName, useLang, useT } from '../i18n'
import { memo } from 'react'
import { PROTOCOLS } from '../data/protocols'
import { TOUR } from '../data/tour'
import { Button } from './ui/Button'

interface Props {
  currentId: string
  onSelect: (id: string) => void
  watched: string[]
}


/** Guided-path navigator; only shown while the current lesson belongs to the path. */
export const TourBar = memo(function TourBar({ currentId, onSelect, watched }: Props) {
  const t = useT()
  const lang = useLang()
  const nameOf = (id: string) => {
    const p = PROTOCOLS.find((x) => x.id === id)
    return p ? displayName(lang, p) : id
  }
  const i = TOUR.findIndex((t) => t.id === currentId)
  if (i < 0) return null
  const prev = TOUR[i - 1]
  const next = TOUR[i + 1]

  return (
    <nav aria-label={t('Recorrido guiado')} className="flex flex-wrap items-center gap-3 rounded-lg border border-accent bg-panel px-3 py-2">
      <Route aria-hidden className="size-5 shrink-0 text-accent dark:text-blue-300" />
      <div className="min-w-48 flex-1">
        <p className="text-xs font-bold tracking-widest uppercase">
          {t('Recorrido guiado')} · {i + 1}/{TOUR.length}
        </p>
        <p className="text-sm text-muted">{t(TOUR[i].why)}</p>
      </div>
      <ol aria-label={t('Lecciones del recorrido')} className="hidden gap-1 md:flex">
        {TOUR.map((stop, k) => (
          <li key={stop.id}>
            <button
              type="button"
              onClick={() => onSelect(stop.id)}
              aria-current={k === i ? 'step' : undefined}
              title={nameOf(stop.id)}
              className={`block size-3 rounded-full border border-line-strong aria-[current]:scale-125 aria-[current]:border-accent aria-[current]:bg-accent ${watched.includes(stop.id) ? 'bg-green-600 dark:bg-green-400' : 'bg-panel-2'}`}
            >
              <span className="sr-only">
                {k + 1}. {nameOf(stop.id)}
                {watched.includes(stop.id) ? t(' (vista)') : ''}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="flex gap-1.5">
        <Button size="sm" disabled={!prev} onClick={() => prev && onSelect(prev.id)} label={prev ? t('Anterior: {name}', { name: nameOf(prev.id) }) : undefined}>
          <ChevronLeft aria-hidden className="size-4" />
          <span className="sr-only sm:not-sr-only">{t('Anterior')}</span>
        </Button>
        <Button size="sm" variant="primary" disabled={!next} onClick={() => next && onSelect(next.id)} label={next ? t('Siguiente: {name}', { name: nameOf(next.id) }) : undefined}>
          {next ? nameOf(next.id) : t('Fin')}
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </nav>
  )
})
