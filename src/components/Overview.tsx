import { CircleCheckBig, Code, Columns2, TriangleAlert } from 'lucide-react'
import { memo } from 'react'
import { displayName, useLang, useT } from '../i18n'
import { Button } from './ui/Button'
import { PROTOCOLS, type Protocol } from '../data/protocols'

interface Actions {
  onSelect: (id: string) => void
  onCompare: (id: string) => void
  onEmbed: () => void
}

export const Overview = memo(function Overview({ protocol, done, onSelect, onCompare, onEmbed }: { protocol: Protocol; done: boolean } & Actions) {
  const t = useT()
  const lang = useLang()
  const failures = PROTOCOLS.filter((p) => p.failureOf === protocol.id)
  const normal = protocol.failureOf ? PROTOCOLS.find((p) => p.id === protocol.failureOf) : undefined
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
      <div className="flex flex-col gap-2">
        {failures.map((f) => (
          <Button key={f.id} size="sm" onClick={() => onSelect(f.id)}>
            <TriangleAlert aria-hidden className="size-4 text-[var(--k-err)]" />
            {t('Ver qué pasa si falla: {name}', { name: displayName(lang, f) })}
          </Button>
        ))}
        {normal && (
          <Button size="sm" onClick={() => onSelect(normal.id)}>
            <CircleCheckBig aria-hidden className="size-4 text-[var(--k-tcp)]" />
            {t('Volver a la lección normal: {name}', { name: displayName(lang, normal) })}
          </Button>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => onCompare(protocol.id)}>
            <Columns2 aria-hidden className="size-4" />
            {t('Comparar')}
          </Button>
          <Button size="sm" variant="ghost" onClick={onEmbed}>
            <Code aria-hidden className="size-4" />
            {t('Incrustar')}
          </Button>
        </div>
      </div>
    </div>
  )
})
