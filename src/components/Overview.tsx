import { memo } from 'react'
import type { Protocol } from '../data/protocols'

export const Overview = memo(function Overview({ protocol }: { protocol: Protocol }) {
  return (
    <aside aria-labelledby="overview-title" className="flex flex-col rounded-lg border border-line bg-panel">
      <h2 id="overview-title" className="border-b border-line px-4 py-3 text-base font-bold tracking-widest uppercase">
        Vista general
      </h2>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-3xl font-bold">{protocol.name}</p>
          <span className="inline-flex items-center gap-1.5 rounded border border-green-700 px-2 py-1 text-[11px] font-bold tracking-wider text-green-800 uppercase dark:border-green-500 dark:text-green-300">
            <span aria-hidden className="size-2 rounded-full bg-current" />
            Activo
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
    </aside>
  )
})
