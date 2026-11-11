import { Check, Printer, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PROTOCOLS } from '../data/protocols'
import { QUIZ, type Question } from '../data/quiz'
import { displayName, LESSONS_EN, useLang, useT } from '../i18n'
import type { Progress } from '../lib/progress'
import { Button } from './ui/Button'

const N = 10

/** Deterministic shuffle so a given seed always gives the same exam. */
function shuffle<T>(items: T[], seed: number) {
  const a = [...items]
  let x = seed || 1
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) & 0x7fffffff
    const j = x % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Props {
  progress: Progress
  onClose: () => void
}

/** Ten questions across lessons (the ones you have watched first), a score and a printable sheet. */
export function Exam({ progress, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  const [seed, setSeed] = useState(() => Date.now() % 100000)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')

  const pool = useMemo(() => {
    const watched = PROTOCOLS.filter((p) => progress.watched.includes(p.id))
    const lessons = watched.length >= 5 ? watched : PROTOCOLS
    const all = lessons.flatMap((p) => {
      const qs: Question[] = (lang === 'en' ? LESSONS_EN[p.id]?.quiz : undefined) ?? QUIZ[p.id] ?? []
      return qs.map((q) => ({ q, lesson: p }))
    })
    return shuffle(all, seed).slice(0, N)
  }, [seed, lang, progress.watched])

  const score = pool.filter((x, i) => answers[i] === x.q.answer).length
  const complete = Object.keys(answers).length === pool.length
  const restart = () => {
    setSeed((s) => s + 1)
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="exam-title" className="exam m-auto max-h-[94dvh] w-[min(96vw,52rem)] max-w-none rounded-lg border border-line bg-panel p-0 text-fg">
      <div className="no-print flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id="exam-title" className="text-sm font-bold tracking-widest uppercase">
          {t('Modo examen')}
        </h2>
        <Button variant="ghost" size="icon" label={t('Cerrar examen')} shortcut="Esc" onClick={onClose}>
          <X aria-hidden className="size-5" />
        </Button>
      </div>

      <div className="no-print flex flex-col gap-3 p-4 text-sm">
        <p className="text-muted">
          {progress.watched.length >= 5
            ? t('{n} preguntas de las lecciones que ya has visto.', { n: pool.length })
            : t('{n} preguntas de todo el catálogo (cuando veas 5 lecciones, el examen se centrará en ellas).', { n: pool.length })}
        </p>
        <ol className="flex flex-col gap-3">
          {pool.map(({ q, lesson }, qi) => {
            const chosen = answers[qi]
            return (
              <li key={qi}>
                <fieldset className="rounded-lg border border-line p-3">
                  <legend className="px-1 font-bold">
                    {qi + 1}. {q.q} <span className="font-normal text-muted">· {displayName(lang, lesson)}</span>
                  </legend>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {q.options.map((o, oi) => {
                      const state = !submitted ? (chosen === oi ? 'picked' : 'idle') : oi === q.answer ? 'right' : chosen === oi ? 'wrong' : 'idle'
                      return (
                        <button
                          key={oi}
                          type="button"
                          role="radio"
                          aria-checked={chosen === oi}
                          disabled={submitted}
                          onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                          className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left ${
                            state === 'picked'
                              ? 'border-accent bg-accent/10'
                              : state === 'right'
                                ? 'border-green-600 bg-green-600/15'
                                : state === 'wrong'
                                  ? 'border-red-600 bg-red-600/15'
                                  : 'border-line-strong hover:border-accent'
                          }`}
                        >
                          {state === 'right' && <Check aria-hidden className="size-4 shrink-0 text-green-700 dark:text-green-400" />}
                          {state === 'wrong' && <X aria-hidden className="size-4 shrink-0 text-red-700 dark:text-red-400" />}
                          <span>{o}</span>
                        </button>
                      )
                    })}
                  </div>
                  {submitted && <p className="mt-2 text-xs text-muted">{q.why}</p>}
                </fieldset>
              </li>
            )
          })}
        </ol>

        {!submitted ? (
          <Button variant="primary" disabled={!complete} onClick={() => setSubmitted(true)}>
            {complete ? t('Corregir examen') : t('Responde todas las preguntas ({n}/{total})', { n: Object.keys(answers).length, total: pool.length })}
          </Button>
        ) : (
          <div role="status" className="flex flex-col gap-3 rounded-lg border border-accent bg-panel-2 p-3">
            <p className="text-base font-bold">
              {t('Nota: {score}/{total}', { score, total: pool.length })} · {score >= 9 ? t('¡Excelente!') : score >= 5 ? t('Aprobado') : t('Sigue practicando')}
            </p>
            <label className="flex flex-col gap-1 text-xs font-bold tracking-wider uppercase">
              {t('Nombre para la ficha (opcional)')}
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="min-h-11 rounded-lg border border-line-strong bg-panel px-3 text-sm font-normal normal-case tracking-normal" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => window.print()}>
                <Printer aria-hidden className="size-4" />
                {t('Imprimir o guardar en PDF')}
              </Button>
              <Button onClick={restart}>
                <RotateCcw aria-hidden className="size-4" />
                {t('Otro examen')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {submitted && (
        <section className="print-only" aria-hidden>
          <h1>Protocolos de Red</h1>
          <h2>{t('Ficha de resultados')}</h2>
          {name && <p className="print-name">{name}</p>}
          <p className="print-score">{t('Nota: {score}/{total}', { score, total: pool.length })}</p>
          <p>{new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <ol>
            {pool.map(({ q, lesson }, i) => (
              <li key={i}>
                {answers[i] === q.answer ? '✓' : '✗'} {displayName(lang, lesson)}: {q.q}
              </li>
            ))}
          </ol>
          <p className="print-foot">protocolos-de-red-eight.vercel.app · {t('Diseñado por')} David</p>
        </section>
      )}
    </dialog>
  )
}
