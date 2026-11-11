import { memo } from 'react'
import type { Protocol } from '../data/protocols'
import { nodeLabel, useLang, useT } from '../i18n'
import { nodeName, stageIndex, stagesFor } from '../lib/stages'

/** What the current stage achieves, with its numbers (packets, time, protocols, who talks). */
const GOALS: Record<string, string> = {
  'Resolución DNS': 'Averiguar la dirección IP a partir del nombre.',
  'Conexión TCP': 'Abrir una conexión fiable entre los dos extremos.',
  'Saludo seguro': 'Acordar claves y comprobar la identidad antes de enviar datos.',
  'Cierre de la conexión': 'Terminar la conversación y liberar la conexión.',
  'Intercambio {proto}': 'Intercambiar los mensajes de {proto}, el objetivo de la lección.',
  '{proto}: {a} ↔ {b}': 'Mensajes de {proto} entre {a} y {b}.',
}

export const StageCard = memo(function StageCard({ protocol, step }: { protocol: Protocol; step: number }) {
  const t = useT()
  const lang = useLang()
  const stages = stagesFor(protocol)
  const i = stageIndex(stages, step)
  if (i < 0 || stages.length < 2) return null
  const s = stages[i]
  const packets = protocol.packets.slice(s.from, s.to + 1)
  const label = (id: (typeof packets)[number]['from']) => nodeLabel(lang, id, nodeName(id))
  const vars = { proto: s.vars?.proto ?? packets[0].proto, a: s.pair ? label(s.pair[0]) : '', b: s.pair ? label(s.pair[1]) : '' }
  const ms = (packets[packets.length - 1].t - packets[0].t) * 1000
  const protos = [...new Set(packets.map((p) => p.proto))].join(', ')
  const ends = [...new Set(packets.flatMap((p) => [p.from, p.to]))].map(label).join(' · ')

  return (
    <section aria-label={t('Etapa actual')} className="mx-3 mb-2 rounded-md border border-line bg-panel-2 px-3 py-2 text-xs">
      <p className="font-bold tracking-wider uppercase">
        {t('Etapa {n} de {total}', { n: i + 1, total: stages.length })} · {t(s.title, vars)}
      </p>
      <p className="mt-0.5 text-muted">{t(GOALS[s.title], vars)}</p>
      <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-4">
        <div>
          <dt className="inline text-muted">{t('Paquetes')}: </dt>
          <dd className="inline font-bold">{packets.length}</dd>
        </div>
        <div>
          <dt className="inline text-muted">{t('Duración')}: </dt>
          <dd className="inline font-bold">{ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`}</dd>
        </div>
        <div>
          <dt className="inline text-muted">{t('Protocolos')}: </dt>
          <dd className="inline font-bold">{protos}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="inline text-muted">{t('Equipos')}: </dt>
          <dd className="inline font-bold">{ends}</dd>
        </div>
      </dl>
    </section>
  )
})
