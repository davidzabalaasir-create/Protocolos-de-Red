import { memo } from 'react'
import { useT } from '../i18n'
import type { Protocol } from '../data/protocols'

export const Overview = memo(function Overview({ protocol, done }: { protocol: Protocol; done: boolean }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-3xl font-bold">{protocol.name}</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-bold tracking-wider uppercase ${
            done ? 'border-accent text-accent dark:text-blue-300' : 'border-green-700 text-green-800 dark:border-green-500 dark:text-green-300'
          }`}
        >
          <span aria-hidden className="size-2 rounded-full bg-current" />
          {done ? t('Completado') : t('Activo')}
        </span>
      </div>
      <p className="font-bold">{protocol.full}</p>
      <p className="text-sm leading-relaxed text-muted">{protocol.description}</p>
      <dl className="divide-y divide-line border-y border-line text-sm">
        {protocol.facts.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2">
            <dt className="text-[11px] font-bold tracking-wider uppercase">{k}</dt>
            <dd className="text-muted">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
})
