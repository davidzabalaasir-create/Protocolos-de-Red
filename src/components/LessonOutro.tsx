import { ArrowRight, GraduationCap, PartyPopper, RotateCcw } from 'lucide-react'
import type { Protocol } from '../data/protocols'
import { useT } from '../i18n'
import { stagesFor } from '../lib/stages'
import { Button } from './ui/Button'

interface Props {
  protocol: Protocol
  onReplay: () => void
  onQuiz: () => void
  next: { id: string; name: string } | null
  onNext: (id: string) => void
}

/** Shown when the last packet has been played: a short recap and where to go next. */
export function LessonOutro({ protocol, onReplay, onQuiz, next, onNext }: Props) {
  const t = useT()
  const packets = protocol.packets.length
  const stages = Math.max(stagesFor(protocol).length, 1)
  const seconds = protocol.packets[packets - 1].t
  return (
    <section aria-labelledby="outro-title" className="mx-3 mb-2 rounded-lg border border-accent bg-panel-2 p-3">
      <h3 id="outro-title" className="flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
        <PartyPopper aria-hidden className="size-4 text-accent dark:text-blue-300" />
        {t('Lección completada')}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {t('{name}: {packets} paquetes en {stages} etapas, {seconds} s de principio a fin.', {
          name: protocol.name,
          packets,
          stages,
          seconds: seconds < 1 ? seconds.toFixed(3) : seconds.toFixed(1),
        })}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={onQuiz}>
          <GraduationCap aria-hidden className="size-4" />
          {t('Ponte a prueba')}
        </Button>
        {next && (
          <Button size="sm" onClick={() => onNext(next.id)}>
            {t('Siguiente: {name}', { name: next.name })}
            <ArrowRight aria-hidden className="size-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onReplay}>
          <RotateCcw aria-hidden className="size-4" />
          {t('Repetir')}
        </Button>
      </div>
    </section>
  )
}
