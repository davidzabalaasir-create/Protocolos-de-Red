import { Check, RotateCcw, X } from 'lucide-react'
import { memo, useEffect, useId, useState } from 'react'
import { QUIZ } from '../data/quiz'
import { Button } from './ui/Button'

interface Props {
  protocolId: string
  best: number | undefined
  onScore: (score: number) => void
}

export const Quiz = memo(function Quiz({ protocolId, best, onScore }: Props) {
  const questions = QUIZ[protocolId] ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const baseId = useId()

  const answered = answers.filter((a) => a !== null).length
  const score = answers.filter((a, i) => a === questions[i]?.answer).length
  const finished = answered === questions.length && questions.length > 0

  const choose = (qi: number, oi: number) => setAnswers((prev) => (prev[qi] !== null ? prev : prev.map((a, i) => (i === qi ? oi : a))))

  useEffect(() => {
    if (finished) onScore(score)
  }, [finished, score, onScore])

  if (!questions.length) return <p className="p-4 text-sm text-muted">Aún no hay preguntas para este protocolo.</p>

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      <p className="text-muted">
        Comprueba lo que has aprendido. {best !== undefined && <>Mejor resultado: <strong className="text-fg">{best}/{questions.length}</strong>.</>}
      </p>

      {questions.map((q, qi) => {
        const chosen = answers[qi]
        const legendId = `${baseId}-${qi}`
        return (
          <fieldset key={qi} className="rounded-lg border border-line p-3">
            <legend id={legendId} className="px-1 font-bold">
              {qi + 1}. {q.q}
            </legend>
            <div className="mt-2 flex flex-col gap-1.5">
              {q.options.map((o, oi) => {
                const isRight = oi === q.answer
                const state = chosen === null ? 'idle' : isRight ? 'right' : chosen === oi ? 'wrong' : 'idle'
                return (
                  <button
                    key={oi}
                    type="button"
                    aria-pressed={chosen === oi}
                    aria-disabled={chosen !== null}
                    onClick={() => choose(qi, oi)}
                    className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left ${
                      state === 'right'
                        ? 'border-green-600 bg-green-600/15'
                        : state === 'wrong'
                          ? 'border-red-600 bg-red-600/15'
                          : chosen === null
                            ? 'border-line-strong hover:border-accent hover:bg-panel-2'
                            : 'border-line opacity-70'
                    }`}
                  >
                    {state === 'right' && <Check aria-hidden className="size-4 shrink-0 text-green-700 dark:text-green-400" />}
                    {state === 'wrong' && <X aria-hidden className="size-4 shrink-0 text-red-700 dark:text-red-400" />}
                    <span>{o}</span>
                    {state === 'right' && <span className="sr-only">(correcta)</span>}
                    {state === 'wrong' && <span className="sr-only">(incorrecta)</span>}
                  </button>
                )
              })}
            </div>
            {chosen !== null && (
              <p role="status" className="mt-2 text-xs text-muted">
                <strong className={chosen === q.answer ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                  {chosen === q.answer ? '¡Correcto! ' : 'No exactamente. '}
                </strong>
                {q.why}
              </p>
            )}
          </fieldset>
        )
      })}

      {finished && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel-2 p-3">
          <span>
            Resultado: <strong>{score}/{questions.length}</strong> {score === questions.length ? '· ¡Perfecto!' : ''}
          </span>
          <Button size="sm" onClick={() => setAnswers(questions.map(() => null))}>
            <RotateCcw aria-hidden className="size-4" />
            Repetir
          </Button>
        </div>
      )}
    </div>
  )
})
