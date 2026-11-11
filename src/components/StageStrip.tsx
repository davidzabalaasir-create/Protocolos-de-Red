import { Check } from 'lucide-react'
import { memo } from 'react'
import type { Protocol } from '../data/protocols'
import { nodeLabel, useLang, useT } from '../i18n'
import { nodeName, stageIndex, stagesFor } from '../lib/stages'

interface Props {
  protocol: Protocol
  step: number
  onStep: (i: number) => void
}

/** Numbered stages of the lesson; the current one is highlighted and each jumps to its first packet. */
export const StageStrip = memo(function StageStrip({ protocol, step, onStep }: Props) {
  const t = useT()
  const lang = useLang()
  const stages = stagesFor(protocol)
  if (stages.length < 2) return null
  const current = stageIndex(stages, step)

  return (
    <ol aria-label={t('Etapas de la lección')} className="mx-3 mb-2 flex flex-wrap gap-1.5">
      {stages.map((s, i) => {
        const title = s.pair
          ? t(s.title, { proto: s.vars!.proto, a: nodeLabel(lang, s.pair[0], nodeName(s.pair[0])), b: nodeLabel(lang, s.pair[1], nodeName(s.pair[1])) })
          : t(s.title, s.vars)
        const done = step > s.to
        const active = i === current
        return (
          <li key={s.from}>
            <button
              type="button"
              onClick={() => onStep(s.from)}
              aria-current={active ? 'step' : undefined}
              title={protocol.packets[s.from].note}
              className="flex min-h-9 items-center gap-2 rounded-md border border-line-strong bg-panel px-2 text-left text-[11px] font-bold tracking-wider uppercase hover:border-accent aria-[current]:border-accent aria-[current]:bg-accent aria-[current]:text-accent-fg"
            >
              <span
                aria-hidden
                className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${done ? 'bg-green-700 text-white dark:bg-green-400 dark:text-[#0b1020]' : 'border border-current'}`}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span>{title}</span>
              {done && <span className="sr-only">{t('(completada)')}</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
})
